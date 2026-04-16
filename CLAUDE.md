# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Interactive prototype for exploring and validating Agorapulse UI redesigns. No build step, no bundler — static files served locally. The language in the codebase mixes English (code) and French (some comments/labels).

## Running the prototype

```bash
npx serve -l 3000 .
# Then open http://localhost:3000
```

With Claude Code, the dev server auto-launches via `.claude/launch.json`.

## Architecture

**Vanilla JS only** — `index.html` + `src/app.js` + `src/store.js`. `index.html` is ~380 lines of HTML. `app.js` renders views by mutating the DOM directly. State lives in a Zustand vanilla store (`store.js`) with `store.subscribe(renderApp)` driving re-renders.

### State management

- Single Zustand vanilla store in `src/store.js`, created via `createStore` from `https://esm.sh/zustand@5/vanilla`
- State is persisted to `localStorage` under key `bigbet-library-prototype-v2`
- Selectors exported as standalone functions: `getActiveSession`, `getSessionUi`, `getIdeaById`, `countIdeas`, `countPinnedIdeas`, `sortSessions`
- All mutations go through `store.getState().actionName()` — actions are defined inline in the store creator

### View routing

`app.js` uses a tab-based model (`currentTab` in state). The `renderApp()` function dispatches to view renderers: `renderLibraryView`, `renderPostsView`, `renderStrategyBriefView`, `renderStepPlaceholder`, etc. Event delegation on container elements routes clicks via `data-*` attributes.

### Module loading

All JS imports use ES modules with `?v=N` cache-busting suffixes. External deps load from `esm.sh`. `package.json` exists only for the DS npm packages.

## Design System

Uses the official Agorapulse Design System CSS (`@agorapulse/ui-theme` + `@agorapulse/ui-symbol`).

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
  base.css               — resets, keyframes, @media queries
  layout.css             — app shell, topbar, sidebar, workspace chrome
  app-components.css     — custom components with no DS equivalent (ai-notice, search, toolbar, etc.)
  views/                 — feature/page-specific styles
    session.css, assistant.css, library.css, sources.css, ideas.css,
    brief.css, posts.css, previews.css, drawer.css, modals.css
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

- `index.html` is the single entry point — HTML markup only (~380 lines). CSS is in `styles/` and `ds/`.
- Mock data is generated in `src/mock-generators.js` (deterministic via seed hashing) and seed data is defined in `src/store.js`.
- Import paths use `?v=N` suffixes — keep them consistent when editing imports.

## MCP

The `ds-css` MCP server provides design system tools: `validate_css`, `recommend_token`, `search_tokens`, `get_component`, `list_components`, `search_icons`, `get_text_style`, `get_layout_pattern`.

## Hooks

A post-tool-call hook (`.claude/hooks/post-tool-call.py`) sends file diffs to a local provenance-tracking webserver after Write/Edit operations. It may emit errors if the provenance server isn't running — these are safe to ignore.
