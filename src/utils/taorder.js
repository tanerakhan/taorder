export const API_VERSION = '0.3.0';

const REQUIRED_NAMESPACES = ['app', 'settings', 'menu', 'tables', 'orders', 'print'];

export function getTaorder() {
  if (typeof window === 'undefined' || !window.taorder) {
    throw new Error(
      'TaOrder API kullanılamıyor. Uygulamayı Electron ile çalıştırın: npm run dev'
    );
  }

  const api = window.taorder;
  const missing = REQUIRED_NAMESPACES.filter((ns) => !api[ns]);

  if (missing.length > 0) {
    throw new Error(
      `TaOrder API güncel değil (eksik: ${missing.join(', ')}). ` +
        'Uygulamayı tamamen kapatıp terminalde npm run dev ile yeniden başlatın.'
    );
  }

  return api;
}

export function isTaorderReady() {
  try {
    getTaorder();
    return true;
  } catch {
    return false;
  }
}
