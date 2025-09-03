'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the component to avoid SSR issues
const ProfileSetupContent = dynamic(
  () => import('./ProfileSetupContent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg">Loading profile setup...</div>
        </div>
      </div>
    ),
  }
);

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileSetupContent />
    </Suspense>
  );
}