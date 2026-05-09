---
name: startup-programs
description: Refresh, verify, and use the public COMPOUND startup program directory. Use when adding or checking programs on compounddd.com/apply, verifying accelerator deadlines, or helping founders choose official application paths.
---

# Startup Programs

Use this skill for the public `compounddd.com/apply/` directory. It is a
curl-installable markdown workflow, not an installer service or runtime.

Public files:

- `https://compounddd.com/skills/startup-programs/SKILL.md`
- `https://compounddd.com/skills/startup-programs/references/schema.md`
- `https://compounddd.com/skills/startup-programs/manifest.json`

## Operating rules

1. Verify official pages first. A program row cannot rely only on a blog post,
   aggregator, social post, or archived page.
2. Never invent deadlines, funding amounts, equity terms, or cohort dates. If
   the official page does not state the detail, write `Not stated on official
   page`.
3. Record closed, unknown, and failed-source states. Do not silently drop a
   program that matters to founders.
4. Use the `agency-press` discipline: source name, source URL, checked date,
   founder relevance, and a clear keep or cut reason.
5. Keep the public row useful in one scan: who it is for, what the founder gets,
   status or deadline, and the official application link.
6. Private CRM or Folk groups can be used only as curation signals for which
   organizations to check. Do not publish private contact names, emails, phone
   numbers, notes, or invite-only links in the public directory.
7. Group rows honestly. Use `apply-now` only for open or rolling accelerator
   cohorts; put grants, infrastructure credits, local Turkey programs,
   conditional rows, and track-later opportunities in their own groups.
8. Keep the workflow static and inspectable. Do not require a service, account,
   Graphyn deep link, hidden agent runtime, or private endpoint to use it.

## Refresh workflow

1. Read `references/schema.md`.
2. Open each program's official source and application URL.
3. Update `projects/compounddd/data/startup-programs.json`.
4. Run `bun run verify:programs` in `projects/compounddd`.
5. Run `bun run verify:skill` in `projects/compounddd` if the public skill
   files or install copy changed.
6. Run `bun run test` in `projects/compounddd` if renderer behavior changed.
7. Record any source that failed to load in the program notes or in a sprint
   receipt.

## Recommendation workflow

When a founder asks what to apply to, filter by:

- stage: idea, pre-seed, seed, experienced founder, student, or scaling
- geography: global, United States, Europe, Turkey, India, Asia Pacific, or
  other active location
- fit: AI, devtools, fintech, climate, hardware, enterprise, consumer, gaming,
  or generalist
- timing: open now, rolling, late, opens soon, or closed
- proof: official, official-sparse, watchlist, or verification flags
- value type: accelerator, residency, fellowship, grant, cloud credits,
  public funding, or investor readiness

Give a short ranked list with official links and one reason each. If the
directory is older than seven days, say it needs a refresh before founders rely
on deadlines.
