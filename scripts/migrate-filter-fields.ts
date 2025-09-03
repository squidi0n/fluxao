import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample subcategories for different main categories
const SUBCATEGORY_MAPPING = {
  'ki-tech': ['machine-learning', 'web-development', 'blockchain', 'cybersecurity'],
  'mensch-gesellschaft': ['social-trends', 'digital-transformation', 'ethics'],
  'style-aesthetik': ['ui-ux-design', 'visual-arts', 'typography'],
  'gaming-kultur': ['game-design', 'esports', 'virtual-reality'],
  'mindset-philosophie': ['digital-philosophy', 'future-thinking', 'innovation'],
  'fiction-lab': ['sci-fi-stories', 'creative-writing', 'experimental']
};

const CONTENT_TYPES = ['TUTORIAL', 'NEWS', 'OPINION', 'INTERVIEW', 'REVIEW', 'DEEP_DIVE'];
const DIFFICULTY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

// Function to estimate reading time based on content length
function estimateReadTime(content: string): number {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

// Function to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function migrateFilterFields() {
  try {
    console.log('Starting migration of filter fields...');

    // Get all published posts
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED'
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    console.log(`Found ${posts.length} posts to migrate...`);

    let updatedCount = 0;

    for (const post of posts) {
      const updates: any = {};

      // Add subcategory based on main category
      if (post.categories.length > 0) {
        const mainCategorySlug = post.categories[0].category.slug;
        const possibleSubcategories = SUBCATEGORY_MAPPING[mainCategorySlug as keyof typeof SUBCATEGORY_MAPPING];
        
        if (possibleSubcategories && !post.subcategory) {
          updates.subcategory = getRandomItem(possibleSubcategories);
        }
      }

      // Add content type if not exists
      if (!post.contentType) {
        // Assign content type based on title keywords
        const title = post.title.toLowerCase();
        if (title.includes('tutorial') || title.includes('guide') || title.includes('how to')) {
          updates.contentType = 'TUTORIAL';
        } else if (title.includes('news') || title.includes('breaking') || title.includes('announced')) {
          updates.contentType = 'NEWS';
        } else if (title.includes('review') || title.includes('test') || title.includes('comparison')) {
          updates.contentType = 'REVIEW';
        } else if (title.includes('interview') || title.includes('talk with')) {
          updates.contentType = 'INTERVIEW';
        } else if (title.includes('deep dive') || title.includes('analysis') || title.includes('explained')) {
          updates.contentType = 'DEEP_DIVE';
        } else {
          updates.contentType = getRandomItem(CONTENT_TYPES);
        }
      }

      // Add difficulty level if not exists
      if (!post.difficultyLevel) {
        const title = post.title.toLowerCase();
        const content = post.content.toLowerCase();
        
        if (title.includes('beginner') || title.includes('basics') || title.includes('introduction') ||
            content.includes('basics') || content.includes('getting started')) {
          updates.difficultyLevel = 'BEGINNER';
        } else if (title.includes('advanced') || title.includes('expert') || title.includes('complex') ||
                   content.includes('advanced') || content.includes('complex')) {
          updates.difficultyLevel = 'ADVANCED';
        } else {
          updates.difficultyLevel = 'INTERMEDIATE';
        }
      }

      // Add estimated read time if not exists
      if (!post.estimatedReadTime && post.content) {
        updates.estimatedReadTime = estimateReadTime(post.content);
      }

      // Update the post if there are changes
      if (Object.keys(updates).length > 0) {
        await prisma.post.update({
          where: { id: post.id },
          data: updates
        });

        updatedCount++;
        console.log(`Updated post "${post.title}" with:`, updates);
      }
    }

    console.log(`Migration completed! Updated ${updatedCount} out of ${posts.length} posts.`);

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateFilterFields();