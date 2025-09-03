'use client';

import { FileText, Users, MessageSquare, Activity } from 'lucide-react';

interface ActivityItem {
  type: 'post' | 'user' | 'comment';
  title: string;
  subtitle: string;
  time: Date | string;
  icon: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const iconMap = {
  FileText: FileText,
  Users: Users,
  MessageSquare: MessageSquare,
};

const typeColors = {
  post: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  user: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
  },
  comment: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatTimeAgo = (time: Date | string) => {
    const date = new Date(time);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'vor wenigen Sekunden';
    if (diffInSeconds < 3600) return `vor ${Math.floor(diffInSeconds / 60)} Min`;
    if (diffInSeconds < 86400) return `vor ${Math.floor(diffInSeconds / 3600)} Std`;
    return `vor ${Math.floor(diffInSeconds / 86400)} Tag${Math.floor(diffInSeconds / 86400) > 1 ? 'en' : ''}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-600" />
          Recent Activity
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Neueste Aktivitäten auf der Platform
        </p>
      </div>
      <div className="p-6">
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const IconComponent = iconMap[activity.icon as keyof typeof iconMap] || Activity;
              const colors = typeColors[activity.type];
              
              return (
                <div key={index} className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${colors.bg} flex-shrink-0`}>
                    <IconComponent className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {activity.subtitle}
                        </p>
                      </div>
                      <time className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4">
                        {formatTimeAgo(activity.time)}
                      </time>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  {index !== activities.length - 1 && (
                    <div className="absolute left-[42px] mt-10 w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Noch keine Aktivitäten vorhanden
            </p>
          </div>
        )}
        
        {/* View All Link */}
        {activities.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button className="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
              Alle Aktivitäten anzeigen →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}