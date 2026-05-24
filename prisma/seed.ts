import { PrismaClient } from "../src/generated/prisma/client.js";
import { auth } from "../src/lib/auth.js";

import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing todos
  await prisma.todo.deleteMany();

  // Create example todos
  const todos = await prisma.todo.createMany({
    data: [
      { title: "Buy groceries" },
      { title: "Read a book" },
      { title: "Workout" },
    ],
  });

  console.log(`✅ Created ${todos.count} todos`);

  // Better auth seed users and accounts

  const exampleAdminEmail = "admin@example.com";

  // check if example admin exists
  const checkForExampleAdmin = await prisma.user.findUnique({
    where: {
      email: exampleAdminEmail,
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    },
  });

  // sign up admin if not existing
  if (!checkForExampleAdmin) {
    const baseAdmin = await auth.api.signUpEmail({
      body: {
        name: "Admin Example",
        email: exampleAdminEmail,
        password: "AdminExample123",
      },
    });
    console.log(`baseAdmin created: ${JSON.stringify(baseAdmin)}`);

    await prisma.user.update({
      where: {
        id: baseAdmin.user.id,
      },
      data: {
        emailVerified: true,
      },
    });
  } else if (!checkForExampleAdmin.emailVerified) {
    // if email verified is false set to true
    await prisma.user.update({
      where: {
        id: checkForExampleAdmin.id,
      },
      data: {
        emailVerified: true,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
