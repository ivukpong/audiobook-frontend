'use client';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  useEffect(() => {
    // Detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS (uses different install flow)
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    // Check service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setServiceWorkerReady(true);
        console.log('✓ Service Worker ready for PWA');
      }).catch(err => {
        console.warn('Service Worker not ready:', err);
      });
    }

    const handler = (e: Event) => {
      e.preventDefault();
      console.log('beforeinstallprompt fired');
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      console.log('App installed');
      setIsInstalled(true);
    });

    // Fallback: Show banner after delay if beforeinstallprompt doesn't fire
    const fallbackTimer = setTimeout(() => {
      if (!prompt && !isIOS && !isInstalled && serviceWorkerReady) {
        console.log('beforeinstallprompt did not fire, but SW ready - showing banner');
        // Show empty prompt object to trigger banner display
        setPrompt({} as BeforeInstallPromptEvent);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const install = async () => {
    if (!prompt) return false;
    // If prompt is a fallback empty object, just show instructions
    if (!(prompt as any).prompt) return false;
    await (prompt as any).prompt();
    const { outcome } = await (prompt as any).userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setPrompt(null);
    return outcome === 'accepted';
  };

  return { 
    canInstall: !!prompt || (serviceWorkerReady && !isIOS && !isInstalled), 
    isInstalled, 
    isIOS, 
    install 
  };
}
