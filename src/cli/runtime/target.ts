import type { ListingType } from "./types.js";

export interface InstallTarget {
  owner: string;
  slug: string;
  version: string | null;
  type: ListingType | null;
}

const VALID = /^[a-z0-9._-]+$/i;

export function parseInstallTarget(raw: string): InstallTarget {
  if (!raw.startsWith("@")) {
    throw new Error("Install target must start with @owner/slug");
  }

  const withoutAt = raw.slice(1);
  const slashIndex = withoutAt.indexOf("/");
  if (slashIndex < 1) {
    throw new Error("Install target must be in format @owner/slug");
  }

  const owner = withoutAt.slice(0, slashIndex);
  const slugAndVersion = withoutAt.slice(slashIndex + 1);
  if (!owner || !slugAndVersion) {
    throw new Error("Install target must be in format @owner/slug");
  }

  const atVersionIndex = slugAndVersion.lastIndexOf("@");
  const slug = atVersionIndex > 0 ? slugAndVersion.slice(0, atVersionIndex) : slugAndVersion;
  const version = atVersionIndex > 0 ? slugAndVersion.slice(atVersionIndex + 1) : null;

  if (!VALID.test(owner) || !VALID.test(slug) || (version && !VALID.test(version))) {
    throw new Error("Install target contains invalid characters");
  }

  return {
    owner,
    slug,
    version,
    type: null,
  };
}
