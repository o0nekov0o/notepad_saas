import { loadEnvConfig } from '@next/env'
import { parse } from 'csv-parse/sync'
import { parse as parseSql, type Expr, type InsertStatement } from 'pgsql-ast-parser'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from '../lib/schema'
import { notes, user } from '../lib/schema'

type CsvRow = Record<string, string>

function optionPath(name: string, fallback: string) {
  const index = process.argv.indexOf(name)
  return resolve(index === -1 ? fallback : process.argv[index + 1] ?? fallback)
}

async function readCsv(path: string, requiredColumns: string[]) {
  const contents = await readFile(path, 'utf8')
  const [rawHeaders, ...records] = parse(contents, {
    bom: true,
    skip_empty_lines: true,
  }) as string[][]

  if (!rawHeaders?.length) {
    throw new Error(`${path} is empty or has no header row.`)
  }

  const headers = rawHeaders.map((header) => header.trim())
  const missingColumns = requiredColumns.filter((column) => !headers.includes(column))
  if (missingColumns.length > 0) {
    throw new Error(`${path} is missing columns: ${missingColumns.join(', ')}`)
  }

  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])) as CsvRow,
  )
}

function sqlLiteral(expression: Expr, column: string) {
  if (expression.type === 'string') return expression.value
  if (expression.type === 'null') return ''
  throw new Error(`SQL export column ${column} contains an unsupported expression.`)
}

async function readSqlNotes(path: string) {
  const statements = parseSql(await readFile(path, 'utf8'))
  const inserts: InsertStatement[] = []

  for (const statement of statements) {
    if (statement.type !== 'insert') {
      throw new Error(`${path} must contain only INSERT statements.`)
    }
    inserts.push(statement)
  }

  if (inserts.length === 0) throw new Error(`${path} contains no INSERT statements.`)

  const requiredColumns = ['id', 'user_id', 'title', 'content', 'created_at', 'updated_at']
  const records: CsvRow[] = []

  for (const insert of inserts) {
    if (insert.into.name !== 'notes' || (insert.into.schema && insert.into.schema !== 'public')) {
      throw new Error(`${path} may only insert rows into public.notes.`)
    }
    if (insert.insert.type !== 'values' || !insert.columns?.length) {
      throw new Error(`${path} must use INSERT INTO public.notes (columns) VALUES (...).`)
    }

    const columns = insert.columns.map((column) => column.name)
    const missingColumns = requiredColumns.filter((column) => !columns.includes(column))
    if (missingColumns.length > 0) {
      throw new Error(`${path} is missing columns: ${missingColumns.join(', ')}`)
    }

    for (const values of insert.insert.values) {
      if (values.length !== columns.length) {
        throw new Error(`${path} has a VALUES row with a different number of columns.`)
      }
      records.push(
        Object.fromEntries(
          requiredColumns.map((column) => {
            const index = columns.indexOf(column)
            return [column, sqlLiteral(values[index], column)]
          }),
        ) as CsvRow,
      )
    }
  }

  return records
}

async function readNotes(path: string) {
  return path.toLowerCase().endsWith('.sql')
    ? readSqlNotes(path)
    : readCsv(path, ['id', 'user_id', 'title', 'content', 'created_at', 'updated_at'])
}

