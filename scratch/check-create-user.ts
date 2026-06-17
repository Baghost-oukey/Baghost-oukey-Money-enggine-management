import { prisma } from "../lib/prisma";
import "dotenv/config";

async function main() {
  console.log("Checking users in database...");
  const users = await prisma.user.findMany();
  console.log("Existing users:", users.map(u => ({ id: u.id, email: u.email, name: u.name })));

  if (users.length === 0) {
    console.log("No users found. Creating a test user...");
    const newUser = await prisma.user.create({
      data: {
        authId: "test-auth-id",
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      }
    });
    console.log("Created test user:", newUser);
  } else {
    // If we have a user but none with password, let's update one or add password to it
    const testUser = users.find(u => u.email === "test@example.com");
    if (!testUser) {
      console.log("Creating test user test@example.com...");
      const newUser = await prisma.user.create({
        data: {
          authId: "test-auth-id-2",
          name: "Test User",
          email: "test@example.com",
          password: "password123",
        }
      });
      console.log("Created test user:", newUser);
    } else if (!testUser.password) {
      console.log("Updating test user password...");
      await prisma.user.update({
        where: { email: "test@example.com" },
        data: { password: "password123" }
      });
      console.log("Test user password updated to password123");
    }
  }
}

main()
  .catch((e) => {
    console.error("Error executing script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
