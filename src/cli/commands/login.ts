import type { CliResult } from "../runtime/output.js";

export async function runLoginCommand(): Promise<CliResult> {
  return {
    ok: false,
    code: 2,
    message:
      "Login is not wired in CLI yet. Use Graphyn Desktop sign-in flow, or wait for TBH browser-token auth rollout.",
  };
}
