export interface CliEnv {
  catalogUrl: string | null;
  installApiBase: string | null;
  installPath: string;
}

function fromEnv(key: string): string | null {
  const value = process.env[key];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function loadCliEnv(): CliEnv {
  return {
    catalogUrl: fromEnv("TBH_CATALOG_URL"),
    installApiBase: fromEnv("TBH_INSTALL_API_BASE"),
    installPath: process.env.TBH_INSTALL_PATH?.trim() || "/api/tbh/install",
  };
}

export function joinUrl(base: string, route: string): string {
  return `${base.replace(/\/$/, "")}/${route.replace(/^\//, "")}`;
}
