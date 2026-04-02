import { parseInstallTarget } from "../runtime/target.js";
import type { CliResult } from "../runtime/output.js";

export async function runRemoveCommand(rawTarget: string | null): Promise<CliResult> {
  if (!rawTarget) {
    return {
      ok: false,
      code: 1,
      message: "Missing target. Usage: tbh remove @owner/slug",
    };
  }

  try {
    parseInstallTarget(rawTarget);
  } catch (error) {
    return {
      ok: false,
      code: 1,
      message: error instanceof Error ? error.message : "Invalid remove target",
    };
  }

  return {
    ok: false,
    code: 2,
    message:
      "Remove is not wired yet. Use Graphyn Desktop package management until remove API is available.",
  };
}
