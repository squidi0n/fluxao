import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
async function fixAdmin() {
  console.log("🔧 Fixe ADMIN User...");
  const passwordHash = await hashPassword("admin123");
  const user = await prisma.user.upsert({
    where: { email: "adam.freundt@gmail.com" },
    update: { 
      passwordHash,
      role: "ADMIN",
      isAdmin: true,
      emailVerified: new Date(),
      emailVerifiedLegacy: true
    },
    create: {
      email: "adam.freundt@gmail.com", 
      name: "Adam Freundt",
      passwordHash,
      role: "ADMIN",
      isAdmin: true,
      emailVerified: new Date(),
      emailVerifiedLegacy: true
    }
  });
  console.log("✅ ADMIN Login bereit:", user.email, "Password: admin123");
}
fixAdmin().finally(() => prisma.$disconnect());
