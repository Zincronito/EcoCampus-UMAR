import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export async function verifyAuth(req: NextRequest) {
  console.log("Headers recibidos:", req.headers);
  const authHeader = req.headers.get("authorization");
  console.log("Auth header:", authHeader);
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      ),
      user: null,
    };
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      ),
      user: null,
    };
  }

  return {
    valid: true,
    error: null,
    user: payload,
  };
}