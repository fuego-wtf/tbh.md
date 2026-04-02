import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import type { Listing } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function safeSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_");
}

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

async function loadArtifactBody(listing: Listing): Promise<string> {
  const relative = `../../../public/artifacts/${safeSegment(listing.owner)}/${safeSegment(
    listing.type,
  )}/${safeSegment(listing.slug)}/${safeSegment(listing.version)}.md`;
  const filePath = path.resolve(__dirname, relative);

  try {
    return await readFile(filePath, "utf8");
  } catch {
    // Static fallback artifact synthesized from catalog entry.
    return buildArtifactBody(listing);
  }
}

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export async function installStaticArtifact(listing: Listing): Promise<{
  installedPath: string;
  integrity: string;
  source: "artifact" | "generated";
}> {
  const body = await loadArtifactBody(listing);
  const source: "artifact" | "generated" = body.includes("## Install Source")
    ? "generated"
    : "artifact";

  const root = process.env.TBH_INSTALL_DIR?.trim() || path.join(process.cwd(), ".tbh", "installed");
  const installDir = path.resolve(root, safeSegment(listing.owner), safeSegment(listing.type));
  await mkdir(installDir, { recursive: true });

  const targetFile = path.join(installDir, `${safeSegment(listing.slug)}.md`);
  await writeFile(targetFile, body, "utf8");

  return {
    installedPath: targetFile,
    integrity: sha256(body),
    source,
  };
}
