# Code Review Mode

> **Provider:** graphyn
> **Type:** mode
> **Version:** 1.1.0

Structured PR review workflow mode for Graphyn agents.

## Overview

Activates a multi-pass code review workflow that analyzes pull requests
for correctness, security, performance, and style consistency. Produces
actionable review notes with severity classifications.

## Activation

This mode activates automatically when an agent receives a PR review
request or can be triggered via `tbh mode code-review`.

## Behavior

1. **Diff ingestion** — Parse the PR diff into logical hunks grouped by file.
2. **Static checks** — Flag common anti-patterns, missing error handling, and security-sensitive calls.
3. **Semantic review** — Assess whether changes match their stated intent and existing codebase conventions.
4. **Summary** — Produce a structured review with `PASS`, `WARN`, or `FAIL` per hunk.

## Output Schema

Each review note follows this shape (forward-compatible):

```json
{
  "severity": "warn",
  "file": "src/auth.ts",
  "line": 42,
  "rule": "no-hardcoded-secrets",
  "message": "Potential secret literal detected.",
  "suggestion": "Use environment variable or secret manager."
}
```

## Compatibility

| Runtime | Tested |
|---------|--------|
| Letta   | yes    |
| Claude  | yes    |
| Codex   | yes    |

## Changelog

### 1.1.0
- Added semantic intent-checking pass.
- Improved diff grouping for monorepo layouts.

### 1.0.2
- Initial release.
