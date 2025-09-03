import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean database
  console.log('🧹 Cleaning existing data...');
  await prisma.comment.deleteMany();
  await prisma.articleVote.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.postCategory.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@fluxao.de',
      username: 'admin',
      password: adminPassword,
      name: 'Admin FluxAO',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  // Create test users
  console.log('👥 Creating test users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'user@example.com',
        username: 'testuser',
        password: await bcrypt.hash('user123', 10),
        name: 'Test User',
        role: 'USER',
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'premium@example.com',
        username: 'premiumuser',
        password: await bcrypt.hash('premium123', 10),
        name: 'Premium User',
        role: 'USER', // Will add PREMIUM role later
        emailVerified: new Date(),
      },
    }),
  ]);

  // Create Categories
  console.log('📁 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'KI & Tech',
        slug: 'ki-tech',
        description: 'Künstliche Intelligenz und Technologie',
        color: '#3B82F6',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Mensch & Gesellschaft',
        slug: 'mensch-gesellschaft',
        description: 'Gesellschaftliche Themen und Trends',
        color: '#10B981',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Style & Ästhetik',
        slug: 'style-aesthetik',
        description: 'Design und visuelle Kultur',
        color: '#EC4899',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Gaming & Kultur',
        slug: 'gaming-kultur',
        description: 'Gaming und digitale Unterhaltung',
        color: '#8B5CF6',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Mindset & Philosophie',
        slug: 'mindset-philosophie',
        description: 'Digitales Denken und Philosophie',
        color: '#F59E0B',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Fiction Lab',
        slug: 'fiction-lab',
        description: 'Kreative Geschichten und Narrative',
        color: '#EF4444',
      },
    }),
  ]);

  // Create Tags
  console.log('🏷️ Creating tags...');
  const tags = await Promise.all([
    // KI Tags
    prisma.tag.create({ data: { name: 'OpenAI', slug: 'openai', color: '#10A37F' } }),
    prisma.tag.create({ data: { name: 'Claude', slug: 'claude', color: '#8B5CF6' } }),
    prisma.tag.create({ data: { name: 'ChatGPT', slug: 'chatgpt', color: '#74AA9C' } }),
    prisma.tag.create({ data: { name: 'Midjourney', slug: 'midjourney', color: '#EC4899' } }),
    prisma.tag.create({ data: { name: 'Stable Diffusion', slug: 'stable-diffusion', color: '#3B82F6' } }),
    
    // Tech Companies
    prisma.tag.create({ data: { name: 'Tesla', slug: 'tesla', color: '#CC0000' } }),
    prisma.tag.create({ data: { name: 'SpaceX', slug: 'spacex', color: '#005288' } }),
    prisma.tag.create({ data: { name: 'Apple', slug: 'apple', color: '#555555' } }),
    prisma.tag.create({ data: { name: 'Google', slug: 'google', color: '#4285F4' } }),
    prisma.tag.create({ data: { name: 'Microsoft', slug: 'microsoft', color: '#5E5E5E' } }),
    
    // Development
    prisma.tag.create({ data: { name: 'React', slug: 'react', color: '#61DAFB' } }),
    prisma.tag.create({ data: { name: 'Next.js', slug: 'nextjs', color: '#000000' } }),
    prisma.tag.create({ data: { name: 'TypeScript', slug: 'typescript', color: '#3178C6' } }),
    prisma.tag.create({ data: { name: 'Python', slug: 'python', color: '#3776AB' } }),
    
    // Crypto
    prisma.tag.create({ data: { name: 'Bitcoin', slug: 'bitcoin', color: '#F7931A' } }),
    prisma.tag.create({ data: { name: 'Ethereum', slug: 'ethereum', color: '#627EEA' } }),
    prisma.tag.create({ data: { name: 'Web3', slug: 'web3', color: '#F16822' } }),
  ]);

  // Create Posts
  console.log('📝 Creating posts...');
  const posts = [
    {
      title: 'GPT-5: Die nächste Revolution der KI steht bevor',
      slug: 'gpt-5-revolution-ki',
      excerpt: 'OpenAI arbeitet an GPT-5 und verspricht einen Quantensprung in der KI-Entwicklung.',
      content: `# GPT-5: Die Zukunft der künstlichen Intelligenz

Die Entwicklung von GPT-5 markiert einen Wendepunkt in der Geschichte der künstlichen Intelligenz. Mit verbesserten Reasoning-Fähigkeiten und multimodalen Capabilities wird GPT-5 neue Maßstäbe setzen.

## Was erwartet uns?

- **Verbesserte Reasoning-Fähigkeiten**: GPT-5 wird komplexe Probleme lösen können
- **Multimodale Integration**: Nahtlose Verarbeitung von Text, Bild und Audio
- **Längere Kontexte**: Bis zu 1 Million Token Kontextlänge
- **Bessere Faktentreue**: Reduzierte Halluzinationen durch verbesserte Trainingsmethoden

Die Auswirkungen auf Industrie und Gesellschaft werden enorm sein...`,
      coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200',
      status: 'PUBLISHED',
      isFeatured: true,
      authorId: admin.id,
      publishedAt: new Date(),
      viewCount: 15234,
      categories: [categories[0]], // KI & Tech
      tags: [tags[0], tags[2]], // OpenAI, ChatGPT
    },
    {
      title: 'Tesla Robotaxi: Die Zukunft der Mobilität',
      slug: 'tesla-robotaxi-zukunft',
      excerpt: 'Tesla plant die Einführung autonomer Robotaxis bis 2025.',
      content: `# Tesla Robotaxi Revolution

Elon Musk hat angekündigt, dass Tesla bis 2025 ein vollständig autonomes Robotaxi-Netzwerk aufbauen will. Die Technologie basiert auf der neuesten Version des Full Self-Driving (FSD) Systems.

## Die wichtigsten Features:

- Vollständige Autonomie (Level 5)
- Keine Lenkräder oder Pedale
- Optimiert für Ride-Sharing
- Extrem niedrige Kosten pro Meile

Die Auswirkungen auf die Automobilindustrie könnten revolutionär sein...`,
      coverImage: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200',
      status: 'PUBLISHED',
      isFeatured: false,
      authorId: admin.id,
      publishedAt: new Date(Date.now() - 86400000),
      viewCount: 8923,
      categories: [categories[0]], // KI & Tech
      tags: [tags[5]], // Tesla
    },
    {
      title: 'Midjourney V7: Fotorealismus erreicht neue Dimensionen',
      slug: 'midjourney-v7-fotorealismus',
      excerpt: 'Die neue Version von Midjourney setzt neue Standards in der KI-Bildgenerierung.',
      content: `# Midjourney V7 ist da!

Die neueste Version von Midjourney übertrifft alle Erwartungen. Mit verbesserter Bildqualität und neuen Features revolutioniert V7 die kreative Industrie.

## Neue Features:

- **Perfekter Fotorealismus**: Kaum von echten Fotos zu unterscheiden
- **Konsistente Charaktere**: Gleiche Personen über mehrere Bilder
- **3D-Rendering**: Erste 3D-Capabilities
- **Video-Generation**: Kurze Animationen möglich

Kreative auf der ganzen Welt sind begeistert...`,
      coverImage: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=1200',
      status: 'PUBLISHED',
      authorId: admin.id,
      publishedAt: new Date(Date.now() - 172800000),
      viewCount: 12456,
      categories: [categories[2]], // Style & Ästhetik
      tags: [tags[3]], // Midjourney
    },
    {
      title: 'Web3 Gaming: Die Revolution der Spieleindustrie',
      slug: 'web3-gaming-revolution',
      excerpt: 'Blockchain-Gaming transformiert die Art, wie wir spielen und verdienen.',
      content: `# Web3 Gaming: Play to Earn

Die Gaming-Industrie erlebt durch Web3 eine fundamentale Transformation. Spieler werden zu echten Eigentümern ihrer digitalen Assets.

## Was macht Web3 Gaming besonders?

- True Ownership von In-Game Items
- Play-to-Earn Mechanismen
- Dezentrale Spielwelten
- NFT-Integration

Die traditionelle Gaming-Industrie reagiert skeptisch, aber die Zahlen sprechen für sich...`,
      coverImage: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200',
      status: 'PUBLISHED',
      authorId: admin.id,
      publishedAt: new Date(Date.now() - 259200000),
      viewCount: 7891,
      categories: [categories[3]], // Gaming & Kultur
      tags: [tags[16]], // Web3
    },
    {
      title: 'Die Philosophie der künstlichen Intelligenz',
      slug: 'philosophie-kuenstliche-intelligenz',
      excerpt: 'Was bedeutet Bewusstsein in Zeiten von AGI?',
      content: `# Philosophische Betrachtungen über KI

Die Entwicklung künstlicher Intelligenz wirft fundamentale philosophische Fragen auf. Was ist Bewusstsein? Können Maschinen denken?

## Zentrale Fragen:

- Das Problem des Bewusstseins
- Ethische Implikationen von AGI
- Die Singularität-Hypothese
- Mensch-Maschine-Koexistenz

Diese Fragen werden immer drängender, je näher wir der AGI kommen...`,
      coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200',
      status: 'PUBLISHED',
      authorId: admin.id,
      publishedAt: new Date(Date.now() - 345600000),
      viewCount: 5234,
      categories: [categories[4]], // Mindset & Philosophie
      tags: [tags[1], tags[0]], // Claude, OpenAI
    },
    {
      title: 'SpaceX Starship: Der Weg zum Mars',
      slug: 'spacex-starship-mars',
      excerpt: 'Elon Musks Vision einer multiplanetaren Zivilisation nimmt Gestalt an.',
      content: `# Starship: Die Zukunft der Raumfahrt

SpaceX's Starship-Programm macht große Fortschritte. Die ersten bemannten Marsflüge könnten früher kommen als gedacht.

## Meilensteine:

- Erfolgreiche Orbital-Tests
- Rapid Reusability demonstriert
- In-Orbit Refueling getestet
- Marslandung für 2029 geplant

Die Menschheit steht vor dem größten Abenteuer ihrer Geschichte...`,
      coverImage: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200',
      status: 'PUBLISHED',
      authorId: admin.id,
      publishedAt: new Date(Date.now() - 432000000),
      viewCount: 9123,
      categories: [categories[0]], // KI & Tech
      tags: [tags[6]], // SpaceX
    },
  ];

  for (const postData of posts) {
    const { categories, tags, ...post } = postData;
    
    const createdPost = await prisma.post.create({
      data: {
        ...post,
        categories: {
          create: categories.map(cat => ({
            category: { connect: { id: cat.id } }
          }))
        },
        tags: {
          create: tags.map(tag => ({
            tag: { connect: { id: tag.id } }
          }))
        }
      }
    });

    // Add some comments
    await prisma.comment.create({
      data: {
        body: 'Sehr interessanter Artikel! Die Zukunft wird spannend.',
        authorName: 'Max Mustermann',
        authorEmail: 'max@example.com',
        postId: createdPost.id,
        status: 'APPROVED',
        likeCount: Math.floor(Math.random() * 20),
      }
    });

    await prisma.comment.create({
      data: {
        body: 'Ich bin gespannt, wie sich das entwickelt.',
        authorName: 'Anna Schmidt',
        authorEmail: 'anna@example.com',
        postId: createdPost.id,
        status: 'APPROVED',
        likeCount: Math.floor(Math.random() * 15),
      }
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`- ${await prisma.user.count()} users created`);
  console.log(`- ${await prisma.category.count()} categories created`);
  console.log(`- ${await prisma.tag.count()} tags created`);
  console.log(`- ${await prisma.post.count()} posts created`);
  console.log(`- ${await prisma.comment.count()} comments created`);
  console.log('');
  console.log('🔑 Admin credentials:');
  console.log('Email: admin@fluxao.de');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });