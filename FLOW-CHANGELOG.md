# Archie — Flow Audit Changelog

Phase-2 fixes applied on `chore/flow-audit`. One commit per finding (Medium) or per category (Safe). All fixes verified in the running prototype via the preview MCP. See `FLOW-AUDIT.md` for the full audit.

## Phase 1 — audit deliverable (no code changes)

| Commit    | Scope                                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `ac362d4` | `chore(flow-audit): phase 1 — exhaustive flow audit + Mermaid sources` — `FLOW-AUDIT.md` (1197 lines) + `audit-assets/*.mmd` |
| `184ff67` | `chore(flow-audit): SVG renders of Mermaid diagrams (Figma fallback)` — `audit-assets/*.svg`                                 |

## Phase 2.1 — Safe batch (autonomous)

| Commit    | Findings                                                                                       | Files                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `d9850f3` | **FIND-04**, **FIND-05** — remove source-card `⋯` no-op + orphan `pendingDraftAccountId` write | `src/components/source-card.js`, `src/screens/session.js`, `src/screens/dashboard.js` |
| `74802a4` | **FIND-03** — replace `window.alert()` with `showToast.error()` in analyse-hub                 | `src/screens/analyse-hub.js`                                                          |
| `bb18ba8` | **FIND-15** — clear `focusPost` (and `focusSource`) on session tab switch                      | `src/screens/session.js`                                                              |
| `9f0f1e0` | **FIND-25**, **FIND-26** — refresh `CLAUDE.md` (real layout, vanilla stores, admin chip)       | `CLAUDE.md`                                                                           |

## Phase 2.2 — Figma cartography push

Pushed via `mcp__plugin_figma_figma__use_figma` to node `223-2046` of the Archie file (`ulQHaMfPhTQwNLib6IDOez`). Two `use_figma` calls:

1. Wrapper frame "Archie — Flow audit (2026-04-27)" with header, metrics (44 surfaces, 189 elements, 41 auto-triggers, 38 flows, 28 findings), legend, and tier-ranked findings list.
2. Sub-section with 6 flow diagrams (global navigation, Add source, Draft post, Analyse pipeline, Stores fan-out, Connector desync).

Final wrapper height ~6172 px on the Flows page. Source Mermaid + SVG renders kept in `audit-assets/` for regeneration.

## Phase 2.3 — Medium batch (one commit per finding)

| Commit    | Finding     | Summary                                                                                                                                                                                                                                           |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `7685bdc` | **FIND-09** | Voice intake "Not yet — skip for now" → "Skip voice analysis" (label matches the actual exit-the-wizard handler)                                                                                                                                  |
| `fedf120` | **FIND-08** | Remove misleading "Needs work — regenerate" option from voice + brief wizards (both branches advanced identically); custom input placeholder updated to invite section comments                                                                   |
| `015dca5` | **FIND-10** | Brand wizard: persist user-entered URL in `?brandUrl=` so "Start over" / "No — try another URL" re-edit instead of resetting to the seed mock                                                                                                     |
| `3a24027` | **FIND-11** | Detach context: instant + Undo toast (mirrors Pin/Unpin pattern) instead of an instant action with no safety net                                                                                                                                  |
| `1ebd8c0` | **FIND-07** | Inline form validation on bug + feedback modals: error text under required fields, `*` indicator on Feedback, on-blur revalidation after first submit                                                                                             |
| `6da3751` | **FIND-06** | Post card footer Like/Comment/Repost/Send: convert from `<button>` to non-interactive `<span>` (with `aria-hidden`); remove unwired Edit pen from row-actions toolbar                                                                             |
| `c7f9045` | **FIND-23** | New `src/modal-coordinator.js` enforces single-overlay; every modal + the settings drawer + shortcut legend register / unregister via `requestOpen` / `notifyClose`                                                                               |
| `429631d` | **FIND-02** | Toast feedback on connector + social toggles in settings (instant-save model documented in code)                                                                                                                                                  |
| `d244dd5` | **FIND-01** | Extract `src/connectors-store.js` with `getConnectors` / `findConnector` / `setConnectorStatus` / `subscribe`. Settings drawer + add-source modal both go through the store; the modal subscribes on open so toggles from the drawer repaint live |

## Phase 2.4 — wrap-up

| Commit        | Scope                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------- |
| _this commit_ | Update `FLOW-AUDIT.md` with post-fix statuses · create `FLOW-CHANGELOG.md` · final Figma re-render |

## Findings status summary

| Tier             | Total | Done | Skipped / Deferred | Notes                                                                                                                                               |
| ---------------- | ----- | ---- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Medium           | 2     | 2    | 0                  | FIND-01, FIND-23                                                                                                                                    |
| Safe             | 6     | 6    | 0                  | FIND-03, FIND-04, FIND-05, FIND-15, FIND-25, FIND-26                                                                                                |
| Low (UX-quality) | 20    | 7    | 13 deferred        | Done: FIND-02, FIND-06, FIND-07, FIND-08, FIND-09, FIND-10, FIND-11. Deferred: FIND-12 to FIND-22, FIND-27, FIND-28 (tracked for a follow-up audit) |

**Total fixes applied: 15 / 28 findings.**

The 13 deferred findings are all Low-risk UX-quality items (timer leak guard, dossier placeholder, idea-card click target, draft mini-card link, processing ETA, screenshot CDN warning, search debounce, channel-picker silent skip, wizard skip analytics, feedback persistence, derive-vs-generate mock, brand URL validation, post-card row toolbar). Follow-up audit recommended.

## Verification

Each commit verified manually via the dev server (`npm start`) using the preview MCP:

- `preview_eval` to confirm DOM state and store behavior (e.g., 0 `[data-source-more]` after FIND-04, 0 `window.alert` calls + visible toast after FIND-03)
- `preview_console_logs` after each reload — no errors introduced
- For FIND-01: imported `connectors-store.js` directly and confirmed `setConnectorStatus` mutates + notifies

No automated tests in this repo (none added in this ticket — out of scope per audit plan).
