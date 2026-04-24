# Archie UX Audit — Feature Inventory

Source of truth: `index.html`, `src/app.js`, `src/router.js`, `src/screens/*`, `src/components/*`, `src/library.js`, `src/assistant.js`, `src/user-mode.js`, `src/mocks.js`.

## Product Architecture Summary

Archie is currently a static, hash-routed interactive prototype for a session-based AI content workspace. The app helps a user create content projects, attach or create reusable context bundles, ingest sources, extract publishable ideas, chat with an assistant, review generated posts, and mock-generate post imagery.

Evidence:

- Static shell and DS imports in `index.html`.
- Hash routes declared in `src/app.js`: dashboard, session, context-analysis hub, voice wizard, brief wizard, brand wizard, summary.
- Route/query state in `src/router.js`, `src/screens/dashboard.js`, `src/screens/session.js`, and `src/screens/_analyse-common.js`.
- Mock-only product data in `src/mocks.js`.
- Session assistant state in `src/assistant.js`; library/source extraction state in `src/library.js`.
- First-time vs returning-user prototype mode in `src/user-mode.js` and `src/components/user-mode-chip.js`.

## Core Navigation

| Feature                               | Purpose                                                                         | Where found in code                                    | Maturity      |
| ------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------- |
| Hash router                           | Maps URL hash paths to screens and strips query params before matching.         | `src/router.js`, `src/app.js`                          | complete      |
| Persistent topbar                     | Brand/home navigation, feedback modal, bug report modal, visible settings icon. | `src/components/topbar.js`                             | partial       |
| Settings icon                         | Indicates a settings affordance in topbar.                                      | `src/components/topbar.js`                             | hidden/broken |
| Dashboard tabs                        | Switch between Projects and Global contexts via query params.                   | `src/screens/dashboard.js`                             | complete      |
| Session workspace tabs                | Switch Posts, Content, and Context tabs.                                        | `src/screens/session.js`                               | complete      |
| First-time/returning prototype toggle | Lets prototype preview empty and populated states.                              | `src/user-mode.js`, `src/components/user-mode-chip.js` | hidden        |
| Not-found fallback                    | Redirects unknown hash paths back home; only root missing state shows text.     | `src/router.js`                                        | partial       |

## Project And Session Management

| Feature                           | Purpose                                                                                   | Where found in code                                  | Maturity      |
| --------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------- |
| New project form                  | User enters project name and chooses context option.                                      | `src/screens/dashboard.js`                           | partial       |
| Context selector on new project   | Offers no context, voice, brief, or brand. Updates URL `ctx`, but creation ignores value. | `src/screens/dashboard.js`                           | partial       |
| Create project CTA                | Navigates every new project to `#/session/new`.                                           | `src/screens/dashboard.js`                           | partial       |
| Template starters                 | Displays starter options for thought leadership, launch, podcast repurposing.             | `src/screens/dashboard.js`, `src/mocks.js`           | broken        |
| Recent sessions                   | Shows seeded sessions with context/source/idea/post counts.                               | `src/screens/dashboard.js`, `src/mocks.js`           | complete      |
| Open existing session             | Opens `#/session/:id`.                                                                    | `src/screens/dashboard.js`, `src/screens/session.js` | complete      |
| Session composer session dropdown | Shows session name with chevron.                                                          | `src/screens/session.js`                             | hidden/broken |

## Content Library And Ideas

