import { prisma } from "../lib/prisma";
async function promoteToAdmin() {
  await prisma.user.update({
    where: { email: "admin@flux.test" },
    data: { 
      role: "ADMIN",
      isAdmin: true,
      emailVerified: new Date(),
      emailVerifiedLegacy: true
    }
  });
  console.log("✅ admin@flux.test ist jetzt ADMIN!");
}
promoteToAdmin().finally(() => prisma.$disconnect());
