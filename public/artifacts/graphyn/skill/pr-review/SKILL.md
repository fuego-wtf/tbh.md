# PR Review Skill

> **Provider:** graphyn
> **Type:** skill
> **Version:** 1.1.0

Summarize diffs and produce actionable review notes for pull requests.

## Overview

Provides a focused skill that ingests a git diff and emits a concise,
structured review summary. Designed to be composed into broader agent
workflows or used standalone via `tbh skill pr-review`.

## Usage

```
tbh skill pr-review --diff <file-or-url>
tbh skill pr-review --pr <repo>/<owner>#<number>
```

## Parameters

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `--diff`  | string | one of*  | Path or URL to a unified diff file |
| `--pr`    | string | one of*  | GitHub PR reference                |
| `--focus` | string | no       | Restrict review to specific rules  |

*At least one of `--diff` or `--pr` is required.

## Review Categories

1. **Correctness** — Logic errors, edge cases, null safety.
2. **Security** — Injection vectors, secret exposure, permission gaps.
3. **Performance** — Unnecessary allocations, N+1 patterns, blocking calls.
4. **Style** — Naming, consistency with project conventions.

## Output

Emits a markdown report with per-file sections and severity-tagged
findings. Exit code `0` when no FAIL findings, `1` otherwise.

## Changelog

### 1.1.0
- Added `--focus` parameter for targeted rule filtering.
- GitHub PR lookup via API (no local clone needed).

### 1.0.5
- Initial release.
