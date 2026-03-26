import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ProductService } from "../lib/services/product-service";

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

  // Create additional coaches for testing discovery
  console.log("Creating additional test coaches...");

  const coach2User = await prisma.user.upsert({
    where: { email: "mike@sozofitness.com" },
    update: {},
    create: {
      email: "mike@sozofitness.com",
      passwordHash: coachPassword,
      name: "Mike Rodriguez",
      role: UserRole.coach,
    },
  });

  const coach2 = await prisma.coach.upsert({
    where: { userId: coach2User.id },
    update: {},
    create: {
      userId: coach2User.id,
      bio: "Former athlete turned coach. Focused on HIIT training and athletic performance.",
    },
  });

  const coach3User = await prisma.user.upsert({
    where: { email: "emma@sozofitness.com" },
    update: {},
    create: {
      email: "emma@sozofitness.com",
      passwordHash: coachPassword,
      name: "Emma Chen",
      role: UserRole.coach,
    },
  });

  const coach3 = await prisma.coach.upsert({
    where: { userId: coach3User.id },
    update: {},
    create: {
      userId: coach3User.id,
      bio: "Yoga instructor and mindfulness coach. Specializing in flexibility and stress management.",
    },
  });

  console.log(`✅ Additional coaches created`);

  // Create sample products for each coach using ProductService
  // This ensures Stripe products/prices are created if Stripe is configured
  console.log("Creating sample products with Stripe integration...");

  // Coach 1 products (Sarah Johnson)
  const product1 = await ProductService.createProduct({
    coachId: coach.id,
    type: "subscription",
    name: "Monthly Strength Training Plan",
    description: "Comprehensive strength training program with weekly workout plans and nutrition guidance.",
  });

  await ProductService.createPrice({
    productId: product1.id,
    amountCents: 4900, // $49/month
    currency: "usd",
    interval: "month",
    intervalCount: 1,
  });

  const product2 = await ProductService.createProduct({
    coachId: coach.id,
    type: "one_on_one",
    name: "1:1 Personal Training Session",
    description: "One-on-one coaching session focused on your specific fitness goals.",
  });

  await ProductService.createPrice({
    productId: product2.id,
    amountCents: 7500, // $75
    currency: "usd",
  });

  // Coach 2 products (Mike Rodriguez)
  const product3 = await ProductService.createProduct({
    coachId: coach2.id,
    type: "subscription",
    name: "HIIT & Athletic Performance",
    description: "High-intensity interval training programs designed for athletes and fitness enthusiasts.",
  });

  await ProductService.createPrice({
    productId: product3.id,
    amountCents: 5900, // $59/month
    currency: "usd",
    interval: "month",
    intervalCount: 1,
  });

  const product4 = await ProductService.createProduct({
    coachId: coach2.id,
    type: "one_on_one",
    name: "Performance Coaching Session",
    description: "Specialized coaching for athletic performance and competition prep.",
  });

  await ProductService.createPrice({
    productId: product4.id,
    amountCents: 9900, // $99
    currency: "usd",
  });

  // Coach 3 products (Emma Chen)
  const product5 = await ProductService.createProduct({
    coachId: coach3.id,
    type: "subscription",
    name: "Yoga & Mindfulness Program",
    description: "Daily yoga flows and mindfulness practices for flexibility and stress relief.",
  });

  await ProductService.createPrice({
    productId: product5.id,
    amountCents: 3900, // $39/month
    currency: "usd",
    interval: "month",
    intervalCount: 1,
  });

  const product6 = await ProductService.createProduct({
    coachId: coach3.id,
    type: "one_on_one",
    name: "Private Yoga Session",
    description: "One-on-one yoga instruction tailored to your flexibility and wellness goals.",
  });

  await ProductService.createPrice({
    productId: product6.id,
    amountCents: 6500, // $65
    currency: "usd",
  });

  console.log(`✅ Sample products created with Stripe integration (6 total)`);

  // Add coach availability schedules
  console.log("Creating coach availability schedules...");

  // Sarah - available Mon-Fri 9am-5pm
  for (let day = 1; day <= 5; day++) {
    await prisma.coachAvailability.create({
      data: {
        coachId: coach.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        timezone: "America/Los_Angeles",
        isActive: true,
      },
    });
  }

  // Mike - available Tue-Sat 10am-6pm
  for (let day = 2; day <= 6; day++) {
    await prisma.coachAvailability.create({
      data: {
        coachId: coach2.id,
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "18:00",
        timezone: "America/Los_Angeles",
        isActive: true,
      },
    });
  }

  // Emma - available Mon-Fri 8am-4pm
  for (let day = 1; day <= 5; day++) {
    await prisma.coachAvailability.create({
      data: {
        coachId: coach3.id,
        dayOfWeek: day,
        startTime: "08:00",
        endTime: "16:00",
        timezone: "America/Los_Angeles",
        isActive: true,
      },
    });
  }

  console.log(`✅ Coach availability schedules created`);

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
