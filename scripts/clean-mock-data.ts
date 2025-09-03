import { prisma } from "../lib/prisma";
async function cleanDB() {
  console.log("🧹 Lösche alle Mock-Daten...");
  await prisma.post.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.comment.deleteMany({}); 
  await prisma.newsletterSubscriber.deleteMany({});
  console.log("✅ Alle Mock-Daten gelöscht - Datenbank ist sauber!");
  const userCount = await prisma.user.count();
  console.log(`👤 Verbleibende User: ${userCount} (nur ADMIN)`);
}
cleanDB().finally(() => prisma.$disconnect());
