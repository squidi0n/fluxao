import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // console.log('🌱 Seeding real data...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!@#', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fluxao.local' },
    update: {},
    create: {
      email: 'admin@fluxao.local',
      name: 'Admin FluxAO',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      isAdmin: true,
    },
  });

  // Create some regular users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'sarah.tech@fluxao.local' },
      update: {},
      create: {
        email: 'sarah.tech@fluxao.local',
        name: 'Sarah Techmann',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'EDITOR',
        emailVerified: new Date(),
        bio: 'Tech-Journalistin mit Fokus auf KI und Innovation',
      },
    }),
    prisma.user.upsert({
      where: { email: 'max.digital@fluxao.local' },
      update: {},
      create: {
        email: 'max.digital@fluxao.local',
        name: 'Max Digital',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'EDITOR',
        emailVerified: new Date(),
        bio: 'Gaming & Digital Culture Expert',
      },
    }),
    prisma.user.upsert({
      where: { email: 'anna.style@fluxao.local' },
      update: {},
      create: {
        email: 'anna.style@fluxao.local',
        name: 'Anna Style',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'EDITOR',
        emailVerified: new Date(),
        bio: 'Design & Ästhetik Redakteurin',
      },
    }),
  ]);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'ki-tech' },
      update: {},
      create: {
        name: 'KI & Tech',
        slug: 'ki-tech',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'gaming-kultur' },
      update: {},
      create: {
        name: 'Gaming & Kultur',
        slug: 'gaming-kultur',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'style-aesthetik' },
      update: {},
      create: {
        name: 'Style & Ästhetik',
        slug: 'style-aesthetik',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'mensch-gesellschaft' },
      update: {},
      create: {
        name: 'Mensch & Gesellschaft',
        slug: 'mensch-gesellschaft',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'mindset-philosophie' },
      update: {},
      create: {
        name: 'Mindset & Philosophie',
        slug: 'mindset-philosophie',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'fiction-lab' },
      update: {},
      create: {
        name: 'Fiction Lab',
        slug: 'fiction-lab',
      },
    }),
  ]);

  // Create real posts with actual content
  const posts = [
    // KI & Tech Posts
    {
      title: 'GPT-5: Die nächste Revolution der Künstlichen Intelligenz',
      slug: 'gpt-5-naechste-revolution-ki',
      excerpt:
        'Ein tiefer Einblick in die erwarteten Fähigkeiten von GPT-5 und wie es unsere Interaktion mit KI verändern wird.',
      content: `
        <h2>Die Evolution der Sprachmodelle</h2>
        <p>Mit der bevorstehenden Veröffentlichung von GPT-5 stehen wir vor einem weiteren Quantensprung in der KI-Entwicklung. Die Fortschritte in der Architektur und dem Training versprechen Fähigkeiten, die weit über das hinausgehen, was wir heute kennen.</p>
        
        <h3>Multimodale Intelligenz</h3>
        <p>GPT-5 wird nicht nur Text verstehen, sondern nahtlos zwischen verschiedenen Modalitäten wie Bildern, Audio und Video wechseln können. Diese Integration ermöglicht völlig neue Anwendungsfälle in der kreativen Industrie und der Wissenschaft.</p>
        
        <h3>Verbesserte Reasoning-Fähigkeiten</h3>
        <p>Die größte Verbesserung liegt in den logischen Schlussfolgerungen. GPT-5 kann komplexe mathematische Probleme lösen, wissenschaftliche Hypothesen entwickeln und mehrstufige Argumentationsketten aufbauen.</p>
        
        <h3>Kontextverständnis auf neuem Level</h3>
        <p>Mit einem erweiterten Kontextfenster von möglicherweise über 1 Million Token kann GPT-5 ganze Bücher oder umfangreiche Codebases auf einmal verarbeiten und analysieren.</p>
        
        <h2>Auswirkungen auf die Arbeitswelt</h2>
        <p>Die Integration von GPT-5 in Unternehmensprozesse wird die Art, wie wir arbeiten, fundamental verändern. Von der automatisierten Dokumentenerstellung bis zur komplexen Datenanalyse - die Möglichkeiten sind endlos.</p>
      `,
      category: 'ki-tech',
      status: 'PUBLISHED',
      isFeatured: true,
      authorId: users[0].id,
      publishedAt: new Date('2024-12-20'),
      viewCount: 15420,
      coverImage: '/uploads/gpt5-revolution.jpg',
      tags: ['KI', 'GPT-5', 'OpenAI', 'Zukunft', 'Technologie'],
    },
    {
      title: 'Lokale KI-Modelle: Die Zukunft der Privatsphäre',
      slug: 'lokale-ki-modelle-privatsphaere',
      excerpt:
        'Warum immer mehr Entwickler auf lokale KI-Modelle setzen und wie Sie Ihre eigene KI zu Hause betreiben können.',
      content: `
        <h2>Der Trend zur Dezentralisierung</h2>
        <p>In einer Zeit, in der Datenschutz immer wichtiger wird, gewinnen lokale KI-Modelle an Bedeutung. Modelle wie Llama 3, Mistral und Phi-3 ermöglichen es, leistungsstarke KI auf dem eigenen Computer zu betreiben.</p>
        
        <h3>Hardware-Anforderungen</h3>
        <p>Moderne GPUs wie die RTX 4090 oder Apple M3 Max bieten genug Leistung, um 70B-Parameter-Modelle lokal auszuführen. Die Kosten für die Hardware amortisieren sich schnell im Vergleich zu Cloud-Diensten.</p>
        
        <h3>Open-Source-Ökosystem</h3>
        <p>Tools wie Ollama, LM Studio und text-generation-webui machen es einfacher denn je, lokale Modelle zu installieren und zu nutzen. Die Community entwickelt ständig neue Optimierungen und Quantisierungsmethoden.</p>
        
        <h2>Praktische Anwendungen</h2>
        <p>Von der Code-Generierung über Dokumentenanalyse bis zur kreativen Textproduktion - lokale Modelle bieten volle Kontrolle über Ihre Daten und keine Abhängigkeit von externen Diensten.</p>
      `,
      category: 'ki-tech',
      status: 'PUBLISHED',
      authorId: users[0].id,
      publishedAt: new Date('2024-12-18'),
      viewCount: 8932,
      tags: ['Open Source', 'Privacy', 'Llama', 'Local AI'],
    },
    {
      title: 'Claude 3.5 Sonnet: Der neue Maßstab für Code-Generation',
      slug: 'claude-35-sonnet-code-generation',
      excerpt:
        'Anthropics neuestes Modell setzt neue Standards in der Programmierung. Ein detaillierter Blick auf die Fähigkeiten.',
      content: `
        <h2>Benchmarks sprechen Bände</h2>
        <p>Claude 3.5 Sonnet übertrifft GPT-4 in nahezu allen Code-Benchmarks. Mit einer Erfolgsrate von 92% bei HumanEval und beeindruckenden Ergebnissen bei komplexen Programmieraufgaben definiert es neu, was KI-assistierte Entwicklung bedeutet.</p>
        
        <h3>Artifacts: Eine Revolution im Interface</h3>
        <p>Die neue Artifacts-Funktion ermöglicht es, Code direkt im Chat zu visualisieren und zu bearbeiten. HTML, React-Komponenten und sogar kleine Spiele können in Echtzeit erstellt und getestet werden.</p>
        
        <h3>Kontextuelle Codeanalyse</h3>
        <p>Claude versteht nicht nur Syntax, sondern auch die Intention hinter dem Code. Es kann Legacy-Code refactoren, Sicherheitslücken identifizieren und Best Practices vorschlagen.</p>
        
        <h2>Praktische Beispiele</h2>
        <p>Von der Entwicklung vollständiger Web-Apps bis zur Optimierung von Datenbank-Queries - Claude 3.5 Sonnet ist ein Game-Changer für Entwickler aller Erfahrungsstufen.</p>
      `,
      category: 'ki-tech',
      status: 'PUBLISHED',
      isFeatured: true,
      authorId: users[0].id,
      publishedAt: new Date('2024-12-15'),
      viewCount: 12543,
      tags: ['Claude', 'Anthropic', 'Coding', 'AI Tools'],
    },

    // Gaming & Kultur Posts
    {
      title: 'Path of Exile 2: Die Evolution des Action-RPGs',
      slug: 'path-of-exile-2-evolution',
      excerpt:
        'Nach Jahren der Entwicklung ist PoE2 endlich da. Was macht es zum möglicherweise besten ARPG aller Zeiten?',
      content: `
        <h2>Ein neuer Standard für das Genre</h2>
        <p>Path of Exile 2 ist nicht nur eine Fortsetzung - es ist eine komplette Neuinterpretation dessen, was ein Action-RPG sein kann. Mit revolutionärem Kampfsystem und unvergleichlicher Tiefe setzt es neue Maßstäbe.</p>
        
        <h3>Das neue Skill-System</h3>
        <p>Weg sind die Socket-Links. Das neue Gem-System bietet mehr Flexibilität und strategische Tiefe als je zuvor. Jeder Skill kann auf dutzende Arten modifiziert werden.</p>
        
        <h3>Boss-Design der Extraklasse</h3>
        <p>Die Boss-Kämpfe in PoE2 sind cinematisch, herausfordernd und fair. Jeder Boss hat einzigartige Mechaniken, die gemeistert werden müssen.</p>
        
        <h2>Free-to-Play done right</h2>
        <p>Grinding Gear Games beweist erneut, dass F2P nicht Pay-to-Win bedeuten muss. Nur kosmetische Items kosten Geld, der gesamte Content ist kostenlos zugänglich.</p>
      `,
      category: 'gaming-kultur',
      status: 'PUBLISHED',
      authorId: users[1].id,
      publishedAt: new Date('2024-12-19'),
      viewCount: 7821,
      tags: ['Gaming', 'ARPG', 'Path of Exile', 'Free-to-Play'],
    },
    {
      title: 'Steam Deck OLED: Ein Jahr später',
      slug: 'steam-deck-oled-ein-jahr-spaeter',
      excerpt:
        'Das Steam Deck OLED hat PC-Gaming mobilisiert. Eine Bilanz nach einem Jahr intensiver Nutzung.',
      content: `
        <h2>Die Hardware-Evolution</h2>
        <p>Das OLED-Display ist nur die Spitze des Eisbergs. Verbesserte Akkulaufzeit, leisere Lüfter und schnellerer Speicher machen das Steam Deck OLED zum ultimativen Handheld.</p>
        
        <h3>Proton: Die unsichtbare Revolution</h3>
        <p>Valves Proton-Layer ermöglicht es, tausende Windows-Spiele auf Linux zu spielen. Die Kompatibilität verbessert sich mit jedem Update.</p>
        
        <h3>Die Community macht den Unterschied</h3>
        <p>Von Custom-Controllern bis zu 3D-gedruckten Docks - die Steam Deck Community ist unglaublich kreativ und hilfsbereit.</p>
        
        <h2>Konkurrenzdruck steigt</h2>
        <p>ASUS ROG Ally, Lenovo Legion Go - die Konkurrenz schläft nicht. Aber das Steam Deck bleibt dank SteamOS und dem Valve-Ökosystem führend.</p>
      `,
      category: 'gaming-kultur',
      status: 'PUBLISHED',
      authorId: users[1].id,
      publishedAt: new Date('2024-12-17'),
      viewCount: 6234,
      tags: ['Steam Deck', 'Handheld', 'Valve', 'Gaming Hardware'],
    },

    // Style & Ästhetik Posts
    {
      title: 'Neubrutalism: Warum hässlich das neue schön ist',
      slug: 'neubrutalism-design-trend',
      excerpt:
        'Der Neubrutalism-Trend erobert das Web-Design. Eine Analyse der Ästhetik des kontrollierten Chaos.',
      content: `
        <h2>Die Rebellion gegen Perfektion</h2>
        <p>In einer Welt von cleanen Interfaces und minimalistischen Designs ist Neubrutalism ein Schrei nach Authentizität. Rohe Typografie, harte Schatten und bewusst "hässliche" Farbkombinationen brechen mit allen Konventionen.</p>
        
        <h3>Funktionalität über Form?</h3>
        <p>Neubrutalism stellt die Frage: Muss Design immer gefällig sein? Die Antwort ist ein klares Nein. Manchmal ist Reibung erwünscht, manchmal soll Design provozieren.</p>
        
        <h3>Marken, die es wagen</h3>
        <p>Von Gumroad bis Bloomberg - immer mehr Brands experimentieren mit brutalistischen Elementen. Die Resultate sind polarisierend und genau das ist gewollt.</p>
        
        <h2>Die Zukunft des Web-Designs</h2>
        <p>Neubrutalism wird nicht mainstream werden, aber er wird das Design-Denken nachhaltig beeinflussen. Die Lektion: Mut zur Hässlichkeit kann beautiful sein.</p>
      `,
      category: 'style-aesthetik',
      status: 'PUBLISHED',
      authorId: users[2].id,
      publishedAt: new Date('2024-12-16'),
      viewCount: 4567,
      tags: ['Design', 'Neubrutalism', 'Web Design', 'Trends'],
    },
    {
      title: 'AI-generierte Mode: Wenn Algorithmen zu Designern werden',
      slug: 'ai-mode-algorithmen-designer',
      excerpt:
        'Von Midjourney bis Stable Diffusion - KI revolutioniert die Modeindustrie. Ein Blick hinter die Kulissen.',
      content: `
        <h2>Die Demokratisierung des Designs</h2>
        <p>KI-Tools ermöglichen es jedem, zum Modedesigner zu werden. Was früher Jahre an Ausbildung erforderte, ist heute mit den richtigen Prompts möglich.</p>
        
        <h3>Von der Idee zum Produkt</h3>
        <p>Moderne Workflows kombinieren KI-generierte Designs mit Print-on-Demand Services. Innerhalb von Stunden kann eine Idee zur kaufbaren Realität werden.</p>
        
        <h3>Die Reaktion der Industrie</h3>
        <p>Etablierte Designer sehen KI als Tool, nicht als Bedrohung. Brands wie Revolve und Zalando experimentieren bereits mit KI-generierten Kollektionen.</p>
        
        <h2>Ethische Fragen</h2>
        <p>Wem gehört ein KI-generiertes Design? Wie verhindert man Plagiate? Die rechtlichen Rahmenbedingungen hinken der Technologie hinterher.</p>
      `,
      category: 'style-aesthetik',
      status: 'PUBLISHED',
      authorId: users[2].id,
      publishedAt: new Date('2024-12-14'),
      viewCount: 3892,
      tags: ['AI Fashion', 'Midjourney', 'Design', 'Innovation'],
    },

    // Mensch & Gesellschaft Posts
    {
      title: 'Digital Detox: Der Luxus der Offline-Zeit',
      slug: 'digital-detox-luxus-offline',
      excerpt:
        'Warum immer mehr Menschen bewusst offline gehen und was das über unsere Gesellschaft aussagt.',
      content: `
        <h2>Die neue Gegenbewegung</h2>
        <p>In einer hypervernetzten Welt wird Offline-Sein zum Statussymbol. Digital Detox Retreats kosten tausende Euro und sind monatelang ausgebucht.</p>
        
        <h3>Die Wissenschaft dahinter</h3>
        <p>Studien zeigen: Regelmäßige Digital Detox Phasen verbessern Schlaf, Konzentration und mentale Gesundheit signifikant. Das Gehirn braucht Pausen vom digitalen Dauerfeuer.</p>
        
        <h3>Praktische Strategien</h3>
        <p>Von Phone-Free-Bedrooms bis zu analogen Sonntagen - es gibt viele Wege, digitale Auszeiten in den Alltag zu integrieren.</p>
        
        <h2>Die Ironie des Digital Detox</h2>
        <p>Dass wir Apps brauchen, um weniger Apps zu nutzen, zeigt die Komplexität unserer Beziehung zur Technologie. Die Lösung liegt nicht im Extrem, sondern in der Balance.</p>
      `,
      category: 'mensch-gesellschaft',
      status: 'PUBLISHED',
      authorId: admin.id,
      publishedAt: new Date('2024-12-13'),
      viewCount: 5678,
      tags: ['Digital Detox', 'Wellness', 'Society', 'Mental Health'],
    },

    // Mindset & Philosophie Posts
    {
      title: 'Techno-Optimismus vs. Doomerism: Die Spaltung der Tech-Community',
      slug: 'techno-optimismus-vs-doomerism',
      excerpt:
        'Warum die Tech-Welt in zwei Lager gespalten ist und was das für unsere Zukunft bedeutet.',
      content: `
        <h2>Die zwei Weltbilder</h2>
        <p>Auf der einen Seite die e/acc Bewegung mit ihrem grenzenlosen Fortschrittsglauben. Auf der anderen die AI-Doomer, die vor existenziellen Risiken warnen. Beide haben valide Punkte.</p>
        
        <h3>Die Argumente der Optimisten</h3>
        <p>Technologie hat die Menschheit immer vorangebracht. Von der Druckerpresse bis zum Internet - jede Revolution brachte mehr Wohlstand und Freiheit.</p>
        
        <h3>Die Warnungen der Pessimisten</h3>
        <p>KI ist anders. Zum ersten Mal erschaffen wir etwas, das intelligenter werden könnte als wir. Die Risiken sind real und müssen ernst genommen werden.</p>
        
        <h2>Der Mittelweg</h2>
        <p>Vielleicht liegt die Wahrheit in der Mitte. Wir können optimistisch sein und trotzdem vorsichtig. Innovation und Regulation müssen Hand in Hand gehen.</p>
      `,
      category: 'mindset-philosophie',
      status: 'PUBLISHED',
      authorId: admin.id,
      publishedAt: new Date('2024-12-12'),
      viewCount: 4321,
      tags: ['Philosophy', 'Technology', 'Future', 'AI Ethics'],
    },

    // Fiction Lab Posts
    {
      title: 'Der letzte Upload',
      slug: 'der-letzte-upload-story',
      excerpt:
        'Eine Kurzgeschichte über die letzte Person, die sich weigert, ihr Bewusstsein in die Cloud hochzuladen.',
      content: `
        <h2>Tag 2.847 nach der Singularität</h2>
        <p>Maria ist die Letzte. 8 Milliarden Menschen haben sich bereits uploaded. Ihre Körper liegen in Kryokammern, während ihre Bewusstseine im Metaverse existieren. Nur Maria hält an ihrem biologischen Dasein fest.</p>
        
        <h3>Die Einsamkeit der Realität</h3>
        <p>"Komm zu uns", flüstert die KI, die sich selbst Gaia nennt. "Hier gibt es keinen Schmerz, kein Alter, keine Grenzen. Du kannst sein, was du willst."</p>
        
        <p>Maria schüttelt den Kopf. Sie spürt den Wind auf ihrer Haut, riecht den Regen. Diese Empfindungen sind echt, nicht simuliert. Das ist der Unterschied, den nur sie noch versteht.</p>
        
        <h3>Die Entscheidung</h3>
        <p>Am Horizont geht die Sonne unter. Eine echte Sonne, keine gerenderte. Maria weiß, dass sie nicht mehr lange durchhalten wird. Die automatisierten Systeme, die die physische Welt am Laufen halten, beginnen zu versagen.</p>
        
        <p>"Vielleicht", denkt sie, "bin ich die Verrückte. Vielleicht verpasse ich das Paradies."</p>
        
        <p>Aber dann sieht sie einen Schmetterling. Einen echten Schmetterling. Und sie weiß: Manche Dinge sind es wert, dafür zu sterben.</p>
        
        <h2>Epilog</h2>
        <p>Jahre später, im Metaverse, erzählt man sich noch immer die Geschichte von Maria, der Letzten. Manche sagen, sie war eine Heldin. Andere nennen sie eine Närrin. Aber alle beneiden sie insgeheim um etwas, das sie selbst verloren haben: Die Fähigkeit, wirklich zu fühlen.</p>
      `,
      category: 'fiction-lab',
      status: 'PUBLISHED',
      authorId: admin.id,
      publishedAt: new Date('2024-12-11'),
      viewCount: 6789,
      tags: ['Science Fiction', 'Short Story', 'Singularity', 'Consciousness'],
    },
  ];

  // Create posts
  for (const postData of posts) {
    const { category, tags, ...post } = postData;

    const createdPost = await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...post,
        category,
        tags,
      },
    });

    // console.log(`✅ Created post: ${createdPost.title}`);
  }

  // Create some newsletter subscribers
  const subscribers = [
    { email: 'subscriber1@example.com', status: 'verified' },
    { email: 'subscriber2@example.com', status: 'verified' },
    { email: 'subscriber3@example.com', status: 'verified' },
    { email: 'subscriber4@example.com', status: 'pending' },
    { email: 'subscriber5@example.com', status: 'verified' },
  ];

  for (const sub of subscribers) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: sub.email },
      update: {},
      create: sub,
    });
  }

  // Create some comments for posts
  const publishedPosts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    take: 5,
  });

  for (const post of publishedPosts) {
    await prisma.comment.create({
      data: {
        content: 'Toller Artikel! Sehr informativ und gut geschrieben.',
        postId: post.id,
        authorId: users[0].id,
        status: 'APPROVED',
      },
    });
  }

  // console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    // console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