| Feature                     | Purpose                                                                                  | Where found in code                                                                        | Maturity         |
| --------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------- |
| Dashboard content section   | Shows sources or ideas under Projects.                                                   | `src/screens/dashboard.js`, `src/components/source-card.js`, `src/components/idea-card.js` | complete         |
| Dashboard Add source button | Visible CTA in content header.                                                           | `src/screens/dashboard.js`                                                                 | broken           |
| Session Content tab         | Unified source and ideas workspace with search/sort/view switch.                         | `src/screens/session.js`                                                                   | complete         |
| By source view              | Lists source cards with processing state, ask, view all ideas, more.                     | `src/screens/session.js`, `src/components/source-card.js`                                  | complete         |
| All ideas view              | Lists idea cards sorted by potential/newest/source/state.                                | `src/screens/session.js`, `src/components/idea-card.js`                                    | complete         |
| Content search              | Filters sources and ideas by filename, kind, title, body, rationale.                     | `src/screens/session.js`                                                                   | complete         |
| Idea sort                   | Sorts ideas by potential, newest, source, or workflow state.                             | `src/screens/session.js`                                                                   | complete         |
| Source intake               | Add PDF/video/URL from assistant attach menu, creates processing source and later ideas. | `src/screens/session.js`, `src/library.js`                                                 | complete as mock |
| Source processing state     | Shows spinner, disabled ask/processing CTA, then processed state.                        | `src/components/source-card.js`, `src/library.js`                                          | complete as mock |
| Extraction result in chat   | Posts source intake, pending extraction, extracted idea cards, feedback thumbs.          | `src/assistant.js`, `src/screens/session.js`, `src/library.js`                             | complete as mock |
| Ask about source            | Primes assistant composer with source-specific question.                                 | `src/screens/session.js`                                                                   | complete         |
| Source overflow menu        | More button exists but does nothing.                                                     | `src/screens/session.js`, `src/components/source-card.js`                                  | broken           |
| Idea open/focus             | Dashboard opens session ideas view; session pulses existing card.                        | `src/screens/dashboard.js`, `src/screens/session.js`, `src/components/idea-card.js`        | partial          |
| Idea pin/unpin              | Toggles menu label/pressed state visually only.                                          | `src/components/idea-card.js`                                                              | partial          |
| Create post from idea       | CTA exists but no behavior.                                                              | `src/screens/session.js`, `src/screens/dashboard.js`, `src/components/idea-card.js`        | broken           |
| Idea feedback thumbs        | Extraction card thumbs toggle helpful/not helpful locally.                               | `src/screens/session.js`                                                                   | partial          |

## Assistant And AI Actions

| Feature                    | Purpose                                                                                   | Where found in code                          | Maturity         |
| -------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------- |
| Session assistant greeting | Seeds contextual or non-contextual assistant intro per session.                           | `src/assistant.js`, `src/screens/session.js` | complete         |
| Suggested prompts          | Displays prompt buttons based on whether context is attached.                             | `src/assistant.js`, `src/screens/session.js` | complete         |
| User message send          | Sends user prompt via button or Enter.                                                    | `src/screens/session.js`, `src/assistant.js` | complete         |
| Mock AI reply              | Returns scripted replies for draft/generate, compare, strongest signal, source, fallback. | `src/assistant.js`                           | complete as mock |
| Drafting/reasoning notice  | Shows loading system notice, then collapses reasoning above assistant answer.             | `src/assistant.js`, `src/screens/session.js` | complete         |
| Thinking credit chip       | Displays elapsed time and mock credits while any assistant/source work is loading.        | `src/screens/session.js`                     | complete         |
| Attach source menu         | Opens PDF/video/URL add-source menu from composer plus button.                            | `src/screens/session.js`                     | complete         |

## Posts

| Feature                                        | Purpose                                                         | Where found in code                                                | Maturity         |
| ---------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------- |
| Empty posts state                              | Shows no-posts message for new/non-real sessions.               | `src/screens/session.js`                                           | complete         |
| Populated posts feed                           | Shows seeded social-style post cards for real sessions.         | `src/screens/session.js`, `src/mocks.js`                           | complete         |
| Post status filters                            | Filter all, needs fixes, scheduled.                             | `src/screens/session.js`, `src/mocks.js`                           | complete         |
| Network filters                                | Filter all, LinkedIn, X. X exists but mock data has no X posts. | `src/screens/session.js`, `src/mocks.js`                           | partial          |
| Clear post filters                             | Resets status/network filters.                                  | `src/screens/session.js`                                           | complete         |
| Post selection checkboxes                      | Per-row checkbox visible.                                       | `src/screens/session.js`                                           | hidden/partial   |
| Like/comment/repost/send actions               | Rendered as social actions on post cards.                       | `src/screens/session.js`                                           | hidden/broken    |
| Edit/rewrite/schedule/duplicate/delete actions | Rendered icon rail only.                                        | `src/screens/session.js`                                           | broken           |
| Post with unfinished copy                      | One seeded post includes `[TODO — finish...]`.                  | `src/mocks.js`                                                     | partial          |
| Generate image for post                        | Opens image-generation modal from image placeholder.            | `src/screens/session.js`, `src/components/generate-image-modal.js` | complete as mock |

