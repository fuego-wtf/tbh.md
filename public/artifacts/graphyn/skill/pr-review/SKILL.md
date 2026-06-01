# PR Review Skill

> **Provider:** graphyn
> **Type:** skill
> **Version:** 1.1.0

Summarize diffs and produce actionable review notes for pull requests.

## Purpose

Use this skill when an agent needs to review a pull request, patch set, or
local diff and return concise findings grounded in exact files and lines.

## Workflow

1. Read the requested diff and the surrounding implementation context.
2. Prioritize correctness, security, data loss, performance, and missing tests.
3. Report findings first, ordered by severity.
4. Reference each finding with the smallest useful file and line pointer.
5. Keep summaries secondary to actionable review notes.

## Output

Return a review packet with:

- `status`: `PASS`, `WARN`, or `FAIL`.
- `findings`: review notes with severity, file, line, and rationale.
- `test_gaps`: verification that is missing or still needed.
- `residual_risk`: any remaining uncertainty after inspection.

## Guardrails

- Do not rewrite the patch while reviewing it.
- Do not claim runtime behavior without command or source evidence.
- Do not bury critical findings behind a long summary.

## Changelog

### 1.1.0
- Added explicit evidence and output-shape guidance.
- Tightened finding-first review ordering.

### 1.0.5
- Initial public tbh.md skill listing.
