// PWA Service Worker Registration
// Handles offline mode, caching, and push notifications

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered:', registration.scope);

      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, show update prompt
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  }
}

export async function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission === 'granted';
  }
  return false;
}

export function checkInstallPrompt() {
  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default install prompt
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install banner
    showInstallBanner(deferredPrompt);
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
  });
}

function showInstallBanner(deferredPrompt: any) {
  // Create install banner
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #D4AF37 0%, #C9A961 100%);
    color: #0A0A0A;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(212, 175, 55, 0.3);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    animation: slideUp 0.3s ease-out;
  `;

  banner.innerHTML = `
    <span>Install OmniScope for quick access</span>
    <button id="pwa-install-btn" style="
      background: #0A0A0A;
      color: #D4AF37;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    ">Install</button>
    <button id="pwa-dismiss-btn" style="
      background: transparent;
      color: #0A0A0A;
      border: none;
      padding: 8px;
      cursor: pointer;
      font-size: 20px;
    ">×</button>
  `;

  document.body.appendChild(banner);

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  // Install button handler
  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install prompt outcome:', outcome);
      banner.remove();
      deferredPrompt = null;
    }
  });

  // Dismiss button handler
  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    banner.remove();
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.getElementById('pwa-install-banner')) {
      banner.remove();
    }
  }, 10000);
}

// Check if user previously dismissed install prompt
export function shouldShowInstallPrompt(): boolean {
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (!dismissed) return true;
  
  const dismissedTime = parseInt(dismissed);
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - dismissedTime > sevenDays;
}
