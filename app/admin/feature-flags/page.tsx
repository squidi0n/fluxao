import { Settings, TrendingUp, Users, Zap } from 'lucide-react';
import { Suspense } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { GROWTH_FLAGS } from '@/lib/feature-flags';
import { prisma } from '@/lib/prisma';

async function getFeatureFlags() {
  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return flags;
  } catch (error) {
    // console.error('Error fetching feature flags:', error);
    return [];
  }
}

function FeatureFlagCard({ flag }: { flag: any }) {
  const isEnabled = flag.enabled;
  const isGrowthFlag = Object.values(GROWTH_FLAGS).includes(flag.id);

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {flag.name}
              {isGrowthFlag && (
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Growth
                </Badge>
              )}
            </CardTitle>
            {flag.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{flag.description}</p>
            )}
          </div>
          <Badge variant={isEnabled ? 'default' : 'outline'} className="text-xs">
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status and Percentage */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Status</label>
            <div className="flex items-center space-x-2 mt-1">
              <Switch checked={isEnabled} />
              <span className="text-sm text-gray-600">{isEnabled ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Rollout</label>
            <div className="mt-1">
              <div className="flex items-center justify-between text-sm">
                <span>{flag.percentage}%</span>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${flag.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions */}
        {flag.conditions && Object.keys(flag.conditions).length > 0 && (
          <div>
            <label className="text-sm font-medium">Conditions</label>
            <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
              <pre>{JSON.stringify(flag.conditions, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* User IDs */}
        {flag.userIds && flag.userIds.length > 0 && (
          <div>
            <label className="text-sm font-medium">Specific Users</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {flag.userIds.slice(0, 3).map((userId: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {userId.substring(0, 8)}...
                </Badge>
              ))}
              {flag.userIds.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{flag.userIds.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-2 border-t text-xs text-gray-500 space-y-1">
          <div>Created: {new Date(flag.createdAt).toLocaleDateString()}</div>
          <div>Updated: {new Date(flag.updatedAt).toLocaleDateString()}</div>
          <div>
            ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{flag.id}</code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function FeatureFlagsData() {
  const flags = await getFeatureFlags();
  const growthFlagIds = Object.values(GROWTH_FLAGS);
  const growthFlags = flags.filter((flag) => growthFlagIds.includes(flag.id as any));
  const otherFlags = flags.filter((flag) => !growthFlagIds.includes(flag.id as any));

  return (
    <div className="space-y-8">
      {/* Growth Experiment Flags */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Growth Experiments
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {growthFlags.map((flag) => (
            <FeatureFlagCard key={flag.id} flag={flag} />
          ))}
        </div>
        {growthFlags.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Zap className="h-8 w-8 mx-auto mb-2" />
            <p>No growth experiment flags found</p>
            <Button className="mt-4" size="sm">
              Initialize Growth Flags
            </Button>
          </div>
        )}
      </div>

      {/* Other Feature Flags */}
      {otherFlags.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Other Feature Flags
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {otherFlags.map((flag) => (
              <FeatureFlagCard key={flag.id} flag={flag} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeatureFlagsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Feature Flags</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage feature rollouts and growth experiments
          </p>
        </div>

        <Button>
          <Settings className="w-4 h-4 mr-2" />
          Add Flag
        </Button>
      </div>

      <Suspense fallback={<div>Loading feature flags...</div>}>
        <FeatureFlagsData />
      </Suspense>
    </div>
  );
}
