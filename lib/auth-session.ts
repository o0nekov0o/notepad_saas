import { getAuth } from '@/lib/auth'

export function getSession(request: Request) {
  return getAuth().api.getSession({ headers: request.headers })
}