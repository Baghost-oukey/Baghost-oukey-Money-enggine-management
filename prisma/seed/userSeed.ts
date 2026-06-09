import { prisma } from "@/lib/prisma";


async function main() {
  const user = await prisma.user.upsert({
    where: {
      authId: "demo-auth",
    },
    update: {},
    create: {
      authId: "demo-auth",
      name: "Demo User",
      email: "demo@test.com",
    },
  });

  console.log("✅ User created:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });