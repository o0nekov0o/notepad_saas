import { and, asc, eq, ilike } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth-session'
import { notes } from '@/lib/schema'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await getSession(request)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const search = new URL(request.url).searchParams.get('search')
  const conditions = [eq(notes.userId, session.user.id)]
  if (search) conditions.push(ilike(notes.content, `%${search}%`))

  const data = await getDb()
    .select()
    .from(notes)
    .where(and(...conditions))
    .orderBy(asc(notes.createdAt))

  return Response.json(data)
}

export async function POST(request: Request) {
  const session = await getSession(request)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const [note] = await getDb()
    .insert(notes)
    .values({ userId: session.user.id, title: 'New note', content: '' })
    .returning()

  return Response.json(note, { status: 201 })
}