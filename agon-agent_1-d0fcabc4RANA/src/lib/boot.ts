type StoreConfig = { url: string; anonKey: string; adminEmail: string };

declare global {
  interface Window { __RAFNA_CONFIG__?: StoreConfig }
}

export async function bootStorefront() {
  try {
    const response = await fetch('/api/store-config', { cache: 'no-store' });
    const config = await response.json();
    if (!response.ok || !config.url || !config.anonKey) throw new Error(config.error || 'Supabase configuration is unavailable.');
    window.__RAFNA_CONFIG__ = config;
  } catch (error) {
    // Keep the original storefront accessible; the existing admin demo mode
    // explains the missing connection. Never expose a service-role key here.
    console.error('Supabase configuration:', error);
  }
  const bundlePath = '/assets/index-C1wwRFaK.js';
  await import(/* @vite-ignore */ bundlePath);
}
