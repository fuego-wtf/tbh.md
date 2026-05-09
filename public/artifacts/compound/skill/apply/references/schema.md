# Startup program directory schema

The public directory lives at:

`projects/compounddd/data/startup-programs.json`

## Top-level fields

- `version`: number. Current value is `1`.
- `lastVerified`: `YYYY-MM-DD`, the latest official-source verification date
  for the directory.
- `programs`: array of program records.

## Program fields

Required fields:

- `id`: lowercase slug, unique.
- `name`: public program name.
- `organizer`: company, fund, university, or ecosystem operator.
- `programType`: accelerator, fellowship, residency, grant, cloud credits,
  incubator, public funding, or another plain-English type.
- `qualityTier`: `elite`, `strong`, `grant`, `infrastructure`, `local`, or
  `watchlist`.
- `displayGroup`: one of `apply-now`, `conditional`, `grant`,
  `infrastructure`, `local`, or `track`. This controls first-scan grouping on
  `/apply/` and must not overstate a row's immediacy.
- `stage`: array of founder stages.
- `region`: array of regions the row is useful for.
- `location`: city, country, or remote/global description.
- `format`: in-person, remote, hybrid, rolling online benefits, or
  program-specific format.
- `sectors`: array of sectors or `Generalist`.
- `fitTags`: array of filter tokens such as `AI`, `non-dilutive`, `elite`,
  `turkey`, `developer-tools`, or `watchlist`.
- `funding`: investment, grant, credits, or `Not stated on official page`.
- `equityCost`: equity, cost, or `Not stated on official page`.
- `cloudCredits`: optional cloud/compute credit summary.
- `perksValue`: optional short summary of non-cash founder value.
- `deadline`: object with `status`, `label`, and optional `date`.
- `duration`: cohort duration or `Not stated on official page`.
- `applicationUrl`: official application URL.
- `sourceUrl`: official source URL used for verification.
- `secondarySourceUrl`: optional official source for terms or announcement
  detail.
- `lastVerified`: `YYYY-MM-DD`.
- `sourceQuality`: source description, for example `official program page` or
  `official but public terms are sparse`.
- `statusConfidence`: `high`, `medium`, or `low`.
- `founderEligibility`: founder-facing eligibility summary.
- `companyEligibility`: company-facing eligibility summary.
- `geoEligibility`: geography summary.
- `applicationEffort`: founder-facing application effort note.
- `whyApply`: one founder-facing sentence.
- `redFlags`: array of short verification flags. Empty array is allowed.
- `notes`: short factual note for nuance.

Allowed `deadline.status` values:

- `open`
- `closes-soon`
- `late`
- `rolling`
- `opens-soon`
- `varies`
- `watchlist`
- `closed`
- `unknown`

Use `deadline.date` only when the official page states an exact date. Use
`YYYY-MM-DD`.

## Source rules

- Prefer the program's own application or official program page.
- If the application form is on a partner domain, keep both the form URL and the
  official source URL.
- Do not scrape private application answers into the public data file.
- Do not publish private access codes or invite-only links.
- Keep cloud-credit, grant, open-source, and VC platform rows clearly labeled
  so founders do not confuse them with cohort accelerators.
- Keep `apply-now` reserved for currently open or rolling accelerator-style
  cohorts with no blocking eligibility flags. Put credits in `infrastructure`,
  public funding in `grant`, Turkey/Istanbul ecosystem rows in `local`, and
  closed or uncertain elite opportunities in `track`.
- If a source is useful but not currently open, use `watchlist` and explain why
  the founder should track it.

## Public skill artifacts

The public skill is served as static files:

- `/skills/startup-programs/SKILL.md`
- `/skills/startup-programs/references/schema.md`
- `/skills/startup-programs/manifest.json`

The manifest must include SHA-256 hashes for the raw markdown files. Do not add
an install API, account gate, Graphyn deep link, CRM sync, or hidden runtime.
The expected install shape is two `curl -fsSL` requests into `.skills/`.
