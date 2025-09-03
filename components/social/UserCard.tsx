import { MapPin, Users } from 'lucide-react';
import Link from 'next/link';

import { FollowButtonCompact } from './FollowButton';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  role: string;
  followersCount: number;
  followingCount: number;
  isPublic: boolean;
}

interface UserCardProps {
  user: User;
  currentUserId?: string;
  isFollowing?: boolean;
  showFollowButton?: boolean;
  className?: string;
  compact?: boolean;
}

export function UserCard({
  user,
  currentUserId,
  isFollowing = false,
  showFollowButton = true,
  className,
  compact = false,
}: UserCardProps) {
  const displayName = user.name || user.username || 'Anonymous';
  const profileUrl = `/profile/${user.username || user.id}`;
  const isOwnProfile = currentUserId === user.id;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border',
          className,
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link href={profileUrl}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar || undefined} alt={displayName} />
              <AvatarFallback>{displayName[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0 flex-1">
            <Link href={profileUrl}>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate">
                {displayName}
              </h3>
            </Link>
            {user.username && user.name && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</p>
            )}
          </div>
        </div>

        {showFollowButton && !isOwnProfile && currentUserId && (
          <FollowButtonCompact targetUserId={user.id} initialIsFollowing={isFollowing} />
        )}
      </div>
    );
  }

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Link href={profileUrl} className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatar || undefined} alt={displayName} />
                <AvatarFallback>{displayName[0].toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate">
                  {displayName}
                </h3>
                {user.username && user.name && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    @{user.username}
                  </p>
                )}
                {user.role !== 'USER' && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {user.role}
                  </Badge>
                )}
              </div>
            </div>
          </Link>

          {showFollowButton && !isOwnProfile && currentUserId && (
            <FollowButtonCompact targetUserId={user.id} initialIsFollowing={isFollowing} />
          )}
        </div>

        {user.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{user.bio}</p>
        )}

        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
          {user.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {user.location}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="font-medium">{user.followersCount}</span>
              <span>followers</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{user.followingCount}</span>
              <span>following</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Grid layout for multiple user cards
export function UserCardGrid({
  users,
  currentUserId,
  className,
}: {
  users: User[];
  currentUserId?: string;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {users.map((user) => (
        <UserCard key={user.id} user={user} currentUserId={currentUserId} />
      ))}
    </div>
  );
}

// List layout for compact display
export function UserCardList({
  users,
  currentUserId,
  className,
}: {
  users: User[];
  currentUserId?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {users.map((user) => (
        <UserCard key={user.id} user={user} currentUserId={currentUserId} compact />
      ))}
    </div>
  );
}
