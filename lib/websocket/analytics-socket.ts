'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface AnalyticsEvent {
  type: 'visitor_join' | 'visitor_leave' | 'page_view' | 'conversion' | 'revenue' | 'engagement';
  data: any;
  timestamp: Date;
  sessionId: string;
}

export interface AnalyticsSocketConfig {
  url: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export class AnalyticsSocket {
  private ws: WebSocket | null = null;
  private config: AnalyticsSocketConfig;
  private reconnectAttempts = 0;
  private listeners: Map<string, ((event: AnalyticsEvent) => void)[]> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: AnalyticsSocketConfig) {
    this.config = {
      reconnectDelay: 3000,
      maxReconnectAttempts: 5,
      ...config,
    };
  }

  connect() {
    try {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = () => {
        console.log('Analytics WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connection', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const analyticsEvent: AnalyticsEvent = JSON.parse(event.data);
          this.handleMessage(analyticsEvent);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('Analytics WebSocket disconnected:', event.reason);
        this.emit('connection', { status: 'disconnected' });
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Analytics WebSocket error:', error);
        this.emit('connection', { status: 'error', error });
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.config.reconnectDelay);
  }

  private handleMessage(event: AnalyticsEvent) {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(callback => callback(event));

    // Also emit to 'all' listeners
    const allListeners = this.listeners.get('all') || [];
    allListeners.forEach(callback => callback(event));
  }

  private emit(type: string, data: any) {
    const event: AnalyticsEvent = {
      type: type as any,
      data,
      timestamp: new Date(),
      sessionId: 'system',
    };
    this.handleMessage(event);
  }

  on(eventType: string, callback: (event: AnalyticsEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: (event: AnalyticsEvent) => void) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  send(event: Partial<AnalyticsEvent>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        ...event,
        timestamp: new Date(),
      }));
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// React Hook for using Analytics WebSocket
export function useAnalyticsSocket(url: string = 'wss://localhost:3001/analytics') {
  const socketRef = useRef<AnalyticsSocket | null>(null);

  useEffect(() => {
    // In development, we'll simulate the WebSocket with mock data
    if (process.env.NODE_ENV === 'development') {
      // Create a mock socket that generates events
      const mockSocket = new MockAnalyticsSocket();
      socketRef.current = mockSocket as any;
      mockSocket.startMockEvents();
      return () => mockSocket.stopMockEvents();
    }

    // Production WebSocket implementation
    socketRef.current = new AnalyticsSocket({ url });
    socketRef.current.connect();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [url]);

  const subscribe = useCallback((eventType: string, callback: (event: AnalyticsEvent) => void) => {
    socketRef.current?.on(eventType, callback);
  }, []);

  const unsubscribe = useCallback((eventType: string, callback: (event: AnalyticsEvent) => void) => {
    socketRef.current?.off(eventType, callback);
  }, []);

  const send = useCallback((event: Partial<AnalyticsEvent>) => {
    socketRef.current?.send(event);
  }, []);

  return {
    subscribe,
    unsubscribe,
    send,
    isConnected: socketRef.current?.isConnected() || false,
  };
}

// Mock Analytics Socket for development
class MockAnalyticsSocket {
  private listeners: Map<string, ((event: AnalyticsEvent) => void)[]> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  startMockEvents() {
    const events = [
      {
        type: 'visitor_join' as const,
        data: { 
          country: 'Germany', 
          city: 'Berlin',
          page: '/articles/ai-trends',
          userAgent: 'Chrome',
        },
      },
      {
        type: 'page_view' as const,
        data: {
          page: '/articles/startup-guide',
          referrer: 'google.com',
          duration: Math.random() * 300,
        },
      },
      {
        type: 'conversion' as const,
        data: {
          type: 'subscription',
          plan: 'Pro',
          revenue: 9.99,
        },
      },
      {
        type: 'engagement' as const,
        data: {
          action: 'share',
          article: 'KI Revolution 2024',
          platform: 'Twitter',
        },
      },
      {
        type: 'revenue' as const,
        data: {
          amount: Math.random() * 50,
          type: 'subscription',
        },
      },
    ];

    this.intervalId = setInterval(() => {
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      const event: AnalyticsEvent = {
        ...randomEvent,
        timestamp: new Date(),
        sessionId: `mock-${Date.now()}-${Math.random()}`,
      };

      this.handleMessage(event);
    }, Math.random() * 8000 + 2000); // Random interval between 2-10 seconds
  }

  stopMockEvents() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private handleMessage(event: AnalyticsEvent) {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(callback => callback(event));

    const allListeners = this.listeners.get('all') || [];
    allListeners.forEach(callback => callback(event));
  }

  on(eventType: string, callback: (event: AnalyticsEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: (event: AnalyticsEvent) => void) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  send(event: Partial<AnalyticsEvent>) {
    console.log('Mock WebSocket send:', event);
  }

  isConnected(): boolean {
    return true;
  }

  disconnect() {
    this.stopMockEvents();
    this.listeners.clear();
  }
}