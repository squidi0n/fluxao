import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../lib/password";
const prisma = new PrismaClient();
async function createUser() {
  const passwordHash = await hashPassword("testuser8");
  const user = await prisma.user.create({
    data: {
      name: "Test Normal User",
      email: "testnormal@example.com", 
      username: "testnormal",
      passwordHash,
      role: Role.USER,
      emailVerified: null,
      emailVerifiedLegacy: false
    }
  });
  console.log("✅ User created:", user.email, "Role:", user.role);
}
createUser().finally(() => prisma.$disconnect());
