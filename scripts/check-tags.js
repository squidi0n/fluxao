const { PrismaClient } = require('@prisma/client');

async function checkTags() {
  const prisma = new PrismaClient();

  try {
    const tagCount = await prisma.tag.count();
    console.log('Total tags in database:', tagCount);

    if (tagCount === 0) {
      console.log('No tags found. Restoring default tags...');

      const defaultTags = [
        'KI',
        'Technologie',
        'Zukunft',
        'Innovation',
        'Wissenschaft',
        'Forschung',
        'Nachhaltigkeit',
        'Digital',
        'Robotik',
        'Automation',
        'MachineLearning',
        'DeepLearning',
        'DataScience',
        'CloudComputing',
        'Cybersecurity',
        'Blockchain',
        'IoT',
        'QuantumComputing',
        'AR',
        'VR',
      ];

      for (const tagName of defaultTags) {
        await prisma.tag.create({
          data: { name: tagName },
        });
      }

      console.log(`Restored ${defaultTags.length} tags`);

      const newCount = await prisma.tag.count();
      console.log('Tags after restore:', newCount);
    } else {
      const tags = await prisma.tag.findMany({ take: 10 });
      console.log('Sample tags:', tags.map((t) => t.name).join(', '));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTags();
