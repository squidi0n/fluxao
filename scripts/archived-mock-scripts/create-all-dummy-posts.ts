import { PrismaClient, PostStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Artikel-Titel für jede Kategorie
const categoryTitles: Record<string, string[]> = {
  'mensch-gesellschaft': [
    'Die neue Work-Life-Balance: Wie Gen Z die Arbeitswelt revolutioniert',
    'Digitale Nomaden erobern die Welt: Das Ende des Büros?',
    'Social Media Detox: Der neue Trend zur mentalen Gesundheit',
    'Metaverse-Dating: Die Zukunft der Partnersuche',
    'Klimaaktivismus 2.0: Wie TikTok die Welt rettet',
    'Post-Pandemie-Gesellschaft: Was bleibt von Corona?',
    'Universal Basic Income: Finnlands Experiment zeigt Erfolg',
    'Die 4-Tage-Woche wird zum Standard',
    'Digital Natives werden zu Digital Skeptics',
    'Online-Therapie überholt traditionelle Psychologie',
    'Influencer-Burnout: Die dunkle Seite des Fame',
    'Virtual Reality Schulen: Bildung ohne Klassenzimmer',
    'Die Renaissance der Nachbarschaftshilfe',
    'Cryptowährungen als Sozialleistung',
    'KI-Ethik: Wer programmiert unsere Moral?',
    'Digitale Identität: Wenn der Avatar wichtiger wird als die Person',
    'Smart Cities: Überwachung oder Fortschritt?',
    'Die neue Einsamkeit im digitalen Zeitalter',
    'Roboter als Pflegekräfte: Lösung oder Problem?',
    'Cancel Culture: Evolution oder Revolution?',
  ],
  'style-aesthetik': [
    'Cyberpunk Fashion: Von der Fiktion zur Realität',
    'NFT-Kunst sprengt alle Rekorde',
    'AI-generierte Mode: Der Computer als Designer',
    'Sustainable Luxury: Der neue Status-Symbol',
    'Virtual Influencer dominieren Instagram',
    'Die Rückkehr der 90er: Nostalgie als Lifestyle',
    'Minimalismus 2.0: Weniger ist das neue Mehr',
    'Biophilic Design: Natur in der Stadt',
    'Retrofuturismus: Wenn Vergangenheit auf Zukunft trifft',
    'Digital Fashion Week: Mode ohne Models',
    'Upcycling wird zum Mainstream',
    'Smart Textiles: Kleidung die mitdenkt',
    'Die neue Männlichkeit in der Mode',
    'Gender-Neutral: Das Ende der Rosa-Blau-Diktatur',
    'Virtual Wardrobe: Digitale Kleidung für Social Media',
    'Brutalism Revival: Beton ist wieder cool',
    'Solar Punk: Die Ästhetik der Nachhaltigkeit',
    'Tech-Wear: Funktionalität trifft Fashion',
    'Meta-Materials: Mode aus dem Labor',
    'Color of the Year: Wie Pantone die Welt färbt',
  ],
  'gaming-kultur': [
    'E-Sports überholt traditionellen Sport im TV',
    'PlayStation 6: Leak enthüllt revolutionäre Features',
    'Steam Deck 2: Der PC-Gaming Killer?',
    'Minecraft Education: Wenn Spiele zu Lehrern werden',
    'GTA VI: Das teuerste Spiel aller Zeiten',
    'Cloud Gaming: Das Ende der Konsolen?',
    'VR-Gaming erreicht photorealistische Grafik',
    'Gaming-Sucht wird offiziell als Krankheit anerkannt',
    'Nintendo Switch 2: Die Hybrid-Revolution geht weiter',
    'KI-NPCs: Wenn Spielcharaktere eigene Persönlichkeiten entwickeln',
    'Retro-Gaming: Warum alte Spiele wieder boomen',
    'Gaming-Cafés erleben Renaissance',
    'Cross-Platform wird zum Standard',
    'Blockchain-Gaming: Play-to-Earn revolutioniert die Industrie',
    'Xbox Game Pass erreicht 100 Millionen Abonnenten',
    'Indie-Games dominieren die Charts',
    'Mobile Gaming überholt PC und Konsole',
    'Gaming-Tournaments: Die neuen Olympischen Spiele',
    'Haptic Suits: Gaming mit allen Sinnen',
    'Game Development: Wenn KI zum Co-Developer wird',
  ],
  'mindset-philosophie': [
    'Digital Minimalism: Die neue Achtsamkeit',
    'Transhumanismus: Die Evolution des Menschen',
    'Stoizismus für Millennials: Antike Weisheit im digitalen Zeitalter',
    'Die Kunst des Deep Work in der Ablenkungsgesellschaft',
    'Biohacking: Der optimierte Mensch',
    'Meditation-Apps: Erleuchtung per Download',
    'Die Philosophie der Künstlichen Intelligenz',
    'Posthumanismus: Was kommt nach dem Menschen?',
    'Digital Detox: Die neue Form der Selbstfindung',
    'Ikigai: Japanische Lebensphilosophie erobert den Westen',
    'Conscious Capitalism: Ethik trifft Profit',
    'Die Renaissance der Psychedelika in der Therapie',
    'Longtermism: Denken in Jahrhunderten',
    'Effective Altruism: Gutes tun mit Daten',
    'Die Philosophie des Scheiterns: Fail Fast, Learn Faster',
    'Radical Acceptance: Mit Unsicherheit leben lernen',
    'Die neue Spiritualität: Tech trifft Transzendenz',
    'Attention Economy: Der Kampf um unsere Aufmerksamkeit',
    'Die Ethik der Unsterblichkeit',
    'Digital Wisdom: Weisheit im Informationszeitalter',
  ],
  'fiction-lab': [
    'Die letzte Nachricht vor dem Blackout',
    'Chroniken aus dem Metaverse: Jahr 2045',
    'Der Tag als die KI erwachte',
    'Quantensprung: Eine Zeitreise-Novelle',
    'Die Bibliothek der verlorenen Algorithmen',
    'Echos aus der Singularität',
    'Der Algorithmus der Liebe',
    'Cyberpunk Berlin 2077: Neon und Nebel',
    'Die Träume der Maschinen',
    'Upload: Leben nach dem Tod',
    'Die Rebellion der Roboter',
    'Glitch in der Matrix: Eine digitale Odyssee',
    'Der Code-Flüsterer',
    'Parallelwelten: Eine Quantengeschichte',
    'Die Stadt der tausend Sensoren',
    'Memory Leak: Wenn Erinnerungen verschwinden',
    'Der digitale Prophet',
    'Shutdown: Die letzten 24 Stunden',
    'Die Architekten der Realität',
    'Neural Link: Eine Liebesgeschichte',
  ],
};

const teasers = [
  'Ein faszinierender Einblick in eine Welt im Wandel.',
  'Was gestern noch unmöglich schien, ist heute Realität.',
  'Eine Geschichte, die zum Nachdenken anregt.',
  'Die Grenzen zwischen Fiktion und Realität verschwimmen.',
  'Ein Blick in die Zukunft, der Gänsehaut verursacht.',
  'Experten sind sich einig: Dies verändert alles.',
  'Eine Entwicklung, die niemand kommen sah.',
  'Die Revolution hat bereits begonnen.',
  'Ein Trend, der die Gesellschaft spaltet.',
  'Was bedeutet das für unsere Zukunft?',
];

const coverImages = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1518611507436-f9221403cca2?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200&h=600&fit=crop',
  'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&h=600&fit=crop',
];

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createAllDummyPosts() {
  // console.log('\n🚀 Erstelle Dummy-Artikel für alle Kategorien...\n');

  try {
    // Get Adam as author
    const adam = await prisma.user.findUnique({
      where: { email: 'adam.freundt@gmail.com' },
    });

    if (!adam) {
      throw new Error('Adam nicht gefunden! Führe erst create-test-users-v2.ts aus.');
    }

    // Get all categories
    const categories = await prisma.category.findMany();

    for (const category of categories) {
      // Skip KI & Tech (already has posts)
      if (category.slug === 'ki-tech') {
        // console.log(`⏭️  Überspringe ${category.name} (hat bereits Artikel)\n`);
        continue;
      }

      const titles = categoryTitles[category.slug] || [];
      if (titles.length === 0) {
        // console.log(`⚠️  Keine Titel für ${category.name} definiert\n`);
        continue;
      }

      // console.log(`📝 Erstelle Artikel für ${category.name}:`);
      // console.log('─'.repeat(50));

      // Create 20 posts for this category
      for (let i = 0; i < Math.min(20, titles.length); i++) {
        const title = titles[i];
        const slug = createSlug(title) + '-' + Date.now() + i;
        const teaser = teasers[i % teasers.length];
        const coverImage = coverImages[i % coverImages.length];
        const viewCount = Math.floor(Math.random() * 5000) + 100;
        const publishedAt = new Date(Date.now() - i * 24 * 60 * 60 * 1000);

        await prisma.post.create({
          data: {
            title,
            slug,
            teaser,
            excerpt: teaser,
            coverImage,
            content: `<h2>Einführung</h2><p>${teaser}</p><p>Der vollständige Artikel folgt in Kürze...</p>`,
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

        // console.log(`  ✅ ${i + 1}. "${title.substring(0, 50)}..." (${viewCount} Views)`);
      }

      // console.log(`\n✨ ${category.name}: 20 Artikel erstellt!\n`);
    }

    // Final statistics
    // console.log('\n' + '='.repeat(60));
    // console.log('📊 FINALE STATISTIK:');
    // console.log('='.repeat(60));

    for (const category of categories) {
      const count = await prisma.post.count({
        where: {
          categories: {
            some: {
              categoryId: category.id,
            },
          },
        },
      });
      // console.log(`  ${category.name}: ${count} Artikel`);
    }

    const totalPosts = await prisma.post.count();
    // console.log('─'.repeat(60));
    // console.log(`  GESAMT: ${totalPosts} Artikel`);
    // console.log('='.repeat(60));
  } catch (error) {
    // console.error('❌ Fehler:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAllDummyPosts();
