import { prisma } from '../lib/prisma';

async function fixCategories() {
  // console.log('🔍 Prüfe vorhandene Kategorien...');
  
  const existingCategories = await prisma.category.findMany();
  // console.log('Vorhandene Kategorien:', existingCategories.map(c => c.slug));
  
  const requiredCategories = [
    { name: 'KI & Tech', slug: 'ki-tech' },
    { name: 'Mensch & Gesellschaft', slug: 'mensch-gesellschaft' },
    { name: 'Style & Ästhetik', slug: 'style-aesthetik' },
    { name: 'Gaming & Kultur', slug: 'gaming-kultur' },
    { name: 'Mindset & Philosophie', slug: 'mindset-philosophie' },
    { name: 'Fiction Lab', slug: 'fiction-lab' },
  ];
  
  for (const cat of requiredCategories) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug }
    });
    
    if (!existing) {
      // console.log(`✅ Erstelle Kategorie: ${cat.name}`);
      await prisma.category.create({
        data: cat
      });
    } else {
      // console.log(`✓ Kategorie existiert bereits: ${cat.name}`);
    }
  }
  
  // console.log('✨ Kategorien erfolgreich geprüft/erstellt!');
  
  // Zeige finale Liste
  const finalCategories = await prisma.category.findMany();
  // console.log('\nAlle Kategorien:');
  finalCategories.forEach(c => {
    // console.log(`- ${c.name} (${c.slug})`);
  });
}

fixCategories()
  .catch((e) => {
    // console.error('Fehler:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });