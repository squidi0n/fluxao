'use client';

import dynamic from 'next/dynamic';

// Heavy admin components - loaded only when needed
export const PostFormV2 = dynamic(() => import('./admin/PostFormV2'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg">Loading Editor...</div>,
  ssr: false,
});

export const TipTapEditor = dynamic(() => import('./admin/TipTapEditor'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg">Loading Editor...</div>,
  ssr: false,
});

export const NewsletterDraftEditor = dynamic(() => import('./admin/NewsletterDraftEditor'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg">Loading Newsletter Editor...</div>,
  ssr: false,
});

export const TagsManagement = dynamic(() => import('./admin/TagsManagement'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg">Loading Tags Manager...</div>,
  ssr: false,
});

export const PostTable = dynamic(() => import('./admin/PostTable'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg">Loading Posts...</div>,
  ssr: false,
});

// Newsletter components - loaded when user interacts
export const NewsletterOptIn = dynamic(() => import('./newsletter/NewsletterOptIn'), {
  loading: () => <div className="animate-pulse bg-purple-100 h-32 rounded-lg"></div>,
  ssr: false,
});

export const OptInModal = dynamic(() => import('./newsletter/OptInModal'), {
  loading: () => null,
  ssr: false,
});

// Analytics components - loaded when admin views them
export const EventTracker = dynamic(() => import('./analytics/EventTracker'), {
  ssr: false,
});

// Security dashboard - heavy component with charts
export const SecurityDashboard = dynamic(() => import('./admin/SecurityDashboard'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg">Loading Security Dashboard...</div>,
  ssr: false,
});

// Performance monitor - only load when needed
export const PerformanceMonitor = dynamic(() => import('./performance/PerformanceMonitor'), {
  loading: () => <div className="text-sm text-gray-500">Loading Performance Monitor...</div>,
  ssr: false,
});