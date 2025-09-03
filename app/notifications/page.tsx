'use client';

import { useState } from 'react';
import { Bell, Check, X, Settings, Clock, User, MessageSquare, Heart, BookOpen, Trash2, MoreHorizontal } from 'lucide-react';

interface Notification {
  id: string;
  type: 'comment' | 'like' | 'reply' | 'follow' | 'article' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'comment',
      title: 'Neuer Kommentar',
      message: 'Sarah hat auf deinen Artikel "KI im Alltag" kommentiert',
      timestamp: '2024-03-15T10:30:00Z',
      read: false,
      avatar: '/avatars/sarah.jpg',
      actionUrl: '/article/ki-im-alltag#comments'
    },
    {
      id: '2',
      type: 'like',
      title: 'Dein Kommentar wurde gelikt',
      message: 'Max und 12 andere haben deinen Kommentar gelikt',
      timestamp: '2024-03-15T09:15:00Z',
      read: false,
      avatar: '/avatars/max.jpg',
    },
    {
      id: '3',
      type: 'reply',
      title: 'Antwort auf deinen Kommentar',
      message: 'Lisa hat auf deinen Kommentar geantwortet',
      timestamp: '2024-03-14T16:45:00Z',
      read: true,
      avatar: '/avatars/lisa.jpg',
      actionUrl: '/article/gaming-zukunft#comment-123'
    },
    {
      id: '4',
      type: 'article',
      title: 'Neuer Artikel in deiner Kategorie',
      message: 'Ein neuer Artikel in "KI & Tech" wurde veröffentlicht',
      timestamp: '2024-03-14T14:20:00Z',
      read: true,
      actionUrl: '/article/ai-breakthrough-2024'
    },
    {
      id: '5',
      type: 'system',
      title: 'Newsletter-Einstellungen aktualisiert',
      message: 'Deine Newsletter-Präferenzen wurden erfolgreich gespeichert',
      timestamp: '2024-03-13T11:00:00Z',
      read: true,
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread' | 'comments' | 'likes' | 'system'>('all');

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment':
      case 'reply':
        return <MessageSquare className="w-5 h-5" />;
      case 'like':
        return <Heart className="w-5 h-5" />;
      case 'follow':
        return <User className="w-5 h-5" />;
      case 'article':
        return <BookOpen className="w-5 h-5" />;
      case 'system':
        return <Settings className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'comment':
      case 'reply':
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
      case 'like':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'follow':
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
      case 'article':
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
      case 'system':
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'comments':
        return notification.type === 'comment' || notification.type === 'reply';
      case 'likes':
        return notification.type === 'like';
      case 'system':
        return notification.type === 'system';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Gerade eben';
    } else if (diffInHours < 24) {
      return `vor ${diffInHours}h`;
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Benachrichtigungen
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {unreadCount > 0 && `${unreadCount} neue Benachrichtigungen`}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors text-sm"
              >
                <Check className="w-4 h-4" />
                <span>Alle als gelesen markieren</span>
              </button>
            )}
            
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'Alle', count: notifications.length },
                { key: 'unread', label: 'Ungelesen', count: unreadCount },
                { key: 'comments', label: 'Kommentare', count: notifications.filter(n => n.type === 'comment' || n.type === 'reply').length },
                { key: 'likes', label: 'Likes', count: notifications.filter(n => n.type === 'like').length },
                { key: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    filter === tab.key
                      ? 'border-gray-800 text-gray-900 dark:border-gray-200 dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-1">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Keine Benachrichtigungen
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Du bist auf dem neuesten Stand!
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  !notification.read 
                    ? 'bg-white dark:bg-gray-800 border-l-4 border-l-gray-800 dark:border-l-gray-200' 
                    : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(notification.timestamp)}
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-gray-800 dark:bg-gray-200 rounded-full" />
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {notification.actionUrl && (
                          <button className="text-sm text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 font-medium">
                            Anzeigen →
                          </button>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          >
                            Als gelesen markieren
                          </button>
                        )}
                      </div>
                      
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredNotifications.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Weitere laden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}