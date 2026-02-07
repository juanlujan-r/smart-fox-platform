import { type NextRequest } from "next/server"
import { updateSession } from "./src/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match dashboard and auth routes; exclude static files and API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}