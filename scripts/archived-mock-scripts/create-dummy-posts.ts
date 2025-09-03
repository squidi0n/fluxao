import { PrismaClient, PostStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Dummy-Titel für KI & Tech Kategorie
const kiTechTitles = [
  'GPT-5 Revolution: Die nächste Generation der Sprachmodelle',
  'Quantencomputer durchbricht 1000-Qubit-Grenze',
  'Neuralink startet erste Gehirn-Computer-Tests in Europa',
  'Apple Vision Pro 2: Die Zukunft der Mixed Reality',
  'Autonome Fahrzeuge: Tesla erreicht Level 5 Autonomie',
  'KI-Chips der Zukunft: NVIDIAs neuer Durchbruch',
  'ChatGPT bekommt Körper: Erste humanoide Roboter mit GPT',
  'Blockchain 3.0: Die Revolution der dezentralen Systeme',
  'Künstliche Generalintelligenz: Nur noch 5 Jahre entfernt?',
  'Photonische Prozessoren: 1000x schneller als Silizium',
  'DeepMind löst Proteinfaltung für alle Krankheiten',
  'Starlink erreicht globale Internetabdeckung',
  'Microsoft Copilot ersetzt erste Programmierer-Teams',
  'Fusionsenergie: Erster kommerzieller Reaktor online',
  'DNA-Speicher: Petabytes in einem Reagenzglas',
  'Roboter-Chirurgen operieren präziser als Menschen',
  'KI entdeckt Heilmittel gegen Alzheimer',
  'Graphen-Batterien: 10 Minuten für 1000km Reichweite',
  'Hologramm-Displays werden Mainstream',
  'Superintelligenz: Die Singularität ist näher als gedacht',
];

const teasers = [
  'Ein bahnbrechender Durchbruch, der die Tech-Welt für immer verändern wird.',
  'Experten sind sich einig: Dies ist der Wendepunkt der digitalen Revolution.',
  'Was wie Science-Fiction klingt, wird schon bald Realität.',
  'Die Grenzen des Möglichen werden neu definiert.',
  'Eine Innovation, die unser tägliches Leben revolutionieren wird.',
];

const coverImages = [
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1676299081847-824916de030a?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1675271591211-41ae12242662?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1674027444485-cec3da58eef4?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop',
];

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createDummyPosts() {
  // console.log('\n🤖 Erstelle Dummy-Artikel für KI & Tech...\n');

  try {
    // Get Adam as author
    const adam = await prisma.user.findUnique({
      where: { email: 'adam.freundt@gmail.com' },
    });

    if (!adam) {
      throw new Error('Adam nicht gefunden! Führe erst create-test-users-v2.ts aus.');
    }

    // Get KI & Tech category
    const category = await prisma.category.findUnique({
      where: { slug: 'ki-tech' },
    });

    if (!category) {
      throw new Error('Kategorie KI & Tech nicht gefunden!');
    }

    // Create 20 posts
    for (let i = 0; i < 20; i++) {
      const title = kiTechTitles[i];
      const slug = createSlug(title) + '-' + Date.now() + i;
      const teaser = teasers[i % teasers.length];
      const coverImage = coverImages[i % coverImages.length];
      const viewCount = Math.floor(Math.random() * 5000) + 100; // 100-5100 views
      const publishedAt = new Date(Date.now() - i * 24 * 60 * 60 * 1000); // Stagger by days

      const post = await prisma.post.create({
        data: {
          title,
          slug,
          teaser,
          excerpt: teaser,
          coverImage,
          content: `<h2>Einführung</h2><p>${teaser}</p><p>Weitere Details folgen in Kürze...</p>`,
          status: PostStatus.PUBLISHED,
          authorId: adam.id,
          publishedAt,
          viewCount,
          categories: {
            create: {
              categoryId: category.id,
            },
          },
        },
      });

      // console.log(`✅ ${i + 1}. "${title}" (${viewCount} Views)`);
    }

    // console.log('\n🎉 20 Artikel für KI & Tech erstellt!');

    // Show statistics
    const totalPosts = await prisma.post.count({
      where: {
        categories: {
          some: {
            categoryId: category.id,
          },
        },
      },
    });

    // console.log(`\n📊 Gesamt: ${totalPosts} Artikel in KI & Tech`);
  } catch (error) {
    // console.error('❌ Fehler:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createDummyPosts();
