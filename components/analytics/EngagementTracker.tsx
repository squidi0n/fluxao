'use client';

import { useEffect, useState } from 'react';
import { 
  Activity,
  Eye,
  MousePointer,
  Share2,
  Heart,
  MessageCircle,
  Copy,
  ExternalLink,
  Scroll
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { useArticleTracker } from '@/lib/analytics/tracker';

interface EngagementTrackerProps {
  postId: string;
  slug: string;
  title: string;
  authorId: string;
  className?: string;
  realTimeUpdates?: boolean;
}

interface EngagementEvent {
  id: string;
  type: string;
  timestamp: string;
  data?: {
    element?: string;
    value?: string | number;
    coordinates?: { x: number; y: number };
  };
}

interface EngagementStats {
  totalEvents: number;
  uniqueInteractions: number;
  engagementRate: number;
  averageTimeToFirstInteraction: number;
  mostCommonInteraction: string;
  heatmapData: Array<{
    x: number;
    y: number;
    intensity: number;
    type: string;
  }>;
  eventTimeline: EngagementEvent[];
  scrollMilestones: Array<{
    milestone: number;
    timestamp: string;
    timeToReach: number;
  }>;
}

export function EngagementTracker({ 
  postId, 
  slug, 
  title, 
  authorId, 
  className = '',
  realTimeUpdates = true 
}: EngagementTrackerProps) {
  const [engagementData, setEngagementData] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const { startTracking, stopTracking, getCurrentProgress } = useArticleTracker();

  useEffect(() => {
    // Start article tracking
    startTracking({
      postId,
      slug,
      title,
      authorId,
    });
    setIsTracking(true);

    // Fetch initial engagement data
    fetchEngagementData();

    // Set up real-time updates if enabled
    let interval: NodeJS.Timeout | null = null;
    if (realTimeUpdates) {
      interval = setInterval(fetchEngagementData, 10000); // Update every 10 seconds
    }

    return () => {
      stopTracking();
      setIsTracking(false);
      if (interval) clearInterval(interval);
    };
  }, [postId]);

  const fetchEngagementData = async () => {
    try {
      const response = await fetch(`/api/analytics/engagement/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setEngagementData(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch engagement data:', error);
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${Math.round(remainingSeconds)}s`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'click': return MousePointer;
      case 'scroll': return Scroll;
      case 'share': return Share2;
      case 'like': return Heart;
      case 'comment': return MessageCircle;
      case 'copy': return Copy;
      case 'outbound_click': return ExternalLink;
      default: return Activity;
    }
  };

  const getEventColor = (type: string): string => {
    switch (type) {
      case 'click': return 'text-blue-600 bg-blue-50';
      case 'scroll': return 'text-green-600 bg-green-50';
      case 'share': return 'text-purple-600 bg-purple-50';
      case 'like': return 'text-red-600 bg-red-50';
      case 'comment': return 'text-yellow-600 bg-yellow-50';
      case 'copy': return 'text-gray-600 bg-gray-50';
      case 'outbound_click': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Real-time Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Engagement Tracking
          </h3>
          <div className="flex items-center space-x-2">
            {isTracking && (
              <Badge className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live
              </Badge>
            )}
          </div>
        </div>

        {engagementData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {engagementData.totalEvents}
              </div>
              <div className="text-sm text-gray-500">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {engagementData.uniqueInteractions}
              </div>
              <div className="text-sm text-gray-500">Unique Actions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(engagementData.engagementRate * 100)}%
              </div>
              <div className="text-sm text-gray-500">Engagement Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(engagementData.averageTimeToFirstInteraction)}
              </div>
              <div className="text-sm text-gray-500">Time to Engage</div>
            </div>
          </div>
        )}
      </Card>

      {/* Scroll Milestones */}
      {engagementData?.scrollMilestones && engagementData.scrollMilestones.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Scroll className="w-4 h-4 mr-2" />
            Reading Progress Milestones
          </h4>
          <div className="space-y-2">
            {engagementData.scrollMilestones.map((milestone, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-xs">
                    {milestone.milestone}%
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Reached at {formatTime(milestone.timeToReach)}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(milestone.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Engagement Events */}
      {engagementData?.eventTimeline && engagementData.eventTimeline.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Recent Interactions</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {engagementData.eventTimeline.slice(0, 10).map((event) => {
              const Icon = getEventIcon(event.type);
              const colorClass = getEventColor(event.type);
              
              return (
                <div key={event.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium capitalize">{event.type.replace('_', ' ')}</span>
                      {event.data?.element && (
                        <Badge variant="outline" className="text-xs">
                          {event.data.element}
                        </Badge>
                      )}
                    </div>
                    {event.data?.value && (
                      <div className="text-xs text-gray-500 truncate">
                        {typeof event.data.value === 'string' 
                          ? event.data.value.slice(0, 50) + (event.data.value.length > 50 ? '...' : '')
                          : event.data.value
                        }
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Engagement Heatmap Preview */}
      {engagementData?.heatmapData && engagementData.heatmapData.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Click Heatmap</h4>
          <div className="text-sm text-gray-600 mb-3">
            Most active areas based on user clicks and interactions
          </div>
          <div className="grid grid-cols-4 gap-2">
            {engagementData.heatmapData.slice(0, 8).map((point, index) => (
              <div 
                key={index}
                className="text-center p-2 rounded border"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${Math.min(1, point.intensity / 10)})`,
                  color: point.intensity > 5 ? 'white' : 'inherit'
                }}
              >
                <div className="text-xs font-medium">{point.type}</div>
                <div className="text-xs">{point.intensity} clicks</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Most Common Interaction */}
      {engagementData?.mostCommonInteraction && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Top Interaction</h4>
              <p className="text-sm text-gray-600 capitalize">
                {engagementData.mostCommonInteraction.replace('_', ' ')} is the most common user action
              </p>
            </div>
            <div className={`p-3 rounded-full ${getEventColor(engagementData.mostCommonInteraction)}`}>
              {(() => {
                const Icon = getEventIcon(engagementData.mostCommonInteraction);
                return <Icon className="w-6 h-6" />;
              })()}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Lightweight version for article headers
interface EngagementIndicatorProps {
  postId: string;
  className?: string;
}

export function EngagementIndicator({ postId, className = '' }: EngagementIndicatorProps) {
  const [isActive, setIsActive] = useState(false);
  const [engagementCount, setEngagementCount] = useState(0);

  useEffect(() => {
    // Simple engagement detection
    let eventCount = 0;
    
    const trackEngagement = () => {
      eventCount++;
      setEngagementCount(eventCount);
      setIsActive(true);
      
      // Reset after 2 seconds of no activity
      setTimeout(() => setIsActive(false), 2000);
    };

    const events = ['click', 'scroll', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackEngagement, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackEngagement);
      });
    };
  }, []);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
        isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
      }`} />
      <span className="text-xs text-gray-500">
        {engagementCount > 0 ? `${engagementCount} interactions` : 'Waiting for activity...'}
      </span>
    </div>
  );
}