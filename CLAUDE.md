# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Interactive prototype for exploring and validating Agorapulse UI redesigns. No build step, no bundler — static files served locally. The language in the codebase mixes English (code) and French (some comments/labels).

## Running the prototype

```bash
npm install   # installs the DS and syncs ds/ via postinstall
npm start     # runs `npx serve -p 8000` — open http://localhost:8000
```

With Claude Code, the dev server auto-launches via `.claude/launch.json`.

## Architecture

**Vanilla JS only** — no build step, no bundler. Hash-based router (`src/router.js`) renders one of 7 routes into `#app` on `hashchange`. Each screen and modal owns its DOM and event delegation.

### Source layout

```
src/
  app.js                — entry: registers routes, inits modals, calls start()
  router.js             — hash router (route() / navigate() / start())
  url-state.js          — parseHashParams() / setHashQuery() helpers
  handoff.js            — single-use sessionStorage bridge across navigations
  user-mode.js          — admin toggle "new" vs "returning" (localStorage key: archie-user-mode)
  utils.js              — html / raw template tag helpers
  file-kinds.js         — kind → DS icon class mapping for source files

  mocks.js              — seed data: contexts, sessions, sources, ideas, posts,
                          connectors, social accounts, generation/notification prefs

  library.js            — per-session ideas store; getSources delegates to sources-stream
  posts-store.js        — per-session drafts store
  sources-stream.js     — global sources + uploads + state machine (uploading
                          → processing → done) shared by every consumer
  assistant.js          — per-session conversational thread (turns + reasoning chips)

  draft-flow.js         — orchestrates "Draft post from idea" turn sequence
  start-flow.js         — context-build wizard kick-off + action picker dispatch
  inline-question.js    — single-question picker overlay inside session assistant panel
  sidebar-wizard.js     — multi-stage analyse-style wizard inside assistant panel

  screens/
    dashboard.js          renderDashboard — route /
    session.js            renderSession — route /session/:id (largest file)
    analyse-hub.js        renderAnalyseHub — route /analyse
    analyse-voice.js      renderAnalyseVoice — route /analyse/voice
    analyse-brief.js      renderAnalyseBrief — route /analyse/brief
    analyse-brand.js      renderAnalyseBrand — route /analyse/brand
    analyse-summary.js    renderAnalyseSummary — route /analyse/summary
    _analyse-common.js    bindWizardKeyboard, renderPicker, advanceContextStage

  components/
    topbar.js               persistent header (Home / Feedback / Bug / ? / Settings)
    settings-drawer.js      right-anchored drawer, 5 tabs
    add-source-modal.js     Upload / URL / Connectors tabs + connector browse
    generate-image-modal.js prompt + style/mood chips, derive vs generate
    bug-report-modal.js     auto-screenshot via html2canvas + form
    feedback-modal.js       feature area select + textarea
    chat-picker-modal.js    pick session for cross-session draft/ask
    content-workspace.js    shared toolbar (search, sort, By Source / All Ideas)
    source-card.js          dashboard + session Content tab
    idea-card.js            same; owns its own Pin/Unpin more menu
    toast.js                showToast() snackbar — DS .ap-snackbar wrapper
    shortcut-legend.js      ? key dialog
    user-mode-chip.js       admin floating chip — toggles new/returning + reload
```

Each component module exports `init()` (injects HTML once into `<body>`) and `open()` / render functions. Screens render directly into `#app` via the router.

### State management

**No external store library.** Four vanilla stores follow the same pattern:

| Module              | Domain                                                      | Public API (top)                                                                                                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `library.js`        | per-session ideas; sources delegate to sources-stream       | `getSources(sid)`, `getIdeas(sid)`, `subscribe(sid, fn)`, `addSource(sid, kind)`                                                                                                                                                                    |
| `sources-stream.js` | global file uploads + URL/connector imports + state machine | `getSources()`, `getUploads()`, `subscribeSources(fn)`, `subscribeUploads(fn)`, `startFileUpload`, `startUrlImport`, `startConnectorImport`, `cancelUpload`, `pushScriptedSource`, `completeScriptedSource`                                         |
| `posts-store.js`    | per-session drafts                                          | `getPosts(sid)`, `addPostDraft(sid, opts)`, `attachImageToDraft(sid, postId, url)`, `subscribe(sid, fn)`                                                                                                                                            |
| `assistant.js`      | per-session conversational thread                           | `getThread(sid, opts)`, `subscribe(sid, fn)`, `sendMessage`, `postAssistantMessage`, `postSourceIntake`, `postExtractionResult`, `startPending`, `finishPending`, `postUserTurn`, `postAssistantChoice`, `submitAssistantChoice`, `postDraftResult` |

