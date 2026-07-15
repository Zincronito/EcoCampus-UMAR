import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirigir /api/v1 al backend externo
  if (pathname.startsWith("/api/v1")) {
    // Lee la variable de entorno, si no existe, usa localhost por defecto (para entorno local)
    const backendHost = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    
    // Construye la URL final. Ojo: pathname ya incluye "/api/v1"
    const backendUrl = `${backendHost}${pathname}${request.nextUrl.search}`;
    
    // Limpiamos los headers originales que puedan causar conflicto
    const headers = new Headers(request.headers);
    headers.delete("host"); // Dejamos que fetch asigne el host correcto automáticamente

    return fetch(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : undefined,
    });
  }

  // Verificar token para otras rutas
  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ecocampus_token");
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};