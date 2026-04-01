import type { CatalogProvider } from './types';
import { cacheCatalogPayload, normalizeCatalog } from '../catalog-service';

const CATALOG_URL = import.meta.env.VITE_TBH_CATALOG_URL as string | undefined;

export const backendProvider: CatalogProvider = {
  id: 'api',
  load: async () => {
    if (!CATALOG_URL) {
      throw new Error('VITE_TBH_CATALOG_URL is not configured');
    }

    const response = await fetch(CATALOG_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Catalog API unavailable (${response.status})`);
    }

    const payload = await response.json();
    cacheCatalogPayload(payload);
    return {
      snapshot: normalizeCatalog(payload),
      source: 'api',
    };
  },
};
