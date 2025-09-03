import {
  MapPin,
  Globe,
  Calendar,
  Users,
  UserCheck,
  Edit,
  Settings,
  Heart,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { FollowButton } from '@/components/social/FollowButton';
import { UserCard } from '@/components/social/UserCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

async function getUserProfile(username: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username },
        { id: username }, // Fallback for UUID
      ],
    },
    include: {
      posts: {
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 6,
      },
      _count: {
        select: {
          posts: { where: { status: 'PUBLISHED' } },
          followers: true,
          following: true,
        },
      },
    },
  });

  return user;
}

async function getFollowStatus(currentUserId: string | undefined, targetUserId: string) {
  if (!currentUserId) return false;

  const follow = await prisma.follow.findFirst({
    where: {
      followerId: currentUserId,
      followingId: targetUserId,
    },
  });

  return !!follow;
}

async function ProfileHeader({ user, currentUserId }: { user: any; currentUserId?: string }) {
  const isOwnProfile = currentUserId === user.id;
  const isFollowing = currentUserId ? await getFollowStatus(currentUserId, user.id) : false;

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <Avatar className="w-32 h-32">
            <AvatarImage src={user.avatar} alt={user.name || user.username || 'User'} />
            <AvatarFallback className="text-2xl">
              {(user.name || user.username || user.email || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.name || user.username}
              </h1>
              {user.username && user.name && (
                <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
              )}
              {user.role !== 'USER' && (
                <Badge variant="secondary" className="mt-2">
                  {user.role}
                </Badge>
              )}
            </div>

            {user.bio && <p className="text-gray-700 dark:text-gray-300 max-w-2xl">{user.bio}</p>}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {user.location}
                </div>
              )}
              {user.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Mitglied seit{' '}
                {new Date(user.createdAt).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                })}
              </div>
            </div>

            {/* Social Links */}
            {(user.github || user.twitter || user.linkedin || user.instagram || user.youtube) && (
              <div className="flex items-center gap-3">
                {user.github && (
                  <a
                    href={`https://github.com/${user.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {user.twitter && (
                  <a
                    href={`https://twitter.com/${user.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {user.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${user.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-blue-700 dark:text-gray-400 dark:hover:text-blue-600"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {user.instagram && (
                  <a
                    href={`https://instagram.com/${user.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-500"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {user.youtube && (
                  <a
                    href={`https://youtube.com/@${user.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{user._count.following}</span>
                <span className="text-gray-600 dark:text-gray-400">Following</span>
              </div>
              <div className="flex items-center gap-1">
                <UserCheck className="w-4 h-4" />
                <span className="font-semibold">{user._count.followers}</span>
                <span className="text-gray-600 dark:text-gray-400">Followers</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{user._count.posts}</span>
                <span className="text-gray-600 dark:text-gray-400">Posts</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isOwnProfile ? (
              <Link href="/settings/profile">
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            ) : currentUserId ? (
              <FollowButton
                targetUserId={user.id}
                initialIsFollowing={isFollowing}
                className="min-w-[120px]"
              />
            ) : (
              <Link href="/signin">
                <Button>Follow</Button>
              </Link>
            )}

            {isOwnProfile && (
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostsList({ posts }: { posts: any[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Noch keine Artikel veröffentlicht</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((post) => (
        <Card key={post.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <h3 className="font-semibold text-lg line-clamp-2">
              <Link
                href={`/posts/${post.slug}`}
                className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
              >
                {post.title}
              </Link>
            </h3>
            {post.teaser && (
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{post.teaser}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
              <span>{post.viewCount} views</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function FollowersList({ userId }: { userId: string }) {
  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  if (followers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Noch keine Follower</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {followers.map((follow) => (
        <UserCard key={follow.id} user={follow.follower} />
      ))}
    </div>
  );
}

async function FollowingList({ userId }: { userId: string }) {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  if (following.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Folgt noch niemandem</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {following.map((follow) => (
        <UserCard key={follow.id} user={follow.following} />
      ))}
    </div>
  );
}

async function UserComments({ userId }: { userId: string }) {
  const comments = await prisma.comment.findMany({
    where: {
      authorEmail: {
        in: await prisma.user
          .findUnique({
            where: { id: userId },
            select: { email: true },
          })
          .then((u) => (u?.email ? [u.email] : [])),
      },
      status: 'APPROVED',
    },
    include: {
      post: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Noch keine Kommentare</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                  Kommentar zu: {comment.post?.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(comment.createdAt).toLocaleDateString('de-DE')}
                </p>
              </div>
              {comment.post?.slug && (
                <Link
                  href={`/blog/${comment.post.slug}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Zum Artikel →
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{comment.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function LikedPosts({ userId }: { userId: string }) {
  // For now, return empty state as we don't have a likes system yet
  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
      <p>Die Gefällt-mir-Funktion kommt bald</p>
    </div>
  );
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const session = await auth();
  const currentUser = session?.user;
  const profileUser = await getUserProfile(username);

  if (!profileUser || (!profileUser.isPublic && currentUser?.id !== profileUser.id)) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading profile...</div>}>
        <ProfileHeader user={profileUser} currentUserId={currentUser?.id} />
      </Suspense>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="posts">Artikel</TabsTrigger>
          <TabsTrigger value="comments">Kommentare</TabsTrigger>
          <TabsTrigger value="liked">Gefällt mir</TabsTrigger>
          <TabsTrigger value="followers">Follower</TabsTrigger>
          <TabsTrigger value="following">Folge ich</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <PostsList posts={profileUser.posts} />
        </TabsContent>

        <TabsContent value="followers">
          <Suspense fallback={<div>Loading followers...</div>}>
            <FollowersList userId={profileUser.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="following">
          <Suspense fallback={<div>Loading following...</div>}>
            <FollowingList userId={profileUser.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="comments">
          <Suspense fallback={<div>Loading comments...</div>}>
            <UserComments userId={profileUser.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="liked">
          <Suspense fallback={<div>Loading liked posts...</div>}>
            <LikedPosts userId={profileUser.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
