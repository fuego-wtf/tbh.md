import { joinUrl, type CliEnv } from "./env.js";
import type { InstallTarget } from "./target.js";

export interface InstallApiResponse {
  status?: string;
  installId?: string;
  message?: string;
}

export async function runInstallViaApi(
  env: CliEnv,
  target: InstallTarget,
): Promise<{ ok: boolean; message: string; installId?: string }> {
  if (!env.installApiBase) {
    return {
      ok: false,
      message:
        "Install API is not configured. Set TBH_INSTALL_API_BASE to enable direct installs.",
    };
  }

  const url = joinUrl(env.installApiBase, env.installPath);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ owner: target.owner, slug: target.slug, type: target.type }),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        message: text || `Install request failed (${response.status})`,
      };
    }

    const body = (await response.json()) as InstallApiResponse;
    return {
      ok: true,
      message: body.message || "Install request accepted.",
      installId: body.installId,
    };
  } catch {
    return {
      ok: false,
      message: "Install request failed: unable to reach install API.",
    };
  }
}
