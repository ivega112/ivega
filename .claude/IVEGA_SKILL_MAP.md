# iVEGA Skill Map

The task's skill-orchestration protocol (section 0) names specific skill identifiers
(`project-memory`, `token-efficiency`, `extract-design-system`, `web-design-director`,
`tailwind-v4-shadcn`, `web-design-guidelines`, `responsive-design`, `accessibility`,
`framer-motion-animator`, `find-me`, `find-skills`). **None of these exist in this Claude
Code environment's installed skill list.** The environment's actual available skills (see
system reminder) are a different, fixed set (`project-tech-detector`, `setup-web-project`,
`dataviz`, `simplify`, `security-review`, document-format skills, etc.) with no exact or
close equivalent for design-system extraction, Tailwind/shadcn scaffolding, responsive
verification, or accessibility auditing as standalone invocable skills.

Per the protocol's own fallback rule ("if a required capability is genuinely missing,
proceed without it and record the gap"), work was performed directly by the main agent
and one delegated general-purpose research agent, instead of via the named skills.

| Required capability | Requested skill | Available equivalent | Resolution |
|---|---|---|---|
| Persistent cross-session project memory | `project-memory` | none | `.claude/PROJECT_MEMORY.md` maintained manually |
| Context/token discipline | `token-efficiency` | none (default agent behavior) | Design extraction delegated to a background agent to keep 18 `.dc.html` files out of the main context; large docs summarized rather than re-pasted |
| Design token/pattern extraction from `.dc.html` | `extract-design-system` | none | Performed via a `general-purpose` background agent that read all remaining design files and produced `DESIGN_SOURCE_MAP.md` + `DESIGN_SYSTEM.md` |
| Component-architecture coordination | `web-design-director` | none | Handled directly by the main agent when structuring `src/components/storefront` |
| Tailwind v4 + shadcn/Radix setup | `tailwind-v4-shadcn` | none | Tailwind v4 `@theme` tokens and Radix primitives wired manually in `src/app/globals.css` and `package.json` |
| Responsive verification pass | `responsive-design` | none | Not run as a dedicated audit pass — see `VERIFICATION_REPORT.md` for what was and wasn't verified |
| Accessibility audit | `accessibility` | none | Baseline semantics (labels, alt text, button names) applied inline; no dedicated audit pass — see `VERIFICATION_REPORT.md` |
| Motion | `framer-motion-animator` | none | Not needed — all motion implemented with CSS transitions/keyframes per the design system's own "prefer CSS transitions" guidance |
| Skill discovery | `find-me` / `find-skills` | none | N/A — no skill registry lookup tool exists in this environment |

No skills were excluded for overlap reasons — none of the named skills were available to
begin with, so there was no overlap to resolve.

## Update (2026-08-02, admin completion pass)
A follow-up prompt again asked for the "responsive-design" and "accessibility" skills "or
closest installed equivalent" for their respective phases. Re-checked the available skill
list — still no equivalent exists. Both phases were done directly: responsive via manual
browser DOM/overflow inspection (`resize_window` + `javascript_tool`, see
`VERIFICATION_REPORT.md`), accessibility via manual, evidence-based fixes (found two real
un-associated form labels via e2e failures, added skip links/focus rings/dialog
roles/`aria-current`/alert-live-regions). Neither substitutes for the systematic audit a
real skill or tool (e.g. axe) would provide — flagged honestly as not done in
`VERIFICATION_REPORT.md` and `IMPLEMENTATION_PLAN.md`.