Each store keeps a `Map(sessionId → state)` and a `Set<fn>` of subscribers, notified shallowly on every mutation. Module-level state seeds from `mocks.js` on first read (or stays empty in `isNewUser()` mode).

`sources-stream` is the only **global** store. `library.js` subscribes to it and re-emits to per-session subscribers so any session's Content tab repaints when a source lands.

**No localStorage persistence** of app state — only `archie-user-mode` (admin toggle) and the sessionStorage `handoff.*` keys (single-use bridges).

### Routing & screens

`router.js` is a tiny hash router. Routes are declared up-front in `app.js` and the matched handler renders into `#app`. After every render, `setAfterRender` cleans up wizard keyboard listeners if you've left an `/analyse/{voice,brief,brand}` route.

URL state is encoded as hash query params (`#/session/:id?tab=posts&focusIdea=…`). Each screen owns its `readQuery()` defaults; mutations go through `setHashQuery()` from `url-state.js` which calls `navigate()`.

### Cross-screen handoffs

`handoff.js` exposes `setHandoff(key, payload)` / `consumeHandoff(key)` (atomic read + remove) / `hasHandoff(key)`. Used to pass intent across navigations:

| Key                  | Set by                                  | Consumed by                                                           |
| -------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `pendingStartFlow`   | dashboard "New chat" button             | session.js mount → `startContextBuildFlow` or `startActionPickerFlow` |
| `pendingDraftIdeaId` | dashboard idea card "Draft Post" button | session.js mount → `askProfileQuestion`                               |
| `pendingAskSource`   | dashboard source card "Ask" button      | session.js mount → `askWhatToKnow`                                    |

### Module loading

ES modules with `?v=N` cache-busting suffixes (`from "./assistant.js?v=21"`). Bumping the suffix forces browsers to re-fetch. External deps from `esm.sh`. `package.json` exists only for the DS npm packages.

### Admin chip (debug-only)

`src/components/user-mode-chip.js` renders a floating "ADMIN · [first-time | returning] user · refresh" chip in the bottom-right. Click flips the mode in localStorage and reloads the page so every store re-seeds (or stays empty for "new"). Not part of the user-facing UI — kept for fast preview switching during demos.

## Design System — READ FIRST before UI/CSS work

This project is built on the official Agorapulse Design System (`@agorapulse/ui-theme` + `@agorapulse/ui-symbol`). **Do not invent custom components, tokens, or icons when the DS already provides them.** Regressions from ad-hoc CSS overriding DS tokens are the #1 source of bugs in this repo (see `docs/css-audit.md`).

### Required workflow before writing any HTML/CSS

1. **Check if a DS component exists** — call `list_components` on the `ds-css` MCP. If the need matches one of the 37 `.ap-*` components, use it. Call `get_component <name>` for variants/modifiers (`.stroked`, `.primary`, color classes, etc.).
2. **Check for an existing icon** — `search_icons <keyword>` before adding SVG. 290 icons available via `<i class="ap-icon-{name}"></i>`.
3. **Use DS tokens, not hardcoded values** — for any spacing/color/radius/shadow:
   - `search_tokens` + `recommend_token` on the ds-css MCP, OR
   - grep `ds/desktop_variables.css` for `--ref-*` / `--sys-*`.
   - **Never** write `padding: 20px` when `var(--ref-spacing-sm)` exists. Never write `#fff` when `var(--ref-color-white)` exists.
4. **Prefer `--sys-*` over `--ref-*`** when a semantic token exists (text colors, border colors, component states).
5. **Custom CSS only if nothing in the DS fits** — pick the right file:
   - `styles/ds-patches.css` when you need to **extend** a DS class with a missing variant (e.g. `.ap-status.yellow` because the DS only ships orange/red/green/blue/grey) or add a primitive the DS forgot (e.g. `.modal-backdrop`). This file is the only legitimate place to touch `.ap-*` selectors, and it should shrink as the DS evolves.
   - `styles/screens/<screen>.css` for screen-specific styling (dashboard, session, analyse, posts, modals).
   - `styles/components/<component>.css` for shared component styling (settings-drawer, add-source-modal).
   - **Never** redeclare a `.ap-*` class with overrides outside `ds-patches.css` — it defeats the DS and flips the cascade silently.
