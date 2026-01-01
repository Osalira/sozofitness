import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Hash passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const coachPassword = await bcrypt.hash("coach123", 10);
  const clientPassword = await bcrypt.hash("client123", 10);

  // Create Admin User
  console.log("Creating admin user...");
  const admin = await prisma.user.upsert({
    where: { email: "admin@sozofitness.com" },
    update: {},
    create: {
      email: "admin@sozofitness.com",
      passwordHash: adminPassword,
      name: "Admin User",
      role: UserRole.admin,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create Coach User
  console.log("Creating coach user...");
  const coachUser = await prisma.user.upsert({
    where: { email: "coach@sozofitness.com" },
    update: {},
    create: {
      email: "coach@sozofitness.com",
      passwordHash: coachPassword,
      name: "Sarah Johnson",
      role: UserRole.coach,
    },
  });

  // Create Coach profile
  const coach = await prisma.coach.upsert({
    where: { userId: coachUser.id },
    update: {},
    create: {
      userId: coachUser.id,
      bio: "Certified fitness coach with 10+ years of experience. Specializing in strength training and nutrition coaching.",
    },
  });
  console.log(`✅ Coach created: ${coachUser.email}`);

  // Create Client User
  console.log("Creating client user...");
  const client = await prisma.user.upsert({
    where: { email: "client@sozofitness.com" },
    update: {},
    create: {
      email: "client@sozofitness.com",
      passwordHash: clientPassword,
      name: "John Smith",
      role: UserRole.client,
      phoneE164: "+16045551234",
      smsOptIn: true,
      emailOptIn: true,
    },
  });
  console.log(`✅ Client created: ${client.email}`);

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📝 Test Accounts:");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Admin:");
  console.log("  Email:    admin@sozofitness.com");
  console.log("  Password: admin123");
  console.log("");
  console.log("Coach:");
  console.log("  Email:    coach@sozofitness.com");
  console.log("  Password: coach123");
  console.log("");
  console.log("Client:");
  console.log("  Email:    client@sozofitness.com");
  console.log("  Password: client123");
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
