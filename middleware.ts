import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/admin/login')
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl))
    }
    return null
  }

  if (isAdminRoute && !isLoggedIn) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/admin/login?from=${encodeURIComponent(from)}`, req.nextUrl)
    );
  }

  return null
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
