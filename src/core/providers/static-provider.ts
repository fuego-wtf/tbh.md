import type { CatalogProvider } from './types';
import { cacheCatalogPayload, normalizeCatalog } from '../catalog-service';

const FALLBACK_URL = '/catalog/index.json';

export const staticProvider: CatalogProvider = {
  id: 'static',
  load: async () => {
    const response = await fetch(FALLBACK_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Static catalog unavailable (${response.status})`);
    }

    const payload = await response.json();
    cacheCatalogPayload(payload);
    return {
      snapshot: normalizeCatalog(payload),
      source: 'static-fallback',
    };
  },
};
