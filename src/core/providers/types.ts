import type { CatalogLoadResult } from '../types';

export interface CatalogProvider {
  id: string;
  load: () => Promise<CatalogLoadResult>;
}
