import { prisma } from "../lib/prisma";
async function setTestPassword() {
  console.log("🔧 Setze Test-Passwort...");
  await prisma.user.update({
    where: { email: "adam.freundt@gmail.com" },
    data: { 
      passwordHash: null,
      role: "ADMIN",
      isAdmin: true,
      emailVerified: new Date(),
      emailVerifiedLegacy: true
    }
  });
  console.log("✅ ADMIN bereit - nutze nur Google OAuth Login!");
}
setTestPassword().finally(() => prisma.$disconnect());
