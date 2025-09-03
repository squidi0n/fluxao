'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Archive, ExternalLink, Clock, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  description?: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;
  aiGenerated: boolean;
  data?: any;
}

interface NotificationCounts {
  total: number;
  unread: number;
  high: number;
  critical: number;
}

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({ total: 0, unread: 0, high: 0, critical: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/notifications?limit=50');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setCounts({
        total: data.notifications?.length || 0,
        unread: data.unreadCount || 0,
        high: data.notifications?.filter((n: Notification) => n.priority === 'HIGH' && !n.isRead).length || 0,
        critical: data.notifications?.filter((n: Notification) => ['URGENT', 'CRITICAL'].includes(n.priority) && !n.isRead).length || 0
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setCounts(prev => ({ 
          ...prev, 
          unread: Math.max(0, prev.unread - 1) 
        }));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Dismiss notification
  const dismissNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}/dismiss`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setCounts(prev => ({ 
          ...prev, 
          total: Math.max(0, prev.total - 1),
          unread: prev.unread > 0 ? prev.unread - 1 : 0
        }));
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      // Track click
      await fetch(`/api/admin/notifications/${notification.id}/click`, {
        method: 'POST'
      });
      
      // Navigate to action URL
      window.location.href = notification.actionUrl;
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' })
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setCounts(prev => ({ ...prev, unread: 0, high: 0, critical: 0 }));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Get priority icon and color
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return { icon: AlertCircle, color: 'text-red-600 bg-red-50' };
      case 'URGENT':
        return { icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' };
      case 'HIGH':
        return { icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50' };
      case 'NORMAL':
        return { icon: Info, color: 'text-blue-600 bg-blue-50' };
      default:
        return { icon: Info, color: 'text-gray-600 bg-gray-50' };
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AI_TASK':
        return '🤖';
      case 'SYSTEM_ALERT':
        return '⚠️';
      case 'CONTENT_ALERT':
        return '📝';
      case 'PERFORMANCE_ALERT':
        return '⚡';
      case 'SECURITY_ALERT':
        return '🔒';
      case 'SUCCESS':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'ERROR':
        return '❌';
      default:
        return '🔔';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Auto-refresh notifications
  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative hover:bg-sky-50 rounded-xl p-2 transition-all duration-300 group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5 text-slate-600 group-hover:text-sky-600" />
        
        {/* Notification Badge */}
        {counts.unread > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-6 h-6 rounded-full text-xs flex items-center justify-center text-white font-bold shadow-xl animate-pulse ${
            counts.critical > 0 ? 'bg-gradient-to-r from-red-500 to-red-600' :
            counts.high > 0 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
            'bg-gradient-to-r from-rose-500 to-red-500'
          }`}>
            {counts.unread > 99 ? '99+' : counts.unread}
          </span>
        )}
        
        {/* Pulse animation for urgent notifications */}
        {counts.critical > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-400 rounded-full animate-ping opacity-75"></span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="text-subtitle text-slate-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {counts.unread > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs hover:bg-sky-50 text-sky-600"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Summary */}
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span>{counts.total} total</span>
              {counts.unread > 0 && (
                <span className="text-blue-600 font-medium">{counts.unread} unread</span>
              )}
              {counts.critical > 0 && (
                <span className="text-red-600 font-medium">{counts.critical} critical</span>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-96">
            {isLoading ? (
              <div className="p-4 text-center text-slate-500">
                <div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading notifications...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                {error}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchNotifications}
                  className="mt-2 text-xs"
                >
                  Retry
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const priorityInfo = getPriorityInfo(notification.priority);
                  const PriorityIcon = priorityInfo.icon;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group ${
                        !notification.isRead ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Type Icon */}
                        <div className="flex-shrink-0 text-lg">
                          {getTypeIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium text-sm truncate ${
                              notification.isRead ? 'text-slate-700' : 'text-slate-900'
                            }`}>
                              {notification.title}
                            </h4>
                            
                            {/* Priority indicator */}
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${priorityInfo.color}`}>
                              <PriorityIcon className="w-3 h-3" />
                            </div>
                          </div>
                          
                          <p className={`text-xs leading-relaxed mb-2 ${
                            notification.isRead ? 'text-slate-500' : 'text-slate-600'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              {formatTime(notification.createdAt)}
                              {notification.aiGenerated && (
                                <Badge variant="secondary" className="text-xs px-2 py-0">
                                  AI
                                </Badge>
                              )}
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {notification.actionUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(notification.id);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs hover:bg-white"
                onClick={() => {
                  window.location.href = '/admin/notifications';
                  setIsOpen(false);
                }}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}