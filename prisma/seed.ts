import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  // --- Super Admin ---
  await prisma.user.upsert({
    where: { email: "admin@who-gis.org" },
    update: {},
    create: {
      email: "admin@who-gis.org",
      phone: "9999999999",
      passwordHash,
      name: "Super Admin",
      role: "SUPER_ADMIN",
      designation: "System Administrator",
      employeeCode: "ADM-001",
      language: "en",
    },
  });
  console.log("✓ Super Admin: admin@who-gis.org / admin123");

  // --- State ---
  const state = await prisma.state.upsert({
    where: { code: "MH" },
    update: {},
    create: { code: "MH", name: "Maharashtra", nameHindi: "महाराष्ट्र", isoCode: "IN-MH", population: 123000000 },
  });

  const stateAdmin = await prisma.user.upsert({
    where: { email: "state@who-gis.org" },
    update: {},
    create: {
      email: "state@who-gis.org", phone: "9999999998", passwordHash,
      name: "State Admin Maharashtra", role: "STATE_ADMIN",
      designation: "State Immunization Officer",
      employeeCode: "ST-MH-001", hierarchyId: state.id, hierarchyType: "STATE",
    },
  });
  console.log("✓ State Admin: state@who-gis.org / admin123");

  // --- District ---
  const district = await prisma.district.upsert({
    where: { code: "MH-PU" },
    update: {},
    create: { code: "MH-PU", name: "Pune", nameHindi: "पुणे", stateId: state.id, population: 9500000 },
  });

  const distAdmin = await prisma.user.upsert({
    where: { email: "district@who-gis.org" },
    update: {},
    create: {
      email: "district@who-gis.org", phone: "9999999997", passwordHash,
      name: "District Admin Pune", role: "DISTRICT_ADMIN",
      designation: "District Immunization Officer",
      employeeCode: "DI-PU-001", hierarchyId: district.id, hierarchyType: "DISTRICT",
    },
  });
  console.log("✓ District Admin: district@who-gis.org / admin123");

  // --- Block ---
  const block = await prisma.block.upsert({
    where: { code: "MH-PU-HAV" },
    update: {},
    create: { code: "MH-PU-HAV", name: "Haveli", nameHindi: "हवेली", districtId: district.id, population: 450000 },
  });

  const blockAdmin = await prisma.user.upsert({
    where: { email: "block@who-gis.org" },
    update: {},
    create: {
      email: "block@who-gis.org", phone: "9999999996", passwordHash,
      name: "Block Admin Haveli", role: "BLOCK_ADMIN",
      designation: "Block Health Manager",
      employeeCode: "BL-HAV-001", hierarchyId: block.id, hierarchyType: "BLOCK",
    },
  });
  console.log("✓ Block Admin: block@who-gis.org / admin123");

  // --- Planning Unit (PHC) ---
  const pu = await prisma.planningUnit.upsert({
    where: { code: "MH-PU-HAV-PHC1" },
    update: {},
    create: { code: "MH-PU-HAV-PHC1", name: "PHC Shivajinagar", type: "PHC", blockId: block.id },
  });

  // --- MOIC (Medical Officer) ---
  const moic = await prisma.user.upsert({
    where: { email: "moic@who-gis.org" },
    update: {},
    create: {
      email: "moic@who-gis.org", phone: "9999999995", passwordHash,
      name: "Dr. Sharma", role: "MOIC",
      designation: "Medical Officer In-Charge",
      employeeCode: "MO-PHC1-001", hierarchyId: pu.id, hierarchyType: "PLANNING_UNIT",
    },
  });
  console.log("✓ MOIC: moic@who-gis.org / admin123");

  // --- ANM ---
  const anm = await prisma.aNM.upsert({
    where: { code: "ANM-PHC1-001" },
    update: {},
    create: { code: "ANM-PHC1-001", name: "Smt. Patil", nameHindi: "श्रीमती पाटील", phone: "9999999994", planningUnitId: pu.id },
  });

  const anmUser = await prisma.user.upsert({
    where: { email: "anm@who-gis.org" },
    update: {},
    create: {
      email: "anm@who-gis.org", phone: "9999999994", passwordHash,
      name: "Smt. Patil", role: "ANM",
      designation: "Auxiliary Nurse Midwife",
      employeeCode: "ANM-001", hierarchyId: anm.id, hierarchyType: "ANM",
    },
  });

  // Link ANM to user
  await prisma.aNM.update({ where: { id: anm.id }, data: { userId: anmUser.id } });
  console.log("✓ ANM: anm@who-gis.org / admin123");

  // --- ASHA ---
  const asha = await prisma.aSHA.upsert({
    where: { code: "ASHA-001" },
    update: {},
    create: { code: "ASHA-001", name: "Kumari Devi", nameHindi: "कुमारी देवी", phone: "9999999993", anmId: anm.id },
  });

  const ashaUser = await prisma.user.upsert({
    where: { email: "asha@who-gis.org" },
    update: {},
    create: {
      email: "asha@who-gis.org", phone: "9999999993", passwordHash,
      name: "Kumari Devi", role: "ASHA",
      designation: "Accredited Social Health Activist",
      employeeCode: "ASHA-001", hierarchyId: asha.id, hierarchyType: "ASHA",
    },
  });

  await prisma.aSHA.update({ where: { id: asha.id }, data: { userId: ashaUser.id } });
  console.log("✓ ASHA: asha@who-gis.org / admin123");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("All users created! Password: admin123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
