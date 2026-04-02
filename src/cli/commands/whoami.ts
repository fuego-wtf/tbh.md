import type { CliResult } from "../runtime/output.js";

export async function runWhoamiCommand(): Promise<CliResult> {
  return {
    ok: false,
    code: 2,
    message:
      "No CLI session available yet. whoami will be enabled when browser-token/session exchange is wired.",
  };
}
