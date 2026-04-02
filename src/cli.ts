#!/usr/bin/env node

import { helpText } from "./cli/commands/help.js";
import { runFindCommand } from "./cli/commands/find.js";
import { runInstallCommand } from "./cli/commands/install.js";
import { runListCommand } from "./cli/commands/list.js";
import { runLoginCommand } from "./cli/commands/login.js";
import { runRemoveCommand } from "./cli/commands/remove.js";
import { runViewCommand } from "./cli/commands/view.js";
import { runWhoamiCommand } from "./cli/commands/whoami.js";
import { printResult, type CliContext, type CliResult } from "./cli/runtime/output.js";

type CommandName =
  | "find"
  | "view"
  | "install"
  | "list"
  | "remove"
  | "login"
  | "whoami";

function packageVersion(): string {
  return "0.1.0";
}

function parseCliArgs(argv: string[]): {
  command: CommandName | null;
  positionals: string[];
  json: boolean;
  help: boolean;
  version: boolean;
} {
  const json = argv.includes("--json");
  const help = argv.includes("--help") || argv.includes("-h") || argv.length === 0;
  const version = argv.includes("--version") || argv.includes("-v");

  const positionals = argv.filter((token) => !token.startsWith("-"));
  const command = (positionals[0] ?? null) as CommandName | null;

  return {
    command,
    positionals: command ? positionals.slice(1) : positionals,
    json,
    help,
    version,
  };
}

async function dispatchCliCommand(
  command: CommandName,
  args: string[],
): Promise<CliResult> {
  switch (command) {
    case "find": {
      return runFindCommand(args[0] ?? null);
    }
    case "view": {
      return runViewCommand(args[0] ?? null);
    }
    case "install": {
      return runInstallCommand(args[0] ?? null);
    }
    case "list": {
      return runListCommand();
    }
    case "remove": {
      return runRemoveCommand(args[0] ?? null);
    }
    case "login": {
      return runLoginCommand();
    }
    case "whoami": {
      return runWhoamiCommand();
    }
    default:
      return {
        ok: false,
        code: 1,
        message: `Unknown command: ${command}`,
      };
  }
}

async function runTbhCliEntry(): Promise<void> {
  const parsed = parseCliArgs(process.argv.slice(2));
  const context: CliContext = { json: parsed.json };

  if (parsed.version) {
    printResult(context, {
      ok: true,
      code: 0,
      message: packageVersion(),
    });
    process.exit(0);
  }

  if (parsed.help || !parsed.command) {
    if (context.json) {
      printResult(context, {
        ok: true,
        code: 0,
        message: "help",
        data: { help: helpText() },
      });
    } else {
      console.log(helpText());
    }
    process.exit(0);
  }

  const result = await dispatchCliCommand(parsed.command, parsed.positionals);
  printResult(context, result);
  process.exit(result.code);
}

runTbhCliEntry().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unexpected CLI error";
  console.error(message);
  process.exit(1);
});
