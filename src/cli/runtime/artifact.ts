import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import type { Listing, ArtifactSource, InstallManifest, InstallTargetType } from "./types.js";
import { loadCliEnv } from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

function artifactRelativePath(listing: Listing): string {
  if (listing.artifactPath && listing.artifactPath.trim().length > 0) {
    return listing.artifactPath
      .replace(/^\/+/, "")
      .replace(/^tbh\//, "")
      .replace(/^artifacts\//, "artifacts/");
  }

  return [
    "artifacts",
    safeSegment(listing.owner),
    safeSegment(listing.type),
    safeSegment(listing.slug),
    `${safeSegment(listing.version)}.md`,
  ].join("/");
}

function manifestRelativePath(listing: Listing): string {
  return path.posix
    .join(
      "manifests",
      safeSegment(listing.owner),
      safeSegment(listing.type),
      `${safeSegment(listing.slug)}.json`,
    )
    .replace(/^\/+/, "");
}

// ---------------------------------------------------------------------------
// Generated fallback body
// ---------------------------------------------------------------------------

function buildArtifactBody(listing: Listing): string {
  const docTitle = listing.type.toUpperCase();
  return [
    `# ${docTitle}: ${listing.name}`,
    "",
    `owner: ${listing.owner}`,
    `slug: ${listing.slug}`,
    `type: ${listing.type}`,
    `version: ${listing.version}`,
    "",
    "## Description",
    listing.description || "No description provided.",
    "",
    "## Install Source",
    `Generated from static catalog entry @${listing.owner}/${listing.slug}`,
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Manifest parsing
// ---------------------------------------------------------------------------

export function parseManifest(data: unknown): InstallManifest {
  const obj = (data ?? {}) as Record<string, unknown>;
  const hash = String(obj.sha256 ?? obj.sha ?? "");
  const version = String(obj.version ?? "");
  if (!hash) throw new Error("Manifest missing sha256");
  if (!version) throw new Error("Manifest missing version");
  return {
    sha256: hash,
    version,
    size: typeof obj.size === "number" ? obj.size : undefined,
    created: obj.created ? String(obj.created) : undefined,
  };
}

async function loadLocalManifest(
  artifactPath: string,
  listing: Listing,
): Promise<{ manifest: InstallManifest | null; location: string | null }> {
  const explicitManifestPath = path.resolve(
    path.dirname(artifactPath),
    path.basename(manifestRelativePath(listing)),
  );
  const legacyManifestPath = path.join(
    path.dirname(artifactPath),
    `${safeSegment(listing.version)}.manifest.json`,
  );

  for (const manifestPath of [explicitManifestPath, legacyManifestPath]) {
    try {
      const raw = await readFile(manifestPath, "utf8");
      const manifest = parseManifest(JSON.parse(raw));
      return { manifest, location: manifestPath };
    } catch {
      // try next path
    }
  }

  return { manifest: null, location: null };
}

async function loadManifestNearPackagedArtifact(
  listing: Listing,
  artifactPath: string,
): Promise<{ manifest: InstallManifest | null; location: string | null }> {
  const repoRoot = path.resolve(__dirname, "../../../");
  const relativeManifest = manifestRelativePath(listing);
  const preferred = path.join(repoRoot, "public", relativeManifest);
  const nearby = path.resolve(path.dirname(artifactPath), path.basename(preferred));

  for (const manifestPath of [preferred, nearby]) {
    try {
      const raw = await readFile(manifestPath, "utf8");
      return { manifest: parseManifest(JSON.parse(raw)), location: manifestPath };
    } catch {
      // try next
    }
  }

  try {
    return await loadLocalManifest(artifactPath, listing);
  } catch {
    return { manifest: null, location: null };
  }
}

// ---------------------------------------------------------------------------
// Resolved artifact
// ---------------------------------------------------------------------------

interface ResolvedArtifact {
  body: string;
  source: ArtifactSource;
  manifest: InstallManifest | null;
  manifestLocation: string | null;
}

// ---------------------------------------------------------------------------
// Candidate 1 — packaged local artifact
// ---------------------------------------------------------------------------

async function tryPackagedLocal(listing: Listing): Promise<ResolvedArtifact | null> {
  const relative = `../../../public/${artifactRelativePath(listing)}`;
  const filePath = path.resolve(__dirname, relative);
  try {
    const body = await readFile(filePath, "utf8");
    const { manifest, location } = await loadManifestNearPackagedArtifact(listing, filePath);
    return { body, source: "artifact-local", manifest, manifestLocation: location };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Candidate 2 — project-local artifact (.tbh/artifacts/…)
// ---------------------------------------------------------------------------

async function tryProjectLocal(listing: Listing): Promise<ResolvedArtifact | null> {
  const projectRoot = process.cwd();
  const filePath = path.join(projectRoot, ".tbh", artifactRelativePath(listing));
  try {
    const body = await readFile(filePath, "utf8");
    const { manifest, location } = await loadLocalManifest(filePath, listing);
    return { body, source: "artifact-local", manifest, manifestLocation: location };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Candidate 3 — remote static artifact
// ---------------------------------------------------------------------------

async function tryRemote(
  listing: Listing,
  baseUrl: string,
): Promise<ResolvedArtifact | null> {
  const base = baseUrl.replace(/\/$/, "");
  const artifactUrl = `${base}/${artifactRelativePath(listing)}`;
  const manifestUrl = `${base}/${manifestRelativePath(listing)}`;

  try {
    const [artifactRes, manifestRes] = await Promise.all([
      fetch(artifactUrl, { cache: "no-store" }),
      fetch(manifestUrl, { cache: "no-store" }).catch(() => null),
    ]);

    if (!artifactRes.ok) return null;

    const body = await artifactRes.text();

    let manifest: InstallManifest | null = null;
    let manifestLocation: string | null = null;

    if (manifestRes && manifestRes.ok) {
      try {
        const raw = await manifestRes.json();
        manifest = parseManifest(raw);
        manifestLocation = manifestUrl;
      } catch {
        // Invalid manifest — skip verification, but continue with body.
      }
    }

    return { body, source: "artifact-remote", manifest, manifestLocation };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Resolver chain
// ---------------------------------------------------------------------------

async function resolveArtifact(listing: Listing): Promise<ResolvedArtifact> {
  // 1. Packaged local artifact (bundled in public/artifacts)
  const packaged = await tryPackagedLocal(listing);
  if (packaged) return packaged;

  // 2. Project-local artifact (.tbh/artifacts/…)
  const projectLocal = await tryProjectLocal(listing);
  if (projectLocal) return projectLocal;

  // 3. Remote static artifact (when TBH_ARTIFACT_BASE_URL is set)
  const env = loadCliEnv();
  if (env.artifactBaseUrl) {
    const remote = await tryRemote(listing, env.artifactBaseUrl);
    if (remote) return remote;
  }

  // 4. Generated fallback
  return {
    body: buildArtifactBody(listing),
    source: "generated",
    manifest: null,
    manifestLocation: null,
  };
}

// ---------------------------------------------------------------------------
// Install target adapters
// ---------------------------------------------------------------------------

function resolveInstallRoot(
  targetType: InstallTargetType,
  envInstallDir: string | null,
): { root: string; adapter: InstallTargetType } {
  switch (targetType) {
    case "claude-code":
      return {
        root: path.join(process.cwd(), ".claude", "commands"),
        adapter: "claude-code",
      };
    case "codex":
      return {
        root: path.join(process.cwd(), ".codex", "instructions"),
        adapter: "codex",
      };
    case "custom":
      if (!envInstallDir) {
        throw new Error(
          "TBH_INSTALL_DIR is required when TBH_INSTALL_TARGET=custom",
        );
      }
      return { root: path.resolve(envInstallDir), adapter: "custom" };
    case "default":
    default:
      return {
        root: envInstallDir
          ? path.resolve(envInstallDir)
          : path.join(process.cwd(), ".tbh", "installed"),
        adapter: "default",
      };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface InstallArtifactResult {
  installedPath: string;
  integrity: string;
  source: ArtifactSource;
  verified: boolean;
  manifestLocation: string | null;
  destinationAdapter: InstallTargetType;
}

export async function installStaticArtifact(
  listing: Listing,
): Promise<InstallArtifactResult> {
  const env = loadCliEnv();
  const resolved = await resolveArtifact(listing);

  // --- Manifest integrity verification ---
  let verified = false;
  if (resolved.manifest) {
    const actualHash = sha256(resolved.body);
    if (actualHash !== resolved.manifest.sha256) {
      throw new Error(
        `Integrity mismatch for ${listing.slug}@${listing.version}: ` +
          `expected ${resolved.manifest.sha256}, got ${actualHash}`,
      );
    }
    verified = true;
  }

  // --- Install target adapter ---
  const targetType = env.installTarget as InstallTargetType;
  const { root, adapter } = resolveInstallRoot(targetType, env.installDir);

  // Tool-specific targets (claude-code, codex) use a flat directory.
  // Default and custom preserve the owner/type hierarchy.
  const installDir =
    adapter === "claude-code" || adapter === "codex"
      ? root
      : path.join(root, safeSegment(listing.owner), safeSegment(listing.type));

  await mkdir(installDir, { recursive: true });

  const targetFile = path.join(installDir, `${safeSegment(listing.slug)}.md`);
  await writeFile(targetFile, resolved.body, "utf8");

  return {
    installedPath: targetFile,
    integrity: sha256(resolved.body),
    source: resolved.source,
    verified,
    manifestLocation: resolved.manifestLocation,
    destinationAdapter: adapter,
  };
}
