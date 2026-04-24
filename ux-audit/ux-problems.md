# Archie UX Audit — Priority UX Map And Critical Problems

## Priority UX Map

### Core MVP

- Create/open a project session.
- Add sources from assistant.
- Show processing/extraction state.
- Review extracted ideas in Content.
- Chat with Archie about sources and ideas.
- Create a post from an idea.
- Review generated posts.
- Create or attach a reusable context.
- Complete Voice, Brief, and Brand context wizards.

### Secondary

- Global contexts dashboard.
- Content search and sort.
- Posts status/network filters.
- Generate image for a post.
- Feedback and bug reporting.
- Prototype first-time/returning-user switch.

### Broken / Needs Redesign

- New project title and context selection are discarded.
- Template starters are visible but not wired.
- Dashboard Add source is visible but not wired.
- Create post from idea is a core CTA but not wired.
- Post edit/rewrite/schedule/duplicate/delete actions are visible but not wired.
- Settings icon is visible but not wired.
- Source overflow menus are visible but not wired.
- Detach context does not detach a real seeded session with `contextId`.
- Image “Use this image” closes without applying image.
- Edit context mode pre-fills raw id and does not load existing context details.

### Hidden Opportunities

- A real “idea dossier” or idea detail drawer is implied by focus/open logic.
- A real session switcher is implied by the composer session dropdown.
- Real template starter flows could prefill project name, context, source expectations, and first prompt.
- Extraction idea thumbs could become model feedback.
- Post row selection could become bulk scheduling or approval.
- Context components can be created independently and later attached.
- Bug report auto-context is a strong internal beta feedback loop.

## Critical UX Problems

### 1. Core Value Path Stops At The Most Important CTA

“Create post from this idea” is the natural MVP conversion moment, but both dashboard/session handlers prevent default and do nothing. This breaks the product promise: source → idea → post.

Recommendation: define one primary generation path:

```
Idea Card → Generate Post Draft → Posts Tab Draft Created → Assistant Explains Draft
```

### 2. Project Creation Is Mostly Navigation

The New project form asks for name and context, then always navigates to `#/session/new`. The user loses title and chosen context.

Recommendation: even in prototype mode, carry title/context through query params or session-local mock state so the next screen reflects the user’s input.

### 3. Context Creation Feels Complete But Does Not Save

The Voice/Brief/Brand wizard is polished, but completion opens the seeded Acme session with `populated=1`. This can feel like the app ignored the new context.

Recommendation: model a created context object in memory and show the exact user-entered context name in the session.

### 4. Several High-Salience Controls Are Dead Ends

Dead-end controls include template starters, dashboard Add source, source More, settings, post action rail, social actions, and create post from idea.

Recommendation: hide non-core dead actions or make them visibly disabled with explanatory tooltip/copy in prototype builds. Keep the surface smaller and sharper.

### 5. Duplicate / Drifting IA

README and older guidance refer to Library and Ideas as separate session tabs. The implementation maps old `tab=library|ideas` into a merged `tab=content` with `view=sources|ideas`.

Recommendation: standardize the IA language:

- Dashboard: Projects / Global contexts.
- Session: Posts / Content / Context.
- Content views: By source / All ideas.

### 6. Edit Mode Is Not Real Edit Mode

Editing a context navigates to Analyse hub with `contextId`, but the input contains the id instead of the context name and existing values are not loaded.

Recommendation: either mark it as “Rebuild context” in prototype or hydrate the existing context from `mocks.js`.

### 7. Attach Existing Is A Shortcut, Not A Flow

Attach existing toggles `populated=1`, so there is no picker or confirmation. It also fails conceptually for real sessions because `contextId` takes precedence.

Recommendation: design a small context picker:

```
No Context → Attach Existing → Context Picker → Attached Context
```

### 8. Modal Overload Risks Fragmenting The Product

The product has a full-screen context wizard, assistant thread, feedback modal, bug modal, and image modal. The modals are individually coherent, but the main content generation path is not.

Recommendation: reserve modals for support/image tasks; make source → idea → post feel like one workspace flow.

### 9. Mock AI Replies Use Global Ideas

Assistant replies use imported `ideas` from `mocks.js`, not the session-local ideas created by `library.js`. After adding a new source, Archie may still reason from seeded global ideas.

Recommendation: pass active session ideas into reply generation, or keep a shared session model.

### 10. Missing Error States For AI And Intake

Source extraction and image generation have loading states but no visible failure/retry path. Bug screenshot capture fails silently.

Recommendation: add minimal SaaS-quality error states:

- Extraction failed → Retry / Remove source.
- Image generation failed → Try again / Edit prompt.
- Screenshot unavailable → Upload manually.

### 11. Browser Alert Breaks The Experience

Analyse hub uses `window.alert` when no components are selected.

Recommendation: inline validation under the component list.

### 12. Inconsistent Realism

Some flows are intentionally mock but look production-ready: file upload, URL analysis, generated image use, post scheduling. This creates expectation mismatches.

Recommendation: add prototype-specific affordances only where needed, or make each mock action visibly complete within the prototype.

## Recommended MVP Flow Spine

```
Dashboard
↓
New/Open Session
↓
Add Source
↓
Extract Ideas
↓
Select Strongest Idea
↓
Create Post Draft
↓
Review / Rewrite / Schedule
```

The current prototype has strong pieces for every part except the idea-to-post bridge and real session/context persistence. Those should be the first redesign focus.