6. **Validate before committing** — run `validate_css` on the ds-css MCP to catch hardcoded values that should be tokens.

### Anti-patterns to avoid

- Redeclaring `.ap-icon-button`, `.ap-button`, etc. with custom `border`/`background` — use DS modifier classes (`.stroked`, `.transparent`, `.primary`, color variants).
- Adding `padding: 20px` to `.step-card`, `.source-header`, etc. in a view file — these classes are already styled centrally (see `styles/base.css`), and hardcoded overrides flip the cascade silently.
- Using hex colors, fixed pixel radii, or px-based spacings that don't match DS tokens.
- Inventing icons when `search_icons` returns a match.

### DS files (in `ds/`)

```
ds/
  desktop_variables.css  — ~700 design tokens (--ref-*, --sys-*, --comp-*)
  css-ui/font-face.css   — Averta font-face (5 weights)
  css-ui/index.css       — all .ap-* component classes (37 components)
  ap-icons.css           — icon font (290 icons via <i class="ap-icon-*">)
  fonts/averta/          — OTF font files
```

### App styles (in `styles/`)

```
styles/
  tokens.css             — app-specific tokens only (surface aliases, radius, mermaid)
  base.css               — resets, keyframes, app-wide DS token groupings
  layout.css             — app shell, topbar, sidebar, workspace chrome
  ds-patches.css         — patches on top of DS component classes
  chat.css               — composer + thread chrome (shared composer styles)
  admin-chip.css         — admin user-mode floating chip
  screens/               — feature/screen-specific styles
    dashboard.css, session.css, posts.css, analyse.css, modals.css
  components/            — shared component styles
    settings-drawer.css, add-source-modal.css
```

### Token tiers

- `--ref-*` — reference tokens (colors, spacing, fonts, radii) from the DS
- `--sys-*` — semantic tokens (text colors, border colors, component states) — prefer these
- `--comp-*` — component-level tokens (infobox, etc.) — do not use directly in app CSS

### Icons

Use the DS icon font: `<i class="ap-icon-{name}"></i>`. 290 icons available. Size via classes: `.xs`, `.sm`, `.md`, `.lg`. Exception: `sparklesMermaid` uses inline SVG for gradient fill.

### Components

All `.ap-*` components come from the DS (`ds/css-ui/index.css`). Available: button, icon-button, dialog, infobox, badge, status, input, textarea, select, tabs, card, tag, avatar, tooltip, snackbar, etc. Use `get_component` from the ds-css MCP for details.

## Key conventions

- `index.html` is the single entry point — HTML markup only (~35 lines, mounts `#topbar` + `#app` + `#toastRegion`). All UI is rendered by JS.
- Mock data lives in `src/mocks.js` (single seed source for sessions, sources, ideas, posts, contexts, connectors, social accounts, prefs).
- Import paths use `?v=N` suffixes — keep them consistent when editing imports (bump the version when the consumer needs a fresh fetch).
- Event wiring is **pure event delegation** with `data-*` attributes on the screen/modal root. No inline `onclick`, no per-element `addEventListener` for interactive children.

## Audit & flow docs

- `FLOW-AUDIT.md` (root) — exhaustive flow audit (44 surfaces, 189 elements, 38 flows, findings + Mermaid diagrams).
- `audit-assets/` — Mermaid sources + SVG renders, drag-droppable into the Figma cartography (node `223-2046` of the Archie file).
- `FLOW-CHANGELOG.md` (root, post-fix) — table commit ↔ FIND-XXX with Done / Skipped / Deferred status.

## MCP

The `ds-css` MCP server provides design system tools: `validate_css`, `recommend_token`, `search_tokens`, `get_component`, `list_components`, `search_icons`, `get_text_style`, `get_layout_pattern`.

The `plugin_figma_figma` MCP (when enabled) provides `use_figma`, `generate_diagram`, `get_design_context`, `get_screenshot`, etc., for design ↔ code workflows.
