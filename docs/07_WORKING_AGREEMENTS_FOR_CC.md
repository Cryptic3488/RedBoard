# Working Agreements for Claude Code (CC)

## Guardrails

- No scope creep: new features go to BACKLOG.md (do not implement by default).
- Security-first: RLS + permissions before UI polish.
- Keep changes small: one feature per branch/PR when possible.
- No large refactors unless required to ship a feature safely.

## Branching

- Feature branches: feature/<id>-short-name
- Fix branches: fix/<area>-short-name
- Always open PR with summary + checklist.

## Definition of Done (DoD)

A feature is “done” only if:

- [ ] RLS policies exist and match the intended permissions
- [ ] UI meets mobile baseline (no broken layouts)
- [ ] Errors are handled (no silent failures)
- [ ] Minimal tests exist for key logic (especially access control)
- [ ] Docs updated if behavior changed

## Testing expectations

- Add RLS tests or verification notes for any new table/policy.
- Add at least one happy-path test for critical flows when practical.

## Backlog discipline

If asked to add features beyond the spec:

- Write it in BACKLOG.md with:
  - description
  - value
  - complexity estimate (S/M/L)
  - dependencies
    Then stop.
