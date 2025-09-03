import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const germanQuotes = [
  // Alan Turing
  { text: "Wir können nur eine kurze Strecke vorausblicken, aber wir können dort viel erkennen, was getan werden muss.", author: "Alan Turing", profession: "Computer-Wissenschaftler", year: 1950, category: "TECHNOLOGY" },
  { text: "Ein Computer würde es verdienen, intelligent genannt zu werden, wenn er einen Menschen dazu bringen könnte zu glauben, dass er menschlich ist.", author: "Alan Turing", profession: "Computer-Wissenschaftler", year: 1950, category: "AI" },
  
  // Steve Jobs
  { text: "Innovation unterscheidet zwischen einem Anführer und einem Mitläufer.", author: "Steve Jobs", profession: "Mitgründer von Apple", year: 2005, category: "INNOVATION" },
  { text: "Technologie ist nichts. Wichtig ist, dass du Vertrauen in die Menschen hast.", author: "Steve Jobs", profession: "Mitgründer von Apple", category: "TECHNOLOGY" },
  { text: "Die Zukunft gehört denen, die an die Schönheit ihrer Träume glauben.", author: "Steve Jobs", profession: "Mitgründer von Apple", category: "FUTURE" },
  
  // Yuval Noah Harari
  { text: "Im 21. Jahrhundert sind unsere persönlichen Daten wahrscheinlich die wertvollste Ressource, die die meisten Menschen noch zu bieten haben.", author: "Yuval Noah Harari", profession: "Historiker", category: "SOCIETY" },
  { text: "Menschen waren schon immer viel besser darin, Werkzeuge zu erfinden als sie weise zu nutzen.", author: "Yuval Noah Harari", profession: "Historiker", category: "WISDOM" },
  { text: "Das Wichtigste zu verstehen ist, dass die Zukunft kein festes Schicksal ist.", author: "Yuval Noah Harari", profession: "Historiker", category: "FUTURE" },
  { text: "KI ist wahrscheinlich das Wichtigste, woran die Menschheit jemals gearbeitet hat.", author: "Yuval Noah Harari", profession: "Historiker", category: "AI" },
  
  // Elon Musk
  { text: "Wenn etwas wichtig genug ist, tust du es, auch wenn die Chancen nicht zu deinen Gunsten stehen.", author: "Elon Musk", profession: "Unternehmer", category: "INNOVATION" },
  { text: "Der erste Schritt ist zu zeigen, dass etwas möglich ist; dann wird Wahrscheinlichkeit entstehen.", author: "Elon Musk", profession: "Unternehmer", category: "FUTURE" },
  { text: "KI ist weitaus gefährlicher als Atomwaffen.", author: "Elon Musk", profession: "Unternehmer", year: 2014, category: "AI" },
  
  // Albert Einstein
  { text: "Fantasie ist wichtiger als Wissen.", author: "Albert Einstein", profession: "Physiker", year: 1929, category: "WISDOM" },
  { text: "Das Wichtige ist, nicht aufzuhören zu fragen.", author: "Albert Einstein", profession: "Physiker", category: "SCIENCE" },
  { text: "Eine Person, die nie einen Fehler gemacht hat, hat nie etwas Neues versucht.", author: "Albert Einstein", profession: "Physiker", category: "INNOVATION" },
  { text: "Logik bringt dich von A nach B. Fantasie bringt dich überall hin.", author: "Albert Einstein", profession: "Physiker", category: "PHILOSOPHY" },
  
  // Deutsche Denker
  { text: "Die Philosophen haben die Welt nur verschieden interpretiert; es kommt aber darauf an, sie zu verändern.", author: "Karl Marx", profession: "Philosoph", year: 1845, category: "PHILOSOPHY" },
  { text: "Was mich nicht umbringt, macht mich stärker.", author: "Friedrich Nietzsche", profession: "Philosoph", year: 1888, category: "WISDOM" },
  { text: "Der Mensch ist das einzige Tier, das arbeitet.", author: "Voltaire", profession: "Philosoph", category: "SOCIETY" },
  
  // Modern Tech (deutsche Übersetzungen)
  { text: "Die beste Zeit, einen Baum zu pflanzen, war vor 20 Jahren. Die zweitbeste Zeit ist jetzt.", author: "Chinesisches Sprichwort", profession: "Traditionelle Weisheit", category: "WISDOM" },
  { text: "Das größte Risiko ist es, kein Risiko einzugehen.", author: "Mark Zuckerberg", profession: "CEO von Meta", category: "INNOVATION" },
  { text: "Bewege dich schnell und mache Dinge kaputt. Wenn du nichts kaputt machst, bewegst du dich nicht schnell genug.", author: "Mark Zuckerberg", profession: "CEO von Meta", category: "INNOVATION" },
  
  // Bill Gates
  { text: "Die meisten Menschen überschätzen, was sie in einem Jahr erreichen können, und unterschätzen, was sie in zehn Jahren schaffen können.", author: "Bill Gates", profession: "Mitgründer von Microsoft", category: "WISDOM" },
  { text: "Technologie ist nur ein Werkzeug. Um Kinder zum Zusammenarbeiten und Motivieren zu bringen, ist der Lehrer am wichtigsten.", author: "Bill Gates", profession: "Mitgründer von Microsoft", category: "TECHNOLOGY" },
  
  // Zukunftsdenker
  { text: "Die Zukunft wird von denen gestaltet, die Technologie verstehen, nicht von denen, die sie fürchten.", author: "Kevin Kelly", profession: "Technologie-Journalist", category: "FUTURE" },
  { text: "Wir wollten fliegende Autos, stattdessen bekamen wir 140 Zeichen.", author: "Peter Thiel", profession: "Unternehmer", year: 2011, category: "TECHNOLOGY" },
  
  // KI-Forscher
  { text: "KI ist die neue Elektrizität.", author: "Andrew Ng", profession: "KI-Forscher", category: "AI" },
  { text: "Langfristig wird künstliche Intelligenz klüger sein als wir.", author: "Geoffrey Hinton", profession: "KI-Pionier", category: "AI" },
  
  // Wissenschaft & Fortschritt  
  { text: "Wissenschaft ist nicht nur eine Disziplin der Vernunft, sondern auch eine der Romantik und Leidenschaft.", author: "Stephen Hawking", profession: "Physiker", category: "SCIENCE" },
  { text: "Intelligenz ist die Fähigkeit, sich an Veränderungen anzupassen.", author: "Stephen Hawking", profession: "Physiker", category: "WISDOM" },
  { text: "Der größte Feind des Wissens ist nicht Unwissen, sondern die Illusion von Wissen.", author: "Stephen Hawking", profession: "Physiker", category: "WISDOM" },
  
  // Tech-Philosophie
  { text: "Das Geschäft des Geschäfts ist es, den Zustand der Welt zu verbessern.", author: "Marc Benioff", profession: "CEO von Salesforce", category: "SOCIETY" },
  { text: "Unsere Industrie respektiert keine Tradition - sie respektiert nur Innovation.", author: "Satya Nadella", profession: "CEO von Microsoft", category: "INNOVATION" },
  { text: "Ein Unternehmen zu gründen ist wie von einer Klippe zu springen und auf dem Weg nach unten ein Flugzeug zu bauen.", author: "Reid Hoffman", profession: "Mitgründer von LinkedIn", category: "INNOVATION" },
  
  // Deutsche Tech-Zitate
  { text: "Die beste Methode, eine gute Idee zu bekommen, ist, viele Ideen zu haben.", author: "Linus Pauling", profession: "Chemiker", category: "INNOVATION" },
  { text: "Wer aufhört zu lernen, ist alt. Er mag zwanzig oder achtzig sein.", author: "Henry Ford", profession: "Industrieller", category: "WISDOM" },
  { text: "Unmöglich ist nur eine Meinung.", author: "Paulo Coelho", profession: "Schriftsteller", category: "PHILOSOPHY" },
  
  // Moderne Deutsche Denker
  { text: "Die digitale Revolution ist erst der Anfang. Das Wichtigste kommt noch.", author: "Christoph Keese", profession: "Digital-Experte", category: "FUTURE" },
  { text: "In der digitalen Welt gewinnt nicht der Größte, sondern der Schnellste.", author: "Frank Thelen", profession: "Investor", category: "TECHNOLOGY" },
  { text: "KI wird nicht Jobs ersetzen, aber Menschen die KI nutzen werden Menschen ersetzen, die keine KI nutzen.", author: "Kai-Fu Lee", profession: "KI-Experte", category: "AI" },
  
  // Weisheiten für Tech
  { text: "Der beste Code ist der, den man nicht schreiben muss.", author: "Entwickler-Weisheit", profession: "Programmier-Community", category: "TECHNOLOGY" },
  { text: "Perfektion ist erreicht, nicht wenn es nichts mehr hinzuzufügen gibt, sondern wenn es nichts mehr wegzunehmen gibt.", author: "Antoine de Saint-Exupéry", profession: "Schriftsteller", category: "PHILOSOPHY" },
  { text: "Die Zukunft kann man am besten voraussagen, indem man sie selbst gestaltet.", author: "Alan Kay", profession: "Computer-Wissenschaftler", category: "FUTURE" },
  
  // Motivation & Erfolg
  { text: "Erfolg ist zu 1% Inspiration und zu 99% Transpiration.", author: "Thomas Edison", profession: "Erfinder", category: "INNOVATION" },
  { text: "Der Weg zum Erfolg ist, seine Chancen zu verdoppeln.", author: "John D. Rockefeller", profession: "Industrieller", category: "WISDOM" },
  { text: "Träume nicht dein Leben, sondern lebe deinen Traum.", author: "Mark Twain", profession: "Schriftsteller", category: "PHILOSOPHY" },
  
  // Tech & Gesellschaft
  { text: "Das Internet ist das größte Experiment in Anarchie, das die Welt je gesehen hat.", author: "Eric Schmidt", profession: "Ex-CEO von Google", category: "SOCIETY" },
  { text: "Wir überschätzen die Auswirkungen der Technologie kurzfristig und unterschätzen sie langfristig.", author: "Roy Amara", profession: "Futurist", category: "TECHNOLOGY" },
  { text: "Jede ausreichend fortschrittliche Technologie ist von Magie nicht zu unterscheiden.", author: "Arthur C. Clarke", profession: "Schriftsteller", year: 1973, category: "TECHNOLOGY" },
  
  // FluxAO-spezifisch  
  { text: "In einer Welt voller Informationen ist Aufmerksamkeit die wertvollste Währung.", author: "Moderne Weisheit", profession: "Digital-Ära", category: "SOCIETY" },
  { text: "Die besten Ideen entstehen an der Schnittstelle verschiedener Disziplinen.", author: "Steve Jobs", profession: "Mitgründer von Apple", category: "INNOVATION" },
  { text: "Code ist Poesie in einer Sprache, die Computer verstehen.", author: "Entwickler-Philosophie", profession: "Programmier-Community", category: "TECHNOLOGY" },
];

async function main() {
  console.log('🇩🇪 Seeding deutsche Zitate...');
  
  for (const quote of germanQuotes) {
    await prisma.quote.create({
      data: quote,
    });
  }
  
  console.log(`✅ ${germanQuotes.length} deutsche Zitate hinzugefügt!`);
}

main()
  .catch((e) => {
    console.error('❌ Fehler beim Hinzufügen deutscher Zitate:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });