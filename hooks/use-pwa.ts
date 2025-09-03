import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker and check for updates
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });

      // console.log('Service Worker registered:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setIsUpdateAvailable(true);
            }
          });
        }
      });

      // Check for updates periodically
      setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000,
      ); // Check every hour
    } catch (error) {
      // console.error('Service Worker registration failed:', error);
    }
  };

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      // console.log('No installation prompt available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        // console.log('PWA installed successfully');
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        // console.log('PWA installation dismissed');
        return false;
      }
    } catch (error) {
      // console.error('PWA installation failed:', error);
      return false;
    }
  }, [deferredPrompt]);

  const updateApp = useCallback(() => {
    if (isUpdateAvailable) {
      // Skip waiting and activate new service worker
      navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });

      // Reload to get the new version
      window.location.reload();
    }
  }, [isUpdateAvailable]);

  const shareContent = useCallback(async (data: ShareData) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          // console.error('Share failed:', error);
        }
        return false;
      }
    }
    return false;
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      // console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options,
        });
        return true;
      }
    }
    return false;
  }, []);

  return {
    isInstalled,
    isInstallable,
    isOnline,
    isUpdateAvailable,
    installApp,
    updateApp,
    shareContent,
    requestNotificationPermission,
    sendNotification,
  };
}
