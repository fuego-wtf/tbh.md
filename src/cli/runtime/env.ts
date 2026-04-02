export interface CliEnv {
  catalogUrl: string | null;
  installApiBase: string | null;
  installPath: string;
  installDir: string | null;
  artifactBaseUrl: string | null;
  installTarget: string;
}

function fromEnv(key: string): string | null {
  const value = process.env[key];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const VALID_INSTALL_TARGETS = ["default", "claude-code", "codex", "custom"] as const;

export function loadCliEnv(): CliEnv {
  const rawTarget = fromEnv("TBH_INSTALL_TARGET") || "default";
  const installTarget = VALID_INSTALL_TARGETS.includes(rawTarget as (typeof VALID_INSTALL_TARGETS)[number])
    ? rawTarget
    : "default";

  return {
    catalogUrl: fromEnv("TBH_CATALOG_URL"),
    installApiBase: fromEnv("TBH_INSTALL_API_BASE"),
    installPath: process.env.TBH_INSTALL_PATH?.trim() || "/api/tbh/install",
    installDir: fromEnv("TBH_INSTALL_DIR"),
    artifactBaseUrl: fromEnv("TBH_ARTIFACT_BASE_URL"),
    installTarget,
  };
}

export function joinUrl(base: string, route: string): string {
  return `${base.replace(/\/$/, "")}/${route.replace(/^\//, "")}`;
}
