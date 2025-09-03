import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const quotes = [
  // Alan Turing
  { text: "We can only see a short distance ahead, but we can see plenty there that needs to be done.", author: "Alan Turing", profession: "Computer Scientist", year: 1950, category: "TECHNOLOGY" },
  { text: "A computer would deserve to be called intelligent if it could deceive a human into believing that it was human.", author: "Alan Turing", profession: "Computer Scientist", year: 1950, category: "AI" },
  
  // Steve Jobs
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", profession: "Co-founder of Apple", year: 2005, category: "INNOVATION" },
  { text: "Technology is nothing. What's important is that you have a faith in people.", author: "Steve Jobs", profession: "Co-founder of Apple", category: "TECHNOLOGY" },
  { text: "The desktop metaphor is a revolutionary step forward, but I think it's time we moved beyond it.", author: "Steve Jobs", profession: "Co-founder of Apple", category: "FUTURE" },
  
  // Yuval Noah Harari
  { text: "In the 21st century, our personal data is probably the most valuable resource most humans still have to offer.", author: "Yuval Noah Harari", profession: "Historian", category: "SOCIETY" },
  { text: "Humans were always far better at inventing tools than using them wisely.", author: "Yuval Noah Harari", profession: "Historian", category: "WISDOM" },
  { text: "The most important thing to realize about the future is that it's not some fixed fate.", author: "Yuval Noah Harari", profession: "Historian", category: "FUTURE" },
  { text: "AI is probably the most important thing humanity has ever worked on.", author: "Yuval Noah Harari", profession: "Historian", category: "AI" },
  
  // Elon Musk
  { text: "When something is important enough, you do it even if the odds are not in your favor.", author: "Elon Musk", profession: "Entrepreneur", category: "INNOVATION" },
  { text: "The first step is to establish that something is possible; then probability will occur.", author: "Elon Musk", profession: "Entrepreneur", category: "FUTURE" },
  { text: "AI is far more dangerous than nukes.", author: "Elon Musk", profession: "Entrepreneur", year: 2014, category: "AI" },
  
  // Bill Gates
  { text: "Technology is just a tool. In terms of getting the kids working together and motivating them, the teacher is the most important.", author: "Bill Gates", profession: "Co-founder of Microsoft", category: "TECHNOLOGY" },
  { text: "Most people overestimate what they can do in one year and underestimate what they can do in ten years.", author: "Bill Gates", profession: "Co-founder of Microsoft", category: "WISDOM" },
  { text: "The advance of technology is based on making it fit in so that you don't really even notice it.", author: "Bill Gates", profession: "Co-founder of Microsoft", category: "TECHNOLOGY" },
  
  // Albert Einstein
  { text: "Imagination is more important than knowledge.", author: "Albert Einstein", profession: "Physicist", year: 1929, category: "WISDOM" },
  { text: "The important thing is not to stop questioning.", author: "Albert Einstein", profession: "Physicist", category: "SCIENCE" },
  { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein", profession: "Physicist", category: "INNOVATION" },
  { text: "Logic will get you from A to B. Imagination will take you everywhere.", author: "Albert Einstein", profession: "Physicist", category: "PHILOSOPHY" },
  
  // Geoffrey Hinton (Godfather of AI)
  { text: "In the long term, artificial intelligence will be smarter than us.", author: "Geoffrey Hinton", profession: "AI Pioneer", category: "AI" },
  { text: "Deep learning is going to be able to do things that we never imagined possible.", author: "Geoffrey Hinton", profession: "AI Pioneer", category: "AI" },
  
  // Tim Berners-Lee
  { text: "The Web as I envisaged it, we have not seen it yet. The future is still so much bigger than the past.", author: "Tim Berners-Lee", profession: "Inventor of the Web", category: "TECHNOLOGY" },
  { text: "The original idea of the web was that it should be a collaborative space where you can communicate through sharing information.", author: "Tim Berners-Lee", profession: "Inventor of the Web", category: "SOCIETY" },
  
  // Marc Benioff
  { text: "The business of business is improving the state of the world.", author: "Marc Benioff", profession: "CEO of Salesforce", category: "SOCIETY" },
  
  // Satya Nadella
  { text: "Our industry does not respect tradition - it only respects innovation.", author: "Satya Nadella", profession: "CEO of Microsoft", category: "INNOVATION" },
  { text: "We are moving from a world where computing power was scarce to a place where it becomes almost limitless.", author: "Satya Nadella", profession: "CEO of Microsoft", category: "FUTURE" },
  
  // Reid Hoffman
  { text: "Starting a company is like jumping off a cliff and assembling a plane on the way down.", author: "Reid Hoffman", profession: "Co-founder of LinkedIn", category: "INNOVATION" },
  
  // Paul Graham
  { text: "The way to get started is to quit talking and begin doing.", author: "Paul Graham", profession: "Entrepreneur", category: "INNOVATION" },
  { text: "Make something people want.", author: "Paul Graham", profession: "Entrepreneur", category: "INNOVATION" },
  
  // Naval Ravikant
  { text: "The internet has massively broadened the possible space of careers. Most people haven't figured this out yet.", author: "Naval Ravikant", profession: "Entrepreneur", category: "FUTURE" },
  { text: "Technology is not only the thing that moves the human race forward, but it's the only thing that ever has.", author: "Naval Ravikant", profession: "Entrepreneur", category: "TECHNOLOGY" },
  
  // Ray Kurzweil
  { text: "By 2029, computers will have emotional intelligence and be convincing as people.", author: "Ray Kurzweil", profession: "Futurist", year: 2005, category: "AI" },
  { text: "We won't experience 100 years of progress in the 21st century — it will be more like 20,000 years of progress.", author: "Ray Kurzweil", profession: "Futurist", category: "FUTURE" },
  
  // Demis Hassabis
  { text: "AI will be the most beneficial technology mankind has ever created.", author: "Demis Hassabis", profession: "Co-founder of DeepMind", category: "AI" },
  
  // Andrew Ng
  { text: "AI is the new electricity.", author: "Andrew Ng", profession: "AI Researcher", category: "AI" },
  { text: "Just as electricity transformed almost everything 100 years ago, today I actually have a hard time thinking of an industry that I don't think AI will transform in the next several years.", author: "Andrew Ng", profession: "AI Researcher", category: "AI" },
  
  // Fei-Fei Li
  { text: "AI is not just about technology, it's about people.", author: "Fei-Fei Li", profession: "AI Researcher", category: "AI" },
  
  // Max Tegmark
  { text: "Everything we love about civilization is a product of intelligence, so amplifying our human intelligence with artificial intelligence has the potential of helping civilization flourish.", author: "Max Tegmark", profession: "Physicist", category: "AI" },
  
  // Nick Bostrom
  { text: "The development of full artificial intelligence could spell the end of the human race.", author: "Nick Bostrom", profession: "Philosopher", category: "AI" },
  
  // Kevin Kelly
  { text: "The future will be shaped by those who understand technology, not by those who fear it.", author: "Kevin Kelly", profession: "Technology Journalist", category: "FUTURE" },
  { text: "Technology wants to be free, but it also wants to be organized.", author: "Kevin Kelly", profession: "Technology Journalist", category: "TECHNOLOGY" },
  
  // Peter Thiel
  { text: "We wanted flying cars, instead we got 140 characters.", author: "Peter Thiel", profession: "Entrepreneur", year: 2011, category: "TECHNOLOGY" },
  { text: "The most contrarian thing of all is not to oppose the crowd but to think for yourself.", author: "Peter Thiel", profession: "Entrepreneur", category: "PHILOSOPHY" },
  
  // Jensen Huang (NVIDIA)
  { text: "The killer app of AI has yet to be invented.", author: "Jensen Huang", profession: "CEO of NVIDIA", category: "AI" },
  { text: "AI is the most powerful force of our time.", author: "Jensen Huang", profession: "CEO of NVIDIA", category: "AI" },
  
  // Sam Altman (OpenAI)
  { text: "The development of AI will be the most important technological development in human history.", author: "Sam Altman", profession: "CEO of OpenAI", category: "AI" },
  { text: "I think we're at the beginning of a really exciting time.", author: "Sam Altman", profession: "CEO of OpenAI", category: "FUTURE" },
  
  // Classic Philosophers & Scientists
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", profession: "Former First Lady", category: "FUTURE" },
  { text: "Science is not only a disciple of reason but also one of romance and passion.", author: "Stephen Hawking", profession: "Physicist", category: "SCIENCE" },
  { text: "Intelligence is the ability to adapt to change.", author: "Stephen Hawking", profession: "Physicist", category: "WISDOM" },
  { text: "The greatest enemy of knowledge is not ignorance, it is the illusion of knowledge.", author: "Stephen Hawking", profession: "Physicist", category: "WISDOM" },
  
  // Contemporary Tech Leaders
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Ancient Proverb", profession: "Traditional Wisdom", category: "WISDOM" },
  { text: "Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.", author: "Mark Zuckerberg", profession: "CEO of Meta", category: "INNOVATION" },
  { text: "The biggest risk is not taking any risk.", author: "Mark Zuckerberg", profession: "CEO of Meta", category: "INNOVATION" },
];

async function main() {
  console.log('🌟 Seeding quotes...');
  
  for (const quote of quotes) {
    await prisma.quote.create({
      data: quote,
    });
  }
  
  console.log(`✅ ${quotes.length} quotes created successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding quotes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });