import type { CatalogProvider } from './types';

class CatalogProviderRegistry {
  private providers: CatalogProvider[] = [];

  register(provider: CatalogProvider): void {
    if (this.providers.some((p) => p.id === provider.id)) {
      throw new Error(`Provider with id "${provider.id}" already registered`);
    }
    this.providers.push(provider);
  }

  getProviders(): CatalogProvider[] {
    return [...this.providers];
  }
}

export const providerRegistry = new CatalogProviderRegistry();
