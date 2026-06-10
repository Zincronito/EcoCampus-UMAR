import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";
import { verifyPin } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    console.log("📍 Iniciando login...");
    
    const body = await req.json();
    console.log("📍 Body recibido:", body);
    
    const { employeeId, pin } = body;

    if (!employeeId || !pin) {
      return NextResponse.json(
        { error: "employeeId y pin requeridos" },
        { status: 400 }
      );
    }

    console.log("📍 Buscando usuario:", employeeId);
    const user = await prisma.user.findUnique({
      where: { employeeId },
    });
    console.log("📍 Usuario encontrado:", user);

    if (!user || !user.hashedPin) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    console.log("📍 Verificando PIN...");
    const pinValid = await verifyPin(pin, user.hashedPin);
    console.log("📍 PIN válido:", pinValid);
    
    if (!pinValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    console.log("📍 Creando token...");
    const token = await createToken(user.id, user.role);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: String(error) },
      { status: 500 }
    );
  }
}