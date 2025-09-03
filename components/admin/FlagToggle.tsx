'use client';

import { useState } from 'react';

interface Flag {
  key: string;
  value: string;
  description?: string;
}

interface FlagToggleProps {
  flags: Flag[];
  onUpdate: (key: string, value: string) => void;
}

export default function FlagToggle({ flags, onUpdate }: FlagToggleProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const flagDescriptions: Record<string, string> = {
    registration_enabled: 'Allow new users to register',
    admin_posts_enabled: 'Enable admin posts management',
    admin_flags_ui_enabled: 'Show feature flags UI in admin',
    newsletter_queue_ui_enabled: 'Show newsletter queue in admin',
    maintenance_mode: 'Enable maintenance mode (site offline)',
    debug_mode: 'Enable debug mode (verbose logging)',
  };

  const handleToggle = async (flag: Flag) => {
    const newValue = flag.value === 'true' ? 'false' : 'true';

    setUpdating(flag.key);
    try {
      const response = await fetch(`/api/admin/flags/${flag.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: newValue }),
      });

      if (response.ok) {
        onUpdate(flag.key, newValue);
      } else {
        alert('Failed to update flag');
      }
    } catch (error) {
      // console.error('Update error:', error);
      alert('Failed to update flag');
    } finally {
      setUpdating(null);
    }
  };

  const isBooleanFlag = (value: string) => {
    return value === 'true' || value === 'false';
  };

  return (
    <div className="space-y-4">
      {flags.map((flag) => (
        <div
          key={flag.key}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex-1">
            <div className="flex items-center">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{flag.key}</h3>
              {flag.value !== 'true' && flag.value !== 'false' && (
                <span className="ml-2 inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  {flag.value}
                </span>
              )}
            </div>
            {flagDescriptions[flag.key] && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {flagDescriptions[flag.key]}
              </p>
            )}
          </div>

          {isBooleanFlag(flag.value) && (
            <button
              onClick={() => handleToggle(flag)}
              disabled={updating === flag.key}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                flag.value === 'true'
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              } ${updating === flag.key ? 'opacity-50' : ''}`}
              role="switch"
              aria-checked={flag.value === 'true'}
            >
              <span className="sr-only">Toggle {flag.key}</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  flag.value === 'true' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          )}
        </div>
      ))}

      {flags.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No feature flags configured</p>
        </div>
      )}
    </div>
  );
}
