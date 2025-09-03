import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Übersetzungen der englischen Zitate
const translations: Record<string, string> = {
  // Alan Turing
  "We can only see a short distance ahead, but we can see plenty there that needs to be done.": "Wir können nur eine kurze Strecke vorausblicken, aber wir können dort viel erkennen, was getan werden muss.",
  "A computer would deserve to be called intelligent if it could deceive a human into believing that it was human.": "Ein Computer würde es verdienen, intelligent genannt zu werden, wenn er einen Menschen dazu bringen könnte zu glauben, dass er menschlich ist.",
  
  // Steve Jobs
  "Innovation distinguishes between a leader and a follower.": "Innovation unterscheidet zwischen einem Anführer und einem Mitläufer.",
  "Technology is nothing. What's important is that you have a faith in people.": "Technologie ist nichts. Wichtig ist, dass du Vertrauen in die Menschen hast.",
  "The desktop metaphor is a revolutionary step forward, but I think it's time we moved beyond it.": "Die Desktop-Metapher ist ein revolutionärer Schritt vorwärts, aber ich denke, es ist Zeit, dass wir darüber hinausgehen.",
  
  // Elon Musk  
  "When something is important enough, you do it even if the odds are not in your favor.": "Wenn etwas wichtig genug ist, tust du es, auch wenn die Chancen nicht zu deinen Gunsten stehen.",
  "The first step is to establish that something is possible; then probability will occur.": "Der erste Schritt ist zu zeigen, dass etwas möglich ist; dann wird Wahrscheinlichkeit entstehen.",
  "AI is far more dangerous than nukes.": "KI ist weitaus gefährlicher als Atomwaffen.",
  
  // Bill Gates
  "Technology is just a tool. In terms of getting the kids working together and motivating them, the teacher is the most important.": "Technologie ist nur ein Werkzeug. Um Kinder zum Zusammenarbeiten und Motivieren zu bringen, ist der Lehrer am wichtigsten.",
  "Most people overestimate what they can do in one year and underestimate what they can do in ten years.": "Die meisten Menschen überschätzen, was sie in einem Jahr erreichen können, und unterschätzen, was sie in zehn Jahren schaffen können.",
  "The advance of technology is based on making it fit in so that you don't really even notice it.": "Der Fortschritt der Technologie basiert darauf, sie so einzupassen, dass man sie eigentlich gar nicht bemerkt.",
  
  // Einstein
  "Imagination is more important than knowledge.": "Fantasie ist wichtiger als Wissen.",
  "The important thing is not to stop questioning.": "Das Wichtige ist, nicht aufzuhören zu fragen.",
  "A person who never made a mistake never tried anything new.": "Eine Person, die nie einen Fehler gemacht hat, hat nie etwas Neues versucht.",
  "Logic will get you from A to B. Imagination will take you everywhere.": "Logik bringt dich von A nach B. Fantasie bringt dich überall hin.",
  
  // Geoffrey Hinton
  "In the long term, artificial intelligence will be smarter than us.": "Langfristig wird künstliche Intelligenz klüger sein als wir.",
  "Deep learning is going to be able to do things that we never imagined possible.": "Deep Learning wird Dinge ermöglichen, die wir uns nie als möglich vorgestellt haben.",
  
  // Tim Berners-Lee
  "The Web as I envisaged it, we have not seen it yet. The future is still so much bigger than the past.": "Das Web, wie ich es mir vorgestellt habe, haben wir noch nicht gesehen. Die Zukunft ist immer noch so viel größer als die Vergangenheit.",
  "The original idea of the web was that it should be a collaborative space where you can communicate through sharing information.": "Die ursprüngliche Idee des Webs war, dass es ein kollaborativer Raum sein sollte, in dem man durch das Teilen von Informationen kommunizieren kann.",
  
  // Marc Benioff
  "The business of business is improving the state of the world.": "Das Geschäft des Geschäfts ist es, den Zustand der Welt zu verbessern.",
  
  // Satya Nadella
  "Our industry does not respect tradition - it only respects innovation.": "Unsere Industrie respektiert keine Tradition - sie respektiert nur Innovation.",
  "We are moving from a world where computing power was scarce to a place where it becomes almost limitless.": "Wir bewegen uns von einer Welt, in der Rechenleistung knapp war, zu einem Ort, wo sie nahezu grenzenlos wird.",
  
  // Weitere wichtige Übersetzungen
  "Starting a company is like jumping off a cliff and assembling a plane on the way down.": "Ein Unternehmen zu gründen ist wie von einer Klippe zu springen und auf dem Weg nach unten ein Flugzeug zu bauen.",
  "The way to get started is to quit talking and begin doing.": "Der Weg anzufangen ist, aufzuhören zu reden und anzufangen zu handeln.",
  "Make something people want.": "Mache etwas, das die Menschen wollen.",
  "The internet has massively broadened the possible space of careers. Most people haven't figured this out yet.": "Das Internet hat den möglichen Raum der Karrieren massiv erweitert. Die meisten Menschen haben das noch nicht verstanden.",
  "Technology is not only the thing that moves the human race forward, but it's the only thing that ever has.": "Technologie ist nicht nur das, was die Menschheit vorwärts bringt, sondern das Einzige, was das jemals getan hat.",
  "By 2029, computers will have emotional intelligence and be convincing as people.": "Bis 2029 werden Computer emotionale Intelligenz haben und so überzeugend sein wie Menschen.",
  "We won't experience 100 years of progress in the 21st century — it will be more like 20,000 years of progress.": "Wir werden im 21. Jahrhundert keine 100 Jahre Fortschritt erleben - es werden eher 20.000 Jahre Fortschritt sein.",
  "AI will be the most beneficial technology mankind has ever created.": "KI wird die nützlichste Technologie sein, die die Menschheit jemals geschaffen hat.",
  "AI is the new electricity.": "KI ist die neue Elektrizität.",
  "Just as electricity transformed almost everything 100 years ago, today I actually have a hard time thinking of an industry that I don't think AI will transform in the next several years.": "Genau wie Elektrizität vor 100 Jahren fast alles verwandelt hat, fällt es mir heute schwer, eine Industrie zu finden, von der ich nicht glaube, dass KI sie in den nächsten Jahren verwandeln wird.",
  "AI is not just about technology, it's about people.": "KI geht nicht nur um Technologie, sie geht um Menschen.",
  "Everything we love about civilization is a product of intelligence, so amplifying our human intelligence with artificial intelligence has the potential of helping civilization flourish.": "Alles, was wir an der Zivilisation lieben, ist ein Produkt der Intelligenz, also hat die Verstärkung unserer menschlichen Intelligenz mit künstlicher Intelligenz das Potenzial, der Zivilisation zu helfen zu gedeihen.",
  "The development of full artificial intelligence could spell the end of the human race.": "Die Entwicklung vollständiger künstlicher Intelligenz könnte das Ende der menschlichen Rasse bedeuten.",
  "The future will be shaped by those who understand technology, not by those who fear it.": "Die Zukunft wird von denen gestaltet, die Technologie verstehen, nicht von denen, die sie fürchten.",
  "Technology wants to be free, but it also wants to be organized.": "Technologie will frei sein, aber sie will auch organisiert sein.",
  "We wanted flying cars, instead we got 140 characters.": "Wir wollten fliegende Autos, stattdessen bekamen wir 140 Zeichen.",
  "The most contrarian thing of all is not to oppose the crowd but to think for yourself.": "Das Widersprüchlichste von allem ist nicht, sich der Masse zu widersetzen, sondern für sich selbst zu denken.",
  "The killer app of AI has yet to be invented.": "Die Killer-App der KI muss noch erfunden werden.",
  "AI is the most powerful force of our time.": "KI ist die mächtigste Kraft unserer Zeit.",
  "The development of AI will be the most important technological development in human history.": "Die Entwicklung der KI wird die wichtigste technologische Entwicklung in der Menschheitsgeschichte sein.",
  "I think we're at the beginning of a really exciting time.": "Ich denke, wir stehen am Anfang einer wirklich aufregenden Zeit.",
  "The future belongs to those who believe in the beauty of their dreams.": "Die Zukunft gehört denen, die an die Schönheit ihrer Träume glauben.",
  "Science is not only a disciple of reason but also one of romance and passion.": "Wissenschaft ist nicht nur eine Disziplin der Vernunft, sondern auch eine der Romantik und Leidenschaft.",
  "Intelligence is the ability to adapt to change.": "Intelligenz ist die Fähigkeit, sich an Veränderungen anzupassen.",
  "The greatest enemy of knowledge is not ignorance, it is the illusion of knowledge.": "Der größte Feind des Wissens ist nicht Unwissen, sondern die Illusion von Wissen.",
  "Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.": "Bewege dich schnell und mache Dinge kaputt. Wenn du nichts kaputt machst, bewegst du dich nicht schnell genug.",
  "The biggest risk is not taking any risk.": "Das größte Risiko ist es, kein Risiko einzugehen.",
};

async function main() {
  console.log('🔄 Übersetze englische Zitate ins Deutsche...');
  
  const quotes = await prisma.quote.findMany({
    where: { 
      text: {
        in: Object.keys(translations)
      }
    }
  });
  
  console.log(`📝 Gefunden: ${quotes.length} Zitate zum Übersetzen`);
  
  for (const quote of quotes) {
    const germanText = translations[quote.text];
    if (germanText) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { text: germanText }
      });
      console.log(`✅ Übersetzt: ${quote.author} - "${germanText.substring(0, 50)}..."`);
    }
  }
  
  console.log(`🇩🇪 ${quotes.length} Zitate erfolgreich ins Deutsche übersetzt!`);
}

main()
  .catch((e) => {
    console.error('❌ Fehler bei der Übersetzung:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });