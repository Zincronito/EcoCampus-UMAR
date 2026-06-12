import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log(" Iniciando seed...\n");

  // ═══════════════════════════════════════════════════════════════
  // 1. CREAR CAMPUS (3 campus costeros de Oaxaca)
  // ═══════════════════════════════════════════════════════════════
  console.log(" Creando campus...");

  const campusHuatulco = await prisma.campus.create({
    data: {
      name: "Campus Huatulco",
      code: "HUA",
      address: "Boulevard Benito Juárez, Huatulco, Oaxaca",
    },
  });

  const campusPuertoAngel = await prisma.campus.create({
    data: {
      name: "Campus Puerto Ángel",
      code: "PA",
      address: "Carretera Costera, Puerto Ángel, Oaxaca",
    },
  });

  const campusZipolite = await prisma.campus.create({
    data: {
      name: "Campus Zipolite",
      code: "ZIP",
      address: "Calle Principal, Zipolite, Oaxaca",
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. CREAR UBICACIONES (por campus)
  // ═══════════════════════════════════════════════════════════════
  console.log("Creando ubicaciones...");

  // Campus Huatulco
  const locPlazaHua = await prisma.location.create({
    data: {
      name: "Plaza Central Huatulco",
      sector: "Zona 1",
      locationType: "plaza",
      description: "Área de circulación principal",
      campusId: campusHuatulco.id,
    },
  });

  const locBibliotecaHua = await prisma.location.create({
    data: {
      name: "Biblioteca Huatulco",
      sector: "Zona 2",
      locationType: "edificio",
      description: "Entrada principal de biblioteca",
      campusId: campusHuatulco.id,
    },
  });

  const locComensorHua = await prisma.location.create({
    data: {
      name: "Comedor Huatulco",
      sector: "Zona 3",
      locationType: "comedor",
      description: "Área de servicio de alimentos",
      campusId: campusHuatulco.id,
    },
  });

  // Campus Puerto Ángel
  const locEntradasPA = await prisma.location.create({
    data: {
      name: "Entrada Principal PA",
      sector: "Bloque A",
      locationType: "acceso",
      description: "Entrada al campus",
      campusId: campusPuertoAngel.id,
    },
  });

  const locPatiosPA = await prisma.location.create({
    data: {
      name: "Patios Exteriores PA",
      sector: "Bloque B",
      locationType: "exterior",
      description: "Áreas al aire libre",
      campusId: campusPuertoAngel.id,
    },
  });

  // Campus Zipolite
  const locEntradasZIP = await prisma.location.create({
    data: {
      name: "Acceso Principal ZIP",
      sector: "Bloque 1",
      locationType: "acceso",
      description: "Entrada al campus Zipolite",
      campusId: campusZipolite.id,
    },
  });

  const locLaboratoriosZIP = await prisma.location.create({
    data: {
      name: "Laboratorios ZIP",
      sector: "Bloque 2",
      locationType: "laboratorio",
      description: "Área de laboratorios científicos",
      campusId: campusZipolite.id,
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. CREAR CATEGORÍAS DE RESIDUOS
  // ═══════════════════════════════════════════════════════════════
  console.log("Creando categorías de residuos...");

  const catOrgánico = await prisma.wasteCategory.create({
    data: {
      name: "Orgánico",
      description: "Residuos de comida, plantas, papel contaminado",
      color: "#97C459",
      icon: "🥬",
    },
  });

  const catPapel = await prisma.wasteCategory.create({
    data: {
      name: "Papel y Cartón",
      description: "Papel, cartón, periódicos",
      color: "#8B7355",
      icon: "📄",
    },
  });

  const catPlástico = await prisma.wasteCategory.create({
    data: {
      name: "Plástico",
      description: "Botellas, bolsas, envases plásticos",
      color: "#FF6B9D",
      icon: "🧴",
    },
  });

  const catVidrio = await prisma.wasteCategory.create({
    data: {
      name: "Vidrio",
      description: "Botellas, frascos de vidrio",
      color: "#87CEEB",
      icon: "🍾",
    },
  });

  const catMetal = await prisma.wasteCategory.create({
    data: {
      name: "Metal",
      description: "Latas, aluminio",
      color: "#C0C0C0",
      icon: "🥫",
    },
  });

  const catMixto = await prisma.wasteCategory.create({
    data: {
      name: "Mixto",
      description: "Residuos mixtos no separables",
      color: "#808080",
      icon: "🗑️",
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. CREAR USUARIOS
  // ═══════════════════════════════════════════════════════════════
  console.log("Creando usuarios...");

  const hashedPin1234 = await hash("1234", 10);
  const hashedPin0000 = await hash("0000", 10);
  const hashedPin5678 = await hash("5678", 10);

  const adminGeneral = await prisma.user.create({
    data: {
      employeeId: "ADMIN-001",
      fullName: "Administrador General",
      email: "admin@ecocampus.edu",
      phone: "951-5551234",
      hashedPin: hashedPin1234,
      role: "admin",
    },
  });

  const supHuatulco = await prisma.user.create({
    data: {
      employeeId: "SUP-HUA-001",
      fullName: "Supervisor Campus Huatulco",
      email: "sup-huatulco@ecocampus.edu",
      phone: "958-5855555",
      hashedPin: hashedPin5678,
      role: "supervisor",
      assignedSector: "Campus Huatulco",
    },
  });

  const recHua1 = await prisma.user.create({
    data: {
      employeeId: "REC-HUA-001",
      fullName: "Roberto García López",
      email: "roberto.garcia@ecocampus.edu",
      phone: "958-5856666",
      hashedPin: hashedPin0000,
      role: "collector",
      shift: "matutino",
      assignedSector: "Zona 1-2",
    },
  });

  const recHua2 = await prisma.user.create({
    data: {
      employeeId: "REC-HUA-002",
      fullName: "María Sánchez Rodríguez",
      email: "maria.sanchez@ecocampus.edu",
      phone: "958-5857777",
      hashedPin: hashedPin0000,
      role: "collector",
      shift: "matutino",
      assignedSector: "Zona 3",
    },
  });

  const recPA1 = await prisma.user.create({
    data: {
      employeeId: "REC-PA-001",
      fullName: "Juan Morales Pérez",
      email: "juan.morales@ecocampus.edu",
      phone: "959-5948888",
      hashedPin: hashedPin0000,
      role: "collector",
      shift: "vespertino",
      assignedSector: "Campus Puerto Ángel",
    },
  });

  const recZIP1 = await prisma.user.create({
    data: {
      employeeId: "REC-ZIP-001",
      fullName: "Carlos López Martínez",
      email: "carlos.lopez@ecocampus.edu",
      phone: "958-5859999",
      hashedPin: hashedPin0000,
      role: "collector",
      shift: "matutino",
      assignedSector: "Campus Zipolite",
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. CREAR CONTENEDORES
  // ═══════════════════════════════════════════════════════════════
  console.log("Creando contenedores...");

  // Campus Huatulco - Plaza Central
  const cont1 = await prisma.container.create({
    data: {
      containerCode: "CONT-HUA-PLZ-001",
      tareWeight: 5.5,
      volumeLiters: 120,
      status: "active",
      qrGenerated: true,
      wasteCategoryId: catOrgánico.id,
      locationId: locPlazaHua.id,
    },
  });

  const cont2 = await prisma.container.create({
    data: {
      containerCode: "CONT-HUA-PLZ-002",
      tareWeight: 5.8,
      volumeLiters: 120,
      status: "active",
      qrGenerated: true,
      wasteCategoryId: catPapel.id,
      locationId: locPlazaHua.id,
    },
  });

  const cont3 = await prisma.container.create({
    data: {
      containerCode: "CONT-HUA-PLZ-003",
      tareWeight: 6.0,
      volumeLiters: 120,
      status: "active",
      qrGenerated: true,
      wasteCategoryId: catPlástico.id,
      locationId: locPlazaHua.id,
    },
  });

  // Campus Huatulco - Biblioteca
  const cont4 = await prisma.container.create({
    data: {
      containerCode: "CONT-HUA-BIB-001",
      tareWeight: 5.2,
      volumeLiters: 100,
      status: "active",
      qrGenerated: true,
      wasteCategoryId: catPapel.id,
      locationId: locBibliotecaHua.id,
    },
  });

  // Campus Huatulco - Comedor
  const cont5 = await prisma.container.create({
    data: {
      containerCode: "CONT-HUA-COM-001",
      tareWeight: 6.5,
      volumeLiters: 150,
      status: "active",
      qrGenerated: true,
      wasteCategoryId: catOrgánico.id,
      locationId: locComensorHua.id,
    },
  });

  const cont6 = await prisma.container.create({
    data: {
      containerCode: "CONT-HUA-COM-002",
      tareWeight: 6.2,
      volumeLiters: 150,
      status: "active",
      qrGenerated: true,
      wasteCategoryId: catPlástico.id,
      locationId: locComensorHua.id,
    },
  });

  // Campus Puerto Ángel
  const cont7 = await prisma.container.create({
    data: {
      containerCode: "CONT-PA-ENT-001",
      tareWeight: 5.5,
      volumeLiters: 120,
      status: "active",
      qrGenerated: true,
      wasteCategoryId: catOrgánico.id,
      locationId: locEntradasPA.id,
    },
  });

  const cont8 = await prisma.container.create({
    data: {
      containerCode: "CONT-PA-PAT-001",
      tareWeight: 5.8,
      volumeLiters: 120,
      status: "active",
      qrGenerated: true,
      wasteCategoryId: catMixto.id,
      locationId: locPatiosPA.id,
    },
  });

  // Campus Zipolite
  const cont9 = await prisma.container.create({
    data: {
      containerCode: "CONT-ZIP-ACC-001",
      tareWeight: 5.5,
      volumeLiters: 120,
      status: "active",
      qrGenerated: true,
      wasteCategoryId: catOrgánico.id,
      locationId: locEntradasZIP.id,
    },
  });

  const cont10 = await prisma.container.create({
    data: {
      containerCode: "CONT-ZIP-LAB-001",
      tareWeight: 5.0,
      volumeLiters: 80,
      status: "maintenance",
      qrGenerated: true,
      wasteCategoryId: catMixto.id,
      locationId: locLaboratoriosZIP.id,
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // 6. CREAR REGISTROS DE RECOLECCIÓN
  // ═══════════════════════════════════════════════════════════════
  console.log("Creando registros de recolección...");

  const rec1 = await prisma.collectionRecord.create({
    data: {
      grossWeight: 45.5,
      netWeight: 40.0,
      fillLevel: "85",
      condition: "good",
      separationLevel: "95",
      syncedFromOffline: false,
      deviceRecordedAt: "2026-06-10T08:30:00Z",
      containerId: cont1.id,
      collectorId: recHua1.id,
    },
  });

  const rec2 = await prisma.collectionRecord.create({
    data: {
      grossWeight: 38.2,
      netWeight: 32.5,
      fillLevel: "72",
      condition: "good",
      separationLevel: "90",
      syncedFromOffline: false,
      deviceRecordedAt: "2026-06-10T09:15:00Z",
      containerId: cont2.id,
      collectorId: recHua1.id,
    },
  });

  const rec3 = await prisma.collectionRecord.create({
    data: {
      grossWeight: 52.8,
      netWeight: 46.8,
      fillLevel: "95",
      condition: "fair",
      separationLevel: "75",
      syncedFromOffline: false,
      deviceRecordedAt: "2026-06-10T10:00:00Z",
      containerId: cont5.id,
      collectorId: recHua2.id,
    },
  });

  const rec4 = await prisma.collectionRecord.create({
    data: {
      grossWeight: 35.0,
      netWeight: 28.8,
      fillLevel: "60",
      condition: "good",
      separationLevel: "88",
      syncedFromOffline: true,
      deviceRecordedAt: "2026-06-10T11:30:00Z",
      containerId: cont7.id,
      collectorId: recPA1.id,
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // 7. CREAR INCIDENTES REPORTADOS
  // ═══════════════════════════════════════════════════════════════
  console.log("Creando incidentes...");

  const inc1 = await prisma.incident.create({
    data: {
      description: "Contenedor roto en esquina inferior",
      quickTag: "damage",
      status: "open",
      reportedById: recHua1.id,
      containerId: cont3.id,
      collectionRecordId: rec2.id,
    },
  });

  const inc2 = await prisma.incident.create({
    data: {
      description: "Residuos derramados alrededor del contenedor",
      quickTag: "spillage",
      status: "in_progress",
      reportedById: recHua2.id,
      containerId: cont6.id,
    },
  });

  const inc3 = await prisma.incident.create({
    data: {
      description: "Contenedor lleno a capacidad máxima",
      quickTag: "overfilled",
      status: "resolved",
      reportedById: recPA1.id,
      containerId: cont5.id,
      collectionRecordId: rec3.id,
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // RESUMEN FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log("\n SEED COMPLETADO EXITOSAMENTE!\n");
  console.log("Estadísticas:");
  console.log(`   • Campus creados: 3 (Huatulco, Puerto Ángel, Zipolite)`);
  console.log(`   • Ubicaciones: 7`);
  console.log(`   • Categorías de residuos: 6`);
  console.log(`   • Usuarios: 6 (1 admin, 1 supervisor, 4 recolectores)`);
  console.log(`   • Contenedores: 10`);
  console.log(`   • Registros de recolección: 4`);
  console.log(`   • Incidentes reportados: 3\n`);
  console.log("Credenciales de prueba:");
  console.log(`   • Admin: ADMIN-001 / PIN: 1234`);
  console.log(`   • Recolector: REC-HUA-001 / PIN: 0000\n`);
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });