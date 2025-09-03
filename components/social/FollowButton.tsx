'use client';

import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  className?: string;
  showIcon?: boolean;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  className,
  showIcon = true,
  size = 'default',
  variant = 'default',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleFollow = async () => {
    startTransition(async () => {
      try {
        const endpoint = isFollowing ? '/api/social/unfollow' : '/api/social/follow';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUserId,
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to signin if not authenticated
            router.push('/signin');
            return;
          }
          throw new Error('Failed to update follow status');
        }

        const data = await response.json();
        setIsFollowing(data.isFollowing);

        // Refresh the page to update follow counts
        router.refresh();
      } catch (error) {
        // console.error('Error updating follow status:', error);
        // Revert optimistic update on error
        setIsFollowing(!isFollowing);
      }
    });
  };

  const getButtonText = () => {
    if (isPending) return 'Loading...';
    return isFollowing ? 'Following' : 'Follow';
  };

  const getButtonIcon = () => {
    if (isPending) return <Loader2 className="w-4 h-4 animate-spin" />;
    return isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />;
  };

  const buttonVariant = isFollowing ? 'outline' : variant;

  return (
    <Button
      onClick={handleFollow}
      disabled={isPending}
      size={size}
      variant={buttonVariant}
      className={cn(
        'transition-all duration-200',
        isFollowing &&
          'hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950 dark:hover:text-red-400',
        className,
      )}
    >
      {showIcon && <span className="mr-2">{getButtonIcon()}</span>}
      <span className={cn(isFollowing && 'group-hover:hidden')}>{getButtonText()}</span>
      {isFollowing && <span className="hidden group-hover:inline">Unfollow</span>}
    </Button>
  );
}

// Compact version for use in cards or lists
export function FollowButtonCompact({
  targetUserId,
  initialIsFollowing,
  className,
}: Omit<FollowButtonProps, 'showIcon' | 'size' | 'variant'>) {
  return (
    <FollowButton
      targetUserId={targetUserId}
      initialIsFollowing={initialIsFollowing}
      showIcon={false}
      size="sm"
      variant="outline"
      className={cn('min-w-[80px]', className)}
    />
  );
}
