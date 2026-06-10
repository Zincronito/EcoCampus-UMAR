import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";
import { verifyPin } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, pin } = body;

    if (!employeeId || !pin) {
      return NextResponse.json(
        { error: "employeeId y pin requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { employeeId },
    });

    if (!user || !user.hashedPin) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Verificar PIN
    const pinValid = await verifyPin(pin, user.hashedPin);
    if (!pinValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Generar token
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
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}