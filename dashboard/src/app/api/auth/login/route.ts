import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";
import { verifyPin } from "@/lib/password";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, pin } = body;

    if (!employeeId || !pin) {
      const response = NextResponse.json(
        { error: "employeeId y pin requeridos" },
        { status: 400 }
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const user = await prisma.user.findUnique({
      where: { employeeId },
    });

    if (!user || !user.hashedPin) {
      const response = NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const pinValid = await verifyPin(pin, user.hashedPin);
    if (!pinValid) {
      const response = NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const token = await createToken(user.id, user.role);

    const response = NextResponse.json({
      token,
      user: {
        id: user.id,
        employeeId: user.employeeId,
        fullName: user.fullName,
        role: user.role,
      },
    });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  } catch (error) {
    console.error("❌ Error en login:", error);
    const response = NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}