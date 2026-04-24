# Archie UX Audit — Figma File Recommendation

Target Figma file: https://www.figma.com/design/ulQHaMfPhTQwNLib6IDOez/Archie?node-id=79-1649&p=f&t=Uqd51u92ZwwUnruG-11

## Recommended Page Structure

### 01 Audit

Purpose: high-level audit board and product architecture snapshot.

Suggested frames:

- Product definition
- Route map
- Feature inventory by category
- Maturity heatmap
- Evidence map: route/file/component references

### 02 User Flows

Purpose: complete flow inventory from the real implementation.

Suggested sections:

- Core MVP flows
- Context flows
- Support/utility flows
- Broken/no-op flows
- Empty/loading/error states

### 03 Wireflows

Purpose: Figma-ready wireflows that can be rebuilt as minimalist boards.

Suggested wireflow groups:

- Project start
- Source intake and extraction
- Assistant reply
- Content review
- Idea to post gap
- Posts review
- Generate image
- Create context
- Voice wizard
- Brief wizard
- Brand wizard
- Feedback/bug report

### 04 IA / Navigation

Purpose: clean information architecture and navigation model.

Suggested content:

- Current route tree
- Proposed IA labels
- Query-state model
- Session object model
- Context object model
- Cross-screen entry points

Recommended current IA:

```
Dashboard
├─ Projects
│  ├─ Recent sessions
│  └─ Content preview
└─ Global contexts

Session
├─ Assistant panel
├─ Posts
├─ Content
│  ├─ By source
│  └─ All ideas
└─ Context

Analyse
├─ Hub
├─ Voice wizard
├─ Strategy brief wizard
├─ Brand theme wizard
└─ Summary
```

### 05 Redesign Concepts

Purpose: focused redesign explorations, not a giant app rebuild.

Suggested concepts:

- MVP flow spine: source → idea → post.
- Context picker and context attach flow.
- Idea detail/dossier drawer.
- Post generation and review flow.
- Empty-state onboarding for first-time users.
- Reduced action surface for solo-founder speed.

### 06 Final UI

Purpose: refined UI after flow decisions are made.

Suggested frames:

- Dashboard
- New project/session creation
- Session workspace
- Content source/ideas views
- Idea detail and generate post
- Posts review/scheduling
- Context hub and attach picker
- Voice/Brief/Brand wizard templates

## Figma Board Conventions

- Use one color for complete flows, one for partial flows, one for broken/no-op flows.
- Keep nodes small and textual; avoid full-screen mockups in flow pages.
- Use route labels directly on frames, for example `#/session/:id?tab=content&view=ideas`.
- Add code reference labels under each flow group.
- Separate “current implementation” from “recommended redesign” so the audit remains evidence-based.

## Suggested Figma Legend

| Status    | Meaning                                                               |
| --------- | --------------------------------------------------------------------- |
| Complete  | Click path has visible outcome in prototype.                          |
| Partial   | UI exists, but state/persistence/real data is incomplete.             |
| Broken    | Visible action has no meaningful result or contradicts state.         |
| Hidden    | Implemented or implied but not discoverable as a user-facing feature. |
| Duplicate | Documentation, IA, or code path conflicts with current product model. |
