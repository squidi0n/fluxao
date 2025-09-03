const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  const users = await prisma.user.findMany({
    where: {
      username: { not: null },
    },
    select: {
      username: true,
      followersCount: true,
      followingCount: true,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  console.log('Users and their counts:');
  users.forEach((user) => {
    console.log(
      `${user.username}: ${user.followersCount} followers (actual: ${user._count.followers}), ${user.followingCount} following (actual: ${user._count.following})`,
    );
  });

  const followCount = await prisma.follow.count();
  console.log(`\nTotal follow records: ${followCount}`);
}

checkData().finally(() => prisma.$disconnect());
