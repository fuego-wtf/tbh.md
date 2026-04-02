export type ListingType = "mode" | "lens" | "skill" | "mcp";

export interface Listing {
  id: string;
  type: ListingType;
  owner: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  versions: string[];
  installs: number;
  weeklyInstalls: number | null;
  url: string | null;
}

export interface CatalogSnapshot {
  generatedAt: string | null;
  groups: Record<"modes" | "lenses" | "skills" | "mcps", Listing[]>;
}