function parseDate(value: string, column: string, noteId: string) {
  if (!value) return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Note ${noteId} has an invalid ${column} value.`)
  }

  return date
}

async function main() {
  loadEnvConfig(process.cwd())

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not configured.')

  const usersPath = optionPath('--users', '.migration/users.csv')
  const defaultNotesPath = existsSync('.migration/notes.sql')
    ? '.migration/notes.sql'
    : '.migration/notes.csv'
  const notesPath = optionPath('--notes', defaultNotesPath)
  const replaceNotes = process.argv.includes('--replace-notes')
  const [legacyUsers, legacyNotes] = await Promise.all([
    readCsv(usersPath, ['id', 'email']),
    readNotes(notesPath),
  ])

  const oldUserEmailById = new Map<string, string>()
  for (const oldUser of legacyUsers) {
    const id = oldUser.id.trim()
    const email = oldUser.email.trim().toLowerCase()
    if (!id || !email) throw new Error('The users export contains an empty id or email.')
    if (oldUserEmailById.has(id)) throw new Error(`Duplicate user id in export: ${id}`)
    oldUserEmailById.set(id, email)
  }

  const noteIds = new Set<string>()
  for (const note of legacyNotes) {
    const id = note.id.trim()
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error(`Note id is not a UUID: ${id || '(empty)'}`)
    }
    if (noteIds.has(id)) throw new Error(`Duplicate note id in export: ${id}`)
    if (!oldUserEmailById.has(note.user_id.trim())) {
      throw new Error(`No exported Supabase user matches note ${id}.`)
    }
    noteIds.add(id)
  }

  const db = drizzle(neon(databaseUrl), { schema })
  const newUsers = await db.select({ id: user.id, email: user.email }).from(user)
  const newUserIdByEmail = new Map<string, string>()
  for (const newUser of newUsers) {
    const email = newUser.email.trim().toLowerCase()
    if (newUserIdByEmail.has(email)) {
      throw new Error(`More than one Neon account matches ${email}. Resolve duplicate emails first.`)
    }
    newUserIdByEmail.set(email, newUser.id)
  }

  const unmatchedUserIds = new Set<string>()
  const importedNotes = legacyNotes.map((oldNote) => {
    const oldUserId = oldNote.user_id.trim()
    const email = oldUserEmailById.get(oldUserId)!
    const newUserId = newUserIdByEmail.get(email)
    if (!newUserId) unmatchedUserIds.add(oldUserId)

    const createdAt = parseDate(oldNote.created_at, 'created_at', oldNote.id)
    const updatedAt = parseDate(oldNote.updated_at, 'updated_at', oldNote.id)

    return {
      id: oldNote.id.trim(),
      userId: newUserId ?? '',
      title: oldNote.title,
      content: oldNote.content,
      ...(createdAt ? { createdAt } : {}),
      ...(updatedAt ? { updatedAt } : {}),
    }
  })

  if (unmatchedUserIds.size > 0) {
    const unmatchedEmails = [...unmatchedUserIds]
      .map((id) => oldUserEmailById.get(id)!)
      .map((email) => `- ${email}`)
      .join('\n')

    throw new Error(
      `${unmatchedUserIds.size} Supabase user(s) have no Neon account yet:\n${unmatchedEmails}\nHave them sign up with the same email, then rerun the import. No notes were imported.`,
    )
  }

  if (replaceNotes && importedNotes.length === 0) {
    throw new Error('The notes export is empty. Refusing to clear the Neon notes table.')
  }

  if (replaceNotes) {
    const client = neon(databaseUrl)
    await client.transaction((transaction) => [
      transaction`DELETE FROM "notes"`,
      ...importedNotes.map((note) => transaction`
        INSERT INTO "notes" (
          "id", "user_id", "title", "content", "created_at", "updated_at"
        ) VALUES (
          ${note.id},
          ${note.userId},
          ${note.title},
          ${note.content},
          COALESCE(${note.createdAt ?? null}::timestamptz, NOW()),
          COALESCE(${note.updatedAt ?? null}::timestamptz, NOW())
        )
      `),
    ])

    console.log(`Replaced all Neon notes with ${importedNotes.length} note(s) from the Supabase export.`)
    return
  }

  const batchSize = 200
  for (let offset = 0; offset < importedNotes.length; offset += batchSize) {
    const batch = importedNotes.slice(offset, offset + batchSize)
    await db
      .insert(notes)
      .values(batch)
      .onConflictDoUpdate({
        target: notes.id,
        set: {
          userId: sql`excluded.user_id`,
          title: sql`excluded.title`,
          content: sql`excluded.content`,
          createdAt: sql`excluded.created_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
  }

  console.log(`Imported or updated ${importedNotes.length} note(s) for registered Neon users.`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})