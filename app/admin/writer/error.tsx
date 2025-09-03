'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function WriterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Writer page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong with Writer
          </h2>
          <p className="text-gray-600 mb-6">
            We're sorry, but there was an error loading the Writer interface.
          </p>
          <div className="space-y-2">
            <Button onClick={reset} variant="default">
              Try again
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin'} 
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}