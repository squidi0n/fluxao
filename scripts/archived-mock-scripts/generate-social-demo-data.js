// Demo data generator for social features
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateSocialDemoData() {
  console.log('🚀 Generating social features demo data...');

  try {
    // Create demo users with profiles
    const demoUsers = [
      {
        email: 'alice.developer@example.com',
        name: 'Alice Developer',
        username: 'alicedev',
        bio: 'Full-stack developer passionate about React, Node.js, and building amazing user experiences. Coffee enthusiast ☕',
        location: 'San Francisco, CA',
        website: 'https://alicedev.com',
        avatar:
          'https://images.unsplash.com/photo-1494790108755-2616b669ad43?w=150&h=150&fit=crop&crop=face',
        role: 'USER',
        isPublic: true,
      },
      {
        email: 'bob.designer@example.com',
        name: 'Bob Designer',
        username: 'bobdesigns',
        bio: 'UI/UX Designer who loves creating beautiful and functional interfaces. Always learning new design trends 🎨',
        location: 'New York, NY',
        website: 'https://bobdesigns.portfolio.com',
        avatar:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        role: 'USER',
        isPublic: true,
      },
      {
        email: 'carol.writer@example.com',
        name: 'Carol Writer',
        username: 'carolwrites',
        bio: 'Technical writer and content creator. I help developers understand complex concepts through clear, engaging content 📝',
        location: 'Austin, TX',
        website: 'https://carolwrites.blog',
        avatar:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        role: 'EDITOR',
        isPublic: true,
      },
      {
        email: 'dave.devops@example.com',
        name: 'Dave DevOps',
        username: 'daveops',
        bio: 'DevOps engineer specializing in cloud infrastructure, CI/CD, and automation. Docker and Kubernetes enthusiast 🚀',
        location: 'Seattle, WA',
        website: 'https://daveops.tech',
        avatar:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: 'USER',
        isPublic: true,
      },
      {
        email: 'eve.mobile@example.com',
        name: 'Eve Mobile',
        username: 'evemobile',
        bio: 'Mobile app developer focusing on React Native and Flutter. Building apps that make a difference 📱',
        location: 'Toronto, CA',
        website: 'https://evemobile.dev',
        avatar:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        role: 'USER',
        isPublic: true,
      },
    ];

    console.log('Creating demo users...');
    const createdUsers = [];

    for (const userData of demoUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating...`);
        const updatedUser = await prisma.user.update({
          where: { email: userData.email },
          data: userData,
        });
        createdUsers.push(updatedUser);
      } else {
        const newUser = await prisma.user.create({
          data: userData,
        });
        createdUsers.push(newUser);
        console.log(`Created user: ${userData.name} (@${userData.username})`);
      }
    }

    // Create follow relationships
    console.log('Creating follow relationships...');
    const followPairs = [
      // Alice follows Bob, Carol, Dave
      { followerIndex: 0, followingIndex: 1 },
      { followerIndex: 0, followingIndex: 2 },
      { followerIndex: 0, followingIndex: 3 },

      // Bob follows Alice, Eve
      { followerIndex: 1, followingIndex: 0 },
      { followerIndex: 1, followingIndex: 4 },

      // Carol follows Alice, Bob, Dave, Eve
      { followerIndex: 2, followingIndex: 0 },
      { followerIndex: 2, followingIndex: 1 },
      { followerIndex: 2, followingIndex: 3 },
      { followerIndex: 2, followingIndex: 4 },

      // Dave follows Alice, Carol
      { followerIndex: 3, followingIndex: 0 },
      { followerIndex: 3, followingIndex: 2 },

      // Eve follows Carol, Dave
      { followerIndex: 4, followingIndex: 2 },
      { followerIndex: 4, followingIndex: 3 },
    ];

    for (const { followerIndex, followingIndex } of followPairs) {
      const followerId = createdUsers[followerIndex].id;
      const followingId = createdUsers[followingIndex].id;

      const existingFollow = await prisma.follow.findFirst({
        where: {
          followerId,
          followingId,
        },
      });

      if (!existingFollow) {
        await prisma.$transaction(async (tx) => {
          // Create follow record
          await tx.follow.create({
            data: {
              followerId,
              followingId,
            },
          });

          // Update follower count for target user
          await tx.user.update({
            where: { id: followingId },
            data: {
              followersCount: { increment: 1 },
            },
          });

          // Update following count for current user
          await tx.user.update({
            where: { id: followerId },
            data: {
              followingCount: { increment: 1 },
            },
          });
        });

        console.log(
          `${createdUsers[followerIndex].username} → ${createdUsers[followingIndex].username}`,
        );
      }
    }

    // Create some sample posts for the demo users
    console.log('Creating demo posts...');
    const demoPosts = [
      {
        authorIndex: 0, // Alice
        title: 'Building Modern React Applications with TypeScript',
        slug: 'building-modern-react-typescript',
        teaser:
          'Learn how to set up a production-ready React application with TypeScript, including best practices and advanced patterns.',
        content: `# Building Modern React Applications with TypeScript

TypeScript has become the gold standard for building scalable React applications. In this comprehensive guide, we'll explore how to set up a modern React project with TypeScript and implement best practices that will make your code more maintainable and robust.

## Why TypeScript with React?

TypeScript brings static type checking to JavaScript, which helps catch errors during development rather than at runtime. When combined with React, it provides excellent developer experience with IntelliSense, refactoring support, and better documentation.

## Setting Up the Project

Start with Create React App with TypeScript template:

\`\`\`bash
npx create-react-app my-app --template typescript
\`\`\`

## Key Benefits

- **Type Safety**: Catch errors early
- **Better IDE Support**: Enhanced autocomplete and refactoring
- **Self-Documenting Code**: Types serve as documentation
- **Improved Team Collaboration**: Clear interfaces between components`,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        viewCount: 156,
      },
      {
        authorIndex: 1, // Bob
        title: 'Design System Fundamentals for React Apps',
        slug: 'design-system-fundamentals-react',
        teaser:
          'Creating consistent, scalable design systems that developers love to use. From tokens to components.',
        content: `# Design System Fundamentals for React Apps

A well-crafted design system is the foundation of any successful product. It ensures consistency, speeds up development, and creates a cohesive user experience across your application.

## What is a Design System?

A design system is a collection of reusable components, guided by clear standards, that can be assembled to build applications efficiently.

## Core Components

### Design Tokens
- Colors
- Typography
- Spacing
- Border radius
- Shadows

### Component Library
- Buttons
- Forms
- Navigation
- Cards
- Modals

## Implementation Strategy

Start small and grow your design system organically. Begin with the most commonly used components and gradually expand based on your team's needs.`,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        viewCount: 89,
      },
      {
        authorIndex: 2, // Carol
        title: 'Writing Technical Documentation That Developers Actually Read',
        slug: 'technical-documentation-developers-read',
        teaser:
          'Tips and strategies for creating technical documentation that is both comprehensive and accessible.',
        content: `# Writing Technical Documentation That Developers Actually Read

Great documentation is like a good API - it should be intuitive, comprehensive, and easy to use. Here's how to create technical docs that your team will actually want to read and reference.

## Start with User Stories

Before writing any documentation, understand who your audience is and what they're trying to achieve. Are they:
- New team members getting up to speed?
- Experienced developers looking for specific implementation details?
- External developers integrating with your API?

## Structure for Success

### 1. Start with the "Why"
Explain the purpose and context before diving into implementation details.

### 2. Provide Quick Start Guides
Include working examples that users can copy and run immediately.

### 3. Use Clear Headings
Make your content scannable with descriptive headings and subheadings.

### 4. Include Code Examples
Show, don't just tell. Provide realistic code examples that demonstrate actual usage.

## Keep It Updated

Documentation is only valuable if it's current. Set up processes to ensure docs stay in sync with code changes.`,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        viewCount: 234,
      },
    ];

    for (const postData of demoPosts) {
      const authorId = createdUsers[postData.authorIndex].id;

      const existingPost = await prisma.post.findUnique({
        where: { slug: postData.slug },
      });

      if (!existingPost) {
        await prisma.post.create({
          data: {
            ...postData,
            authorId,
            authorIndex: undefined, // Remove this field from the data
          },
        });
        console.log(`Created post: ${postData.title}`);
      }
    }

    console.log('✅ Social features demo data generated successfully!');
    console.log('');
    console.log('📊 Data created:');
    console.log('  - 5 demo users with complete profiles');
    console.log('  - Follow relationships between users');
    console.log('  - 3 sample posts by different authors');
    console.log('');
    console.log('👥 Demo Users Created:');
    createdUsers.forEach((user) => {
      console.log(
        `  - ${user.name} (@${user.username}) - ${user.followersCount} followers, ${user.followingCount} following`,
      );
    });
    console.log('');
    console.log('🌟 Visit the following to test social features:');
    console.log('  - User profiles: http://localhost:3005/profile/alicedev');
    console.log('  - Profile editor: http://localhost:3005/settings/profile');
    console.log('  - Follow/unfollow functionality');
    console.log('  - Social stats and follower lists');
  } catch (error) {
    console.error('Error generating social demo data:', error);
    throw error;
  }
}

generateSocialDemoData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
