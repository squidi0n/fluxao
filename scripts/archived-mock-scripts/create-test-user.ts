import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@fluxao.de',
        name: 'Test User',
        username: 'testuser',
        passwordHash: hashedPassword,
        emailVerified: true,
        bio: 'Ein begeisterter Leser und Tech-Enthusiast',
        avatar: null,
        website: 'https://fluxao.de',
        location: 'Berlin, Deutschland',
      },
    });

    // console.log('✅ Test User erstellt:');
    // console.log('   Email: test@fluxao.de');
    // console.log('   Passwort: testpassword123');
    // console.log('   User ID:', user.id);

    // Create some reading history for the test user
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      take: 5,
    });

    if (posts.length > 0) {
      for (const post of posts) {
        await prisma.readingHistory.create({
          data: {
            userId: user.id,
            postId: post.id,
            minutes: Math.floor(Math.random() * 10) + 1,
            completed: Math.random() > 0.3,
            lastAt: new Date(),
          },
        });

        // Add some FLUX
        if (Math.random() > 0.5) {
          await prisma.flux.create({
            data: {
              userId: user.id,
              postId: post.id,
              count: Math.floor(Math.random() * 50) + 1,
            },
          });
        }
      }
      // console.log('✅ Lesehistorie und FLUX hinzugefügt');
    }
  } catch (error) {
    if (error.code === 'P2002') {
      // console.log('❌ User existiert bereits: test@fluxao.de');
      // console.log('   Nutze Passwort: testpassword123');
    } else {
      // console.error('Fehler beim Erstellen des Test-Users:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
