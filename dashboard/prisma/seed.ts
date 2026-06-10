import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Crear campus
  const campus = await prisma.campus.create({
    data: {
      name: "Campus Central",
      code: "CC",
      address: "Oaxaca, México",
    },
  });

  // Crear ubicación
  const location = await prisma.location.create({
    data: {
      name: "Plaza Central",
      sector: "Bloque A",
      campusId: campus.id,
    },
  });

  // Crear categoría
  const category = await prisma.wasteCategory.create({
    data: {
      name: "Orgánico",
      color: "#97C459",
      description: "Residuos orgánicos",
    },
  });

  // Crear usuario admin
  const hashedPin = await bcrypt.hash("1234", 10);
  const admin = await prisma.user.create({
    data: {
      employeeId: "ADMIN-001",
      fullName: "Administrador",
      email: "admin@ecocampus.edu",
      hashedPin,
      role: "admin",
    },
  });

  // Crear usuario recolector
  const collectorPin = await bcrypt.hash("0000", 10);
  const collector = await prisma.user.create({
    data: {
      employeeId: "REC-001",
      fullName: "Rodrigo Mendoza",
      email: "rodrigo@ecocampus.edu",
      hashedPin: collectorPin,
      role: "collector",
      shift: "matutino",
    },
  });

  console.log("✅ Seed completado!");
  console.log("Admin:", admin.employeeId, "PIN: 1234");
  console.log("Recolector:", collector.employeeId, "PIN: 0000");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });