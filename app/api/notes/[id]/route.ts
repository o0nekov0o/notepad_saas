import { and, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth-session'
import { notes } from '@/lib/schema'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getSession(request)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await request.json()
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid note data' }, { status: 400 })
  }

  const { title, content } = body as Record<string, unknown>
  const values: { title?: string; content?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  }
  if (typeof title === 'string') values.title = title
  if (typeof content === 'string') values.content = content
  if (values.title === undefined && values.content === undefined) {
    return Response.json({ error: 'Invalid note data' }, { status: 400 })
  }

  const { id } = await params
  const [note] = await getDb()
    .update(notes)
    .set(values)
    .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
    .returning()

  if (!note) return Response.json({ error: 'Note not found' }, { status: 404 })
  return Response.json(note)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await getSession(request)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [note] = await getDb()
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
    .returning({ id: notes.id })

  if (!note) return Response.json({ error: 'Note not found' }, { status: 404 })
  return Response.json({ success: true })
}