'use client';

import { FileText, Users, MessageSquare, Activity, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityItem {
  type: 'post' | 'user' | 'comment';
  title: string;
  subtitle: string;
  time: Date | string;
  icon: string;
}

interface LiveActivityFeedProps {
  activities: ActivityItem[];
}

const iconMap = {
  FileText: FileText,
  Users: Users,
  MessageSquare: MessageSquare,
};

const typeColors = {
  post: {
    bg: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    text: 'text-white',
    ringColor: 'ring-blue-200',
    dotColor: 'bg-blue-500',
  },
  user: {
    bg: 'bg-gradient-to-br from-green-500 to-emerald-500',
    text: 'text-white',
    ringColor: 'ring-green-200',
    dotColor: 'bg-green-500',
  },
  comment: {
    bg: 'bg-gradient-to-br from-purple-500 to-pink-500',
    text: 'text-white',
    ringColor: 'ring-purple-200',
    dotColor: 'bg-purple-500',
  },
};

export function LiveActivityFeed({ activities }: LiveActivityFeedProps) {
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
    <motion.div 
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Live Activity
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time Platform Activity
              </p>
            </div>
          </div>
          
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">LIVE</span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const IconComponent = iconMap[activity.icon as keyof typeof iconMap] || Activity;
              const colors = typeColors[activity.type];
              
              return (
                <motion.div 
                  key={index} 
                  className="relative flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-300 group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {/* Icon with gradient background */}
                  <div className={`p-3 rounded-xl shadow-lg ${colors.bg} flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <IconComponent className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1 leading-tight">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {activity.subtitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <time>{formatTimeAgo(activity.time)}</time>
                      </div>
                    </div>
                  </div>
                  
                  {/* Connecting line for timeline effect */}
                  {index !== activities.length - 1 && (
                    <div className="absolute left-[34px] top-[68px] w-px h-6 bg-gradient-to-b from-gray-200 to-transparent dark:from-gray-700"></div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Noch keine Aktivitäten vorhanden
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Aktivitäten werden hier in Echtzeit angezeigt
            </p>
          </motion.div>
        )}
        
        {/* Enhanced View All Button */}
        {activities.length > 0 && (
          <motion.div 
            className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <button className="group w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400">
              <span>Alle Aktivitäten anzeigen</span>
              <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}