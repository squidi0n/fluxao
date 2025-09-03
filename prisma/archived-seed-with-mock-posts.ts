import { PrismaClient, Role, PostStatus } from '@prisma/client';

const prisma = new PrismaClient();

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  // console.log('🌱 Starting seed...');

  // Make Adam admin - he uses Google OAuth
  const adamEmail = 'adam.freundt@gmail.com';

  // console.log(`Ensuring ${adamEmail} is admin...`);

  // Update Adam to admin if he exists, or create him as admin
  const adamUser = await prisma.user.upsert({
    where: { email: adamEmail },
    update: {
      role: Role.ADMIN,
      isAdmin: true,
      emailVerifiedLegacy: true,
      emailVerified: new Date(),
    },
    create: {
      email: adamEmail,
      name: 'Adam Freundt',
      role: Role.ADMIN,
      isAdmin: true,
      emailVerifiedLegacy: true,
      emailVerified: new Date(),
      // No password needed - using Google OAuth
    },
  });

  // console.log('✅ Adam is now admin!');

  // Create tags
  const aiTag = await prisma.tag.upsert({
    where: { slug: 'artificial-intelligence' },
    update: {},
    create: {
      name: 'Artificial Intelligence',
      slug: 'artificial-intelligence',
    },
  });

  const techTag = await prisma.tag.upsert({
    where: { slug: 'technology' },
    update: {},
    create: {
      name: 'Technology',
      slug: 'technology',
    },
  });

  const designTag = await prisma.tag.upsert({
    where: { slug: 'design' },
    update: {},
    create: {
      name: 'Design',
      slug: 'design',
    },
  });

  const futureTag = await prisma.tag.upsert({
    where: { slug: 'future' },
    update: {},
    create: {
      name: 'Future',
      slug: 'future',
    },
  });

  // console.log('✅ Created tags');

  // Create Tribune-style categories (8 categories)
  const categories = [
    { name: 'KI & Tech', slug: 'ki-tech' },
    { name: 'Mensch & Gesellschaft', slug: 'mensch-gesellschaft' },
    { name: 'Design & Ästhetik', slug: 'design-aesthetik' },
    { name: 'Gaming & Kultur', slug: 'gaming-kultur' },
    { name: 'Mindset & Philosophie', slug: 'mindset-philosophie' },
    { name: 'Business & Finance', slug: 'business-finance' },
    { name: 'Future & Science', slug: 'future-science' },
    { name: 'Fiction Lab', slug: 'fiction-lab' },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
  }

  // console.log('✅ Created Tribune-style categories');

  // Get categories for posts
  const [
    kiTechCategory,
    gesellschaftCategory,
    designCategory,
    gamingCategory,
    mindsetCategory,
    businessCategory,
    scienceCategory,
    fictionCategory,
  ] = createdCategories;
  const newsCategory = kiTechCategory; // Keep for backward compatibility

  // Create posts
  const posts = [
    {
      title: 'Die Zukunft der KI: Was erwartet uns 2025?',
      teaser: 'Ein Blick auf die kommenden Entwicklungen im Bereich künstlicher Intelligenz.',
      excerpt:
        'KI-Experten prognostizieren bahnbrechende Entwicklungen für 2025. Von autonomen Agenten bis zu multimodalen Modellen - die Zukunft wird spannend.',
      coverImage:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop',
      viewCount: Math.floor(Math.random() * 1000) + 500,
      isFeatured: true,
      content: `# Die Zukunft der KI: Was erwartet uns 2025?

Die künstliche Intelligenz entwickelt sich rasant weiter. In diesem Jahr erwarten uns bahnbrechende Entwicklungen in verschiedenen Bereichen.

## Multimodale KI-Systeme

Die nächste Generation von KI-Systemen wird nicht nur Text verstehen, sondern nahtlos zwischen Text, Bild, Audio und Video wechseln können. Diese Systeme werden:

- Komplexe multimediale Inhalte erstellen
- Besseres Verständnis von Kontext entwickeln
- Natürlichere Interaktionen ermöglichen

## KI in der Wissenschaft

Besonders in der Forschung wird KI eine noch größere Rolle spielen:

1. **Medizin**: Personalisierte Behandlungen und neue Medikamentenentwicklung
2. **Klimaforschung**: Präzisere Vorhersagen und Lösungsansätze
3. **Materialwissenschaft**: Entdeckung neuer Materialien

## Herausforderungen und Chancen

Mit den Fortschritten kommen auch neue Herausforderungen:

- Ethische Fragen müssen geklärt werden
- Regulierung wird wichtiger
- Bildung muss angepasst werden

Die Zukunft der KI ist vielversprechend, aber wir müssen verantwortungsvoll damit umgehen.`,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-20'),
    },
    {
      title: 'Claude 3.5: Ein Game Changer für Entwickler',
      teaser: 'Anthropics neues Modell setzt neue Maßstäbe in der Code-Generierung.',
      excerpt:
        'Claude 3.5 revolutioniert die Art, wie Entwickler arbeiten. Mit verbessertem Kontext-Verständnis und präziser Code-Generierung.',
      coverImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=600&fit=crop',
      viewCount: Math.floor(Math.random() * 800) + 400,
      content: `# Claude 3.5: Ein Game Changer für Entwickler

Anthropic hat mit Claude 3.5 Sonnet ein beeindruckendes Update veröffentlicht, das besonders für Entwickler interessant ist.

## Was macht Claude 3.5 besonders?

### Verbesserte Code-Generierung
- Präzisere und idiomatische Code-Ausgabe
- Besseres Verständnis von Projekt-Kontexten
- Unterstützung für moderne Frameworks

### Computer Use Capabilities
Eine der revolutionärsten Features ist die Fähigkeit, Computer-Interfaces zu verstehen und zu bedienen:
- Screenshot-Analyse
- UI-Automation
- Test-Generierung

## Praktische Anwendungsfälle

\`\`\`python
# Claude kann komplexe Algorithmen elegant implementieren
def optimize_workflow(tasks, constraints):
    # Intelligente Optimierung mit Berücksichtigung
    # von Abhängigkeiten und Ressourcen
    pass
\`\`\`

## Vergleich mit anderen Modellen

Im direkten Vergleich zeigt Claude 3.5 Stärken in:
- Code-Qualität
- Kontext-Verständnis
- Sicherheit und Ethik

Die Entwickler-Community ist begeistert, und das aus gutem Grund.`,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-18'),
    },
    {
      title: 'Open Source KI: Die demokratische Revolution',
      teaser: 'Wie Open Source Modelle die KI-Landschaft verändern.',
      excerpt:
        'Open Source KI-Modelle demokratisieren den Zugang zu fortschrittlicher Technologie und fördern Innovation weltweit.',
      coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=600&fit=crop',
      viewCount: Math.floor(Math.random() * 600) + 300,
      content: `# Open Source KI: Die demokratische Revolution

Die Open Source Bewegung revolutioniert die KI-Entwicklung und macht fortschrittliche Technologie für alle zugänglich.

## Der Aufstieg von Open Source Modellen

### Llama 3 von Meta
Meta's Entscheidung, Llama 3 als Open Source zu veröffentlichen, war ein Wendepunkt:
- 70B Parameter Modell frei verfügbar
- Kommerzielle Nutzung erlaubt
- Aktive Community-Entwicklung

### Mistral und andere Akteure
Europäische Unternehmen wie Mistral AI zeigen, dass Innovation nicht nur aus dem Silicon Valley kommt:
- Fokus auf Effizienz
- Mehrsprachige Fähigkeiten
- GDPR-konforme Lösungen

## Vorteile für Entwickler

1. **Keine Vendor Lock-in**: Volle Kontrolle über die Modelle
2. **Anpassbarkeit**: Fine-tuning für spezielle Anwendungsfälle
3. **Transparenz**: Einsicht in die Funktionsweise
4. **Kosteneffizienz**: Selbst-Hosting möglich

## Die Community macht den Unterschied

Die Open Source Community hat beeindruckende Tools entwickelt:
- **Ollama**: Lokale LLM-Verwaltung
- **LangChain**: Framework für KI-Anwendungen
- **Hugging Face**: Zentrale Plattform für Modelle

## Herausforderungen und Lösungen

### Rechenleistung
- Quantisierung reduziert Anforderungen
- Cloud-GPUs werden günstiger
- Effizientere Architekturen

### Qualitätssicherung
- Community-Reviews
- Benchmark-Standards
- Automatisierte Tests

Die Zukunft der KI ist open, transparent und kollaborativ.`,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-15'),
    },
  ];

  for (const postData of posts) {
    const slug = createSlug(postData.title);

    const post = await prisma.post.upsert({
      where: { slug },
      update: {},
      create: {
        ...postData,
        slug,
        authorId: adamUser.id,
      },
    });

    // Add tags and category to posts
    for (const tagId of [aiTag.id, techTag.id]) {
      await prisma.postTag
        .create({
          data: {
            postId: post.id,
            tagId: tagId,
          },
        })
        .catch(() => {
          // Ignore if already exists
        });
    }

    await prisma.postCategory
      .create({
        data: {
          postId: post.id,
          categoryId: newsCategory.id,
        },
      })
      .catch(() => {
        // Ignore if already exists
      });
  }

  // console.log('✅ Created posts with tags and categories');

  // Create additional posts for other categories
  const additionalPosts = [
    // Mensch & Gesellschaft
    {
      title: 'Digital Detox: Warum wir alle eine Pause brauchen',
      teaser: 'Die Auswirkungen ständiger Erreichbarkeit auf unsere Psyche.',
      excerpt:
        'In einer hypervernetzten Welt wird Digital Detox zur Notwendigkeit. Experten erklären, wie wir Balance finden.',
      coverImage:
        'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&h=600&fit=crop',
      content:
        'Digital Detox ist mehr als nur ein Trend. Es ist eine notwendige Reaktion auf die Überflutung mit digitalen Reizen.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-19'),
      viewCount: Math.floor(Math.random() * 500) + 200,
      categories: [gesellschaftCategory.id],
    },
    // Design & Ästhetik
    {
      title: 'Neomorphismus: Das UI-Design der Zukunft',
      teaser: 'Wie weiche Schatten und subtile Effekte Interfaces revolutionieren.',
      excerpt:
        'Neomorphismus verbindet Minimalismus mit taktiler Tiefe. Ein Design-Trend, der Interfaces zum Leben erweckt.',
      coverImage: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200&h=600&fit=crop',
      content:
        'Neomorphismus ist die Evolution des Flat Designs. Mit subtilen Schatten und Highlights entstehen Interfaces, die sich anfühlen wie echte Objekte.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-17'),
      viewCount: Math.floor(Math.random() * 400) + 150,
      categories: [designCategory.id],
    },
    // Gaming & Kultur
    {
      title: 'Indie Games: Die wahren Innovatoren der Branche',
      teaser: 'Warum kleine Studios die Gaming-Welt verändern.',
      excerpt:
        'Während AAA-Studios auf Nummer sicher gehen, experimentieren Indie-Entwickler mit neuen Konzepten und Narrativen.',
      coverImage: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&h=600&fit=crop',
      content:
        'Indie Games wie Hades, Celeste und Hollow Knight zeigen: Innovation kommt oft von kleinen Teams mit großen Visionen.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-16'),
      viewCount: Math.floor(Math.random() * 700) + 300,
      categories: [gamingCategory.id],
    },
    // Mindset & Philosophie
    {
      title: 'Stoizismus im digitalen Zeitalter',
      teaser: 'Antike Weisheit für moderne Herausforderungen.',
      excerpt:
        'Die stoische Philosophie erlebt eine Renaissance. Wie uns Marcus Aurelius beim Umgang mit Social Media hilft.',
      coverImage:
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=600&fit=crop',
      content:
        'Stoische Prinzipien helfen uns, in einer überreizten Welt Ruhe zu bewahren. Von Meditation bis Journaling - alte Praktiken neu interpretiert.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-14'),
      viewCount: Math.floor(Math.random() * 600) + 250,
      categories: [mindsetCategory.id],
    },
    // Business & Finance
    {
      title: 'KI-Startups: Der neue Goldgräberrausch im Silicon Valley',
      teaser: 'Warum Investoren Milliarden in AI-Unternehmen pumpen.',
      excerpt:
        'Von OpenAI bis Anthropic - KI-Startups brechen Bewertungsrekorde. Was steckt hinter dem Hype und welche Geschäftsmodelle funktionieren wirklich?',
      coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop',
      content:
        'Der KI-Boom hat eine neue Ära der Startup-Finanzierung eingeläutet. Während OpenAI mit 80 Milliarden Dollar bewertet wird, kämpfen andere um Aufmerksamkeit.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-12'),
      viewCount: Math.floor(Math.random() * 900) + 500,
      categories: [businessCategory.id],
    },
    {
      title: 'Bitcoin ETFs: Institutionelle Adoption erreicht Mainstream',
      teaser: 'Wie traditionelle Finanzinstitute Kryptowährungen umarmen.',
      excerpt:
        'BlackRock, Fidelity und Co. haben Bitcoin ETFs gelauncht. Die institutionelle Adoption verändert das Krypto-Ökosystem fundamental.',
      coverImage: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=1200&h=600&fit=crop',
      content:
        'Die Einführung von Bitcoin ETFs markiert einen Wendepunkt. Institutionelle Investoren können nun reguliert in Krypto investieren.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-11'),
      viewCount: Math.floor(Math.random() * 700) + 350,
      categories: [businessCategory.id],
    },
    // Future & Science
    {
      title: 'Quantencomputer: Der Durchbruch bei IBM und Google',
      teaser: 'Warum 2025 das Jahr der Quantenüberlegenheit werden könnte.',
      excerpt:
        'IBM Condor und Google Willow zeigen beeindruckende Fortschritte. Quantencomputer könnten bald klassische Supercomputer überholen.',
      coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=600&fit=crop',
      content:
        'Quantencomputing erreicht neue Meilensteine. Mit 1000+ Qubits rücken praktische Anwendungen in greifbare Nähe.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-10'),
      viewCount: Math.floor(Math.random() * 600) + 400,
      categories: [scienceCategory.id],
    },
    {
      title: 'Fusion Power: Breakthrough bei ITER und privaten Startups',
      teaser: 'Kernfusion könnte unsere Energieprobleme lösen.',
      excerpt:
        'ITER meldet Fortschritte, während Startups wie Commonwealth Fusion Systems neue Ansätze verfolgen. Die saubere Energie der Zukunft.',
      coverImage: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&h=600&fit=crop',
      content:
        'Kernfusion-Experimente erreichen neue Effizienzrekorde. Der Traum von unbegrenzter sauberer Energie wird Realität.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-09'),
      viewCount: Math.floor(Math.random() * 800) + 300,
      categories: [scienceCategory.id],
    },
    {
      title: 'SpaceX Starship: Mars-Mission wird konkret',
      teaser: 'Elon Musks Vision der Besiedlung des Mars nimmt Formen an.',
      excerpt:
        'Nach erfolgreichen Testflügen plant SpaceX die erste bemannte Mars-Mission. Die Technologie für interplanetare Reisen wird Realität.',
      coverImage: 'https://images.unsplash.com/photo-1516849677043-ef67c9557e16?w=1200&h=600&fit=crop',
      content:
        'Starship erreicht neue Meilensteine bei Tests. Die Mars-Kolonisation rückt von Science Fiction in den Bereich des Möglichen.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-08'),
      viewCount: Math.floor(Math.random() * 1000) + 600,
      categories: [scienceCategory.id],
      isFeatured: true,
    },
    // Fiction Lab
    {
      title: 'Der letzte Upload',
      teaser: 'Eine Kurzgeschichte über Bewusstsein in der Cloud.',
      excerpt:
        'Was passiert, wenn das menschliche Bewusstsein digitalisiert wird? Eine dystopische Vision der nahen Zukunft.',
      coverImage:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop',
      content:
        'Sarah starrte auf den Upload-Balken. 97%. In wenigen Sekunden würde ihr Bewusstsein für immer in der Cloud existieren. War sie dann noch sie selbst?',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date('2024-12-13'),
      viewCount: Math.floor(Math.random() * 800) + 400,
      categories: [fictionCategory.id],
      isFeatured: true,
    },
  ];

  for (const postData of additionalPosts) {
    const slug = createSlug(postData.title);
    const categoryIds = postData.categories || [];
    delete postData.categories;

    const post = await prisma.post.upsert({
      where: { slug },
      update: {},
      create: {
        ...postData,
        slug,
        authorId: adamUser.id,
      },
    });

    // Add categories
    for (const categoryId of categoryIds) {
      await prisma.postCategory
        .create({
          data: {
            postId: post.id,
            categoryId: categoryId,
          },
        })
        .catch(() => {
          // Ignore if already exists
        });
    }

    // Add some random tags
    const randomTags = [aiTag.id, techTag.id, designTag.id, futureTag.id];
    const selectedTags = randomTags.sort(() => 0.5 - Math.random()).slice(0, 2);

    for (const tagId of selectedTags) {
      await prisma.postTag
        .create({
          data: {
            postId: post.id,
            tagId: tagId,
          },
        })
        .catch(() => {
          // Ignore if already exists
        });
    }
  }

  // console.log('✅ Created additional posts for all categories');

  // Create some newsletter subscribers
  const subscribers = [
    {
      email: 'test1@example.com',
      status: 'verified',
      verifiedAt: new Date(),
    },
    {
      email: 'test2@example.com',
      status: 'pending',
    },
  ];

  for (const subscriber of subscribers) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: subscriber.email },
      update: {},
      create: subscriber,
    });
  }

  // console.log('✅ Created newsletter subscribers');

  // Create settings
  const settings = [
    { key: 'site_title', value: 'FluxAO' },
    {
      key: 'site_description',
      value: 'Tech & AI Magazin - Die neuesten Entwicklungen in KI und Technologie',
    },
    { key: 'posts_per_page', value: '10' },
    { key: 'registration_enabled', value: 'true' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // console.log('✅ Created settings');

  // console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    // console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
