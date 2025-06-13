import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo manejar la ruta raíz
  if (pathname === "/") {
    // Verificar si el usuario está logueado
    const isLoggedIn = request.cookies.get("isLoggedIn")?.value === "true"

    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/invoices", request.url))
    } else {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Solo aplicar middleware a la ruta raíz
     */
    "/",
  ],
}