## Context System

| Feature                       | Purpose                                                                                      | Where found in code                                      | Maturity         |
| ----------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------- |
| Global contexts tab           | Lists available reusable contexts and context-create CTA.                                    | `src/screens/dashboard.js`, `src/mocks.js`               | complete         |
| Create context hub            | Names context and chooses Voice, Brief, Brand components.                                    | `src/screens/analyse-hub.js`                             | complete         |
| Edit context entry            | Opens analyse hub with `contextId`, prefilled as raw id.                                     | `src/screens/dashboard.js`, `src/screens/analyse-hub.js` | partial          |
| Analyse stage sequencing      | Carries selected stages through `?stages=` and advances stage to stage.                      | `src/screens/_analyse-common.js`                         | complete         |
| Voice wizard                  | Conversational voice-analysis wizard with intake, source choice, 7 review sections, summary. | `src/screens/analyse-voice.js`, `src/mocks.js`           | complete as mock |
| Brief wizard                  | Conversational strategy brief wizard with 3 sections and summary.                            | `src/screens/analyse-brief.js`, `src/mocks.js`           | complete as mock |
| Brand wizard                  | URL intake, theme preview, apply/summary.                                                    | `src/screens/analyse-brand.js`, `src/mocks.js`           | complete as mock |
| Wizard keyboard controls      | Arrow/digit/Enter/Escape controls for wizard picker rows.                                    | `src/screens/_analyse-common.js`                         | complete         |
| Wizard custom answer input    | Allows typed “something else”; most branches still advance canonically.                      | `src/screens/_analyse-common.js`, stage screens          | partial          |
| Context summary               | Shows built components and routes home or to seeded populated session.                       | `src/screens/analyse-summary.js`                         | partial          |
| Session Context tab           | Shows attached context accordions or no-context CTA.                                         | `src/screens/session.js`                                 | complete         |
| Attach existing context       | Sets `populated=1` rather than choosing a real context.                                      | `src/screens/session.js`                                 | partial          |
| Detach context                | Clears `populated`, but real seeded session keeps `contextId`.                               | `src/screens/session.js`                                 | broken           |
| Add missing context component | Navigates to relevant analyse stage.                                                         | `src/screens/session.js`                                 | partial          |

## Feedback, Bug Reporting, And Prototype Utilities

| Feature                      | Purpose                                                                                                   | Where found in code                                                | Maturity         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------- |
| Feedback modal               | Feature-area select, required feedback text, mock send and success.                                       | `src/components/feedback-modal.js`, `src/components/topbar.js`     | complete as mock |
| Bug report modal             | Category, attempted action, required problem, screenshot auto-capture/upload, context pills, mock submit. | `src/components/bug-report-modal.js`, `src/components/topbar.js`   | complete as mock |
| Screenshot auto-capture      | Loads html2canvas from CDN at modal open.                                                                 | `src/components/bug-report-modal.js`                               | partial          |
| Generate image modal         | Prompt derivation, style/mood chips, loading skeleton, result, regenerate/edit/use.                       | `src/components/generate-image-modal.js`                           | complete as mock |
| Use generated image callback | API supports callback, but current caller does not pass one.                                              | `src/components/generate-image-modal.js`, `src/screens/session.js` | hidden           |

## Documentation / Implementation Drift

| Feature                 | Purpose                                                                                                   | Where found in code                   | Maturity  |
| ----------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------- |
| Old tab naming          | README still lists `tab=library` and `tab=ideas`; code maps them to `tab=content`.                        | `README.md`, `src/screens/session.js` | duplicate |
| Store architecture note | Provided AGENTS/CLAUDE guidance mentions Zustand `store.js`; current repo has module-local state instead. | `CLAUDE.md`, actual `src/*`           | duplicate |
| Old source layout note  | Guidance mentions `views/` and `modals/`; current repo uses `screens/` and `components/`.                 | `AGENTS.md`, actual `src/*`           | duplicate |
