import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/middleware";

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.valid) {
      return auth.error;
    }

    const containers = await prisma.container.findMany({
      include: {
        wasteCategory: true,
        location: {
          include: {
            campus: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      total: containers.length,
      containers: containers.map((container) => ({
        id: container.id,
        containerCode: container.containerCode,
        tareWeight: container.tareWeight,
        volumeLiters: container.volumeLiters,
        status: container.status,
        qrGenerated: container.qrGenerated,
        createdAt: container.createdAt,
        wasteCategory: {
          id: container.wasteCategory.id,
          name: container.wasteCategory.name,
          color: container.wasteCategory.color,
        },
        location: {
          id: container.location.id,
          name: container.location.name,
          sector: container.location.sector,
          campus: {
            id: container.location.campus.id,
            name: container.location.campus.name,
            code: container.location.campus.code,
          },
        },
      })),
    });
  } catch (error) {
    console.error("Error en GET containers:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}