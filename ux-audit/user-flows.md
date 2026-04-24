# Archie UX Audit — User Flow Inventory

## Create New Project / Session

- User goal: start a content project.
- Entry point: Dashboard, New project card.
- Steps:
  1. Enter project name.
  2. Choose context option: no context, voice profile, strategy brief, brand theme.
  3. Click Create.
  4. App navigates to `#/session/new`.
- Decisions:
  - Context option only changes URL state while selecting; final creation ignores it.
- Success outcome: empty session screen opens with “Untitled session”.
- Failure states:
  - Empty project name is accepted.
  - Context choice is not attached.
  - No persistence or created session record.
- Missing UX issues:
  - No validation, no loading, no confirmation.
  - User’s typed title is discarded.
  - Context selection implies behavior that does not happen.

## Use Template Starter

- User goal: start from a predefined project type.
- Entry point: Dashboard, Template starters.
- Steps:
  1. Click a starter.
- Decisions: none implemented.
- Success outcome: none.
- Failure states:
  - Buttons have `data-template-id` but no click handler.
- Missing UX issues:
  - Looks actionable but is a dead end.
  - No visible selected state or prefilled project behavior.

## Open Existing Session

- User goal: continue work in a previous project.
- Entry point: Dashboard, recent session card.
- Steps:
  1. Click session card.
  2. App navigates to `#/session/:id`.
  3. Session opens on Posts tab by default.
- Decisions:
  - Real seeded sessions show populated posts.
  - Unknown/new sessions show empty state.
- Success outcome: user lands in session workspace with assistant panel.
- Failure states:
  - Unknown ids resolve to generic “Session”.
- Missing UX issues:
  - No session switcher despite visible dropdown in composer.
  - No breadcrumb because topbar ignores crumb parameter.

## Switch Dashboard Content Views

- User goal: browse sources or all ideas from dashboard.
- Entry point: Dashboard, Projects tab.
- Steps:
  1. Choose By source or All ideas.
  2. Query updates to `view=sources` or `view=ideas`.
  3. Content list rerenders.
- Decisions: source vs idea view.
- Success outcome: correct list shown with counters.
- Failure states:
  - Add source button in dashboard does nothing.
- Missing UX issues:
  - Dashboard source and idea card actions jump into a default session, not necessarily the card’s owning session.

## Add Source From Assistant

- User goal: add material for Archie to analyze.
- Entry point: Session assistant composer, plus button.
- Steps:
  1. Click plus icon.
  2. Choose Add PDF, Add video, or Add URL.
  3. Library adds a Processing source.
  4. Assistant posts a source-intake turn.
  5. Pending/extracting state appears.
  6. After mock delay, source becomes Processed.
  7. Extracted ideas are added to Content.
  8. Assistant posts “Extracted N ideas” result with idea cards.
- Decisions:
  - Source kind determines filename, size, signal, and extracted ideas.
- Success outcome: new source and ideas appear; assistant thread narrates extraction.
- Failure states:
  - Unsupported kind silently does nothing.
  - No upload/url form, file picker, cancellation, retry, or error state.
- Missing UX issues:
  - The menu labels imply real file/url intake but use fixed scripts.
  - Processing takes ~15s with no cancel.
  - Processing source “Ask” is visually disabled but still uses a button with `aria-disabled`, relying on handler behavior rather than native disabled.

## Chat With Archie

- User goal: ask Archie to compare ideas, find a signal, suggest sources, or draft.
- Entry point: Session assistant composer or suggested prompt.
- Steps:
  1. Type prompt or click suggested prompt.
  2. Press Enter or Send.
  3. User message appears.
  4. Drafting notice and hidden assistant placeholder are added.
  5. Mock reply resolves after short delay.
  6. Drafting notice collapses; assistant answer appears.
- Decisions:
  - Reply script branches on draft/generate/post/linkedin/x, compare/vs, pin/priority/strongest/signal/actionable, source/pdf/video/url/attach/add, or fallback.
- Success outcome: contextual assistant answer displayed.
- Failure states:
  - Empty prompt is ignored.
  - If no global mock ideas exist, reply says insufficient material.
- Missing UX issues:
  - Replies use global seeded ideas, not the active session’s newly extracted ideas.
  - Suggested prompts fill composer but do not auto-send.
  - No retry, copy, save, or convert-to-post path.

## Review Extracted Ideas In Chat

- User goal: inspect extracted ideas after source analysis.
- Entry point: Assistant extraction result.
- Steps:
  1. Expand “Extracted N ideas” details.
  2. Read idea cards.
  3. Mark idea helpful or not helpful.
  4. Click View idea.
  5. App switches to Content > All ideas and pulses matching idea.
- Decisions:
  - Helpful and not helpful are mutually exclusive visual toggles.
- Success outcome: idea highlighted in Content tab.
- Failure states:
  - Feedback is not persisted.
  - View idea has no detail page.
- Missing UX issues:
  - No clear action to turn the selected extracted idea into a post.
  - Collapse state is not persisted.

## Browse Content In Session

- User goal: review sources and ideas.
- Entry point: Session Content tab.
- Steps:
  1. Click Content tab.
  2. If empty, see empty state.
  3. If populated, use search, sort, and source/ideas switcher.
  4. Click View all ideas from a source to switch to ideas view.
  5. Click Ask to prime assistant composer.
- Decisions:
  - View: sources vs ideas.
  - Sort: highest potential, newest, source, workflow state.
  - Search term.
- Success outcome: relevant source/idea list visible.
- Failure states:
  - No results shows empty matching state.
  - Source overflow does nothing.
  - Idea Create post does nothing.
- Missing UX issues:
  - Search state is module-local and survives across sessions in the same page lifetime.
  - “Open idea” is only a visual pulse, not an inspectable idea detail.

## Pin / Unpin Idea

- User goal: mark an idea as important.
- Entry point: Idea card overflow menu.
- Steps:
  1. Click more button.
  2. Click Pin idea or Unpin idea.
  3. Menu label toggles.
- Decisions: pin or unpin.
- Success outcome: visual state changes.
- Failure states:
  - No data mutation; sort/state does not update.
- Missing UX issues:
  - No persistent pinned collection or visible global impact.

## Create Post From Idea

- User goal: generate a post from an idea.
- Entry point: Idea card “Create post from this idea”.
- Steps:
  1. Click CTA.
- Decisions: none implemented.
- Success outcome: none.
- Failure states:
  - Click is intercepted and prevented with no follow-up.
- Missing UX issues:
  - Core value path is a dead end.
  - No post draft creation, modal, assistant handoff, or error feedback.

## Review Posts

- User goal: inspect generated/scheduled posts.
- Entry point: Session Posts tab for real seeded session.
- Steps:
  1. Open a real session.
  2. Browse feed.
  3. Filter by status or network.
  4. Clear filters when no results.
- Decisions:
  - Status: all, needs fixes, scheduled.
  - Network: all, LinkedIn, X.
- Success outcome: matching posts visible.
- Failure states:
  - X filter returns empty because mock posts are LinkedIn only.
  - Empty state can clear filters.
- Missing UX issues:
  - Post action rail is non-functional.
  - Post selection checkboxes do not lead to bulk actions.
  - One seeded post contains visible TODO copy.

## Generate Image For Post

- User goal: create an image for a post.
- Entry point: Post card image placeholder.
- Steps:
  1. Click Generate an image.
  2. Modal opens and auto-derives prompt.
  3. Edit prompt.
  4. Optionally choose visual style and mood.
  5. Click Generate.
  6. Loading skeleton appears.
  7. Generated image preview appears.
  8. Regenerate, Edit options, or Use this image.
- Decisions:
  - Style chip, mood chip, edit/regenerate/use.
- Success outcome: modal closes on Use this image.
- Failure states:
  - Caller does not pass `onUse`, so selected image is not applied to the post.
  - Image source uses `picsum.photos`; generation failure returns to idle silently.
- Missing UX issues:
  - No saved image state.
  - No inline confirmation that image was attached.

## Create Context

- User goal: create reusable context for Archie.
- Entry point: Dashboard Global contexts “Create context”, Dashboard context create card, Session Context “Create a context”.
- Steps:
  1. Navigate to `#/analyse`.
  2. Enter context name.
  3. Select Voice, Brief, Brand components.
  4. Click Continue.
  5. App navigates to first selected stage with `?stages=` and `name=`.
- Decisions:
  - Include any subset of voice/brief/brand.
- Success outcome: first selected wizard starts.
- Failure states:
  - If no component selected, browser alert appears.
  - Empty context name becomes “New context”.
- Missing UX issues:
  - Browser alert breaks product polish.
  - No save/persistence of created context.
  - No way to reorder selected stages.

## Analyze Voice

- User goal: build a voice profile.
- Entry point: Analyse hub with Voice selected, Session Context add Voice.
- Steps:
  1. Confirm whether Archie should learn writing style.
  2. Choose source type: social profile, document, or attached sources.
  3. Review each voice section.
  4. Continue or request rework.
  5. Review final summary.
  6. Keep profile or start over.
  7. Advance to next selected context stage or summary.
- Decisions:
  - Analyze vs skip.
  - Source choice.
  - Per-section good vs rework.
  - Summary keep vs start over.
- Success outcome: stage advances.
- Failure states:
  - Skip exits to dashboard.
  - Rework advances like good; no regenerated content.
  - Custom answers advance canonically.
- Missing UX issues:
  - Source choices do not collect real handles/files.
  - No actual edit surface for section content.

## Build Strategy Brief

- User goal: review and accept goals, audience, and brand voice strategy.
- Entry point: Analyse hub with Brief selected, Session Context add Brief.
- Steps:
  1. Review each section.
  2. Choose Looks good or Needs work.
  3. Review summary.
  4. Optionally toggle “Use this brief as default”.
  5. Accept or start over.
  6. Advance to next selected context stage or summary.
- Decisions:
  - Per-section good/rework.
  - Summary yes/no/custom.
  - Default toggle.
- Success outcome: stage advances.
- Failure states:
  - Rework does not actually regenerate.
  - Default toggle is not read or saved.
- Missing UX issues:
  - No editable fields.
  - No progress indication beyond text.

## Set Brand Theme

- User goal: analyze brand website and apply theme.
- Entry point: Analyse hub with Brand selected, Session Context add Brand.
- Steps:
  1. Enter brand URL.
  2. Press Enter or Analyze brand.
  3. Review colors, imagery, buttons, personality.
  4. Start over or Apply this theme.
  5. Confirm all good or retry URL.
  6. Advance to next selected context stage or summary.
- Decisions:
  - URL value.
  - Apply vs start over.
  - Confirm vs retry.
- Success outcome: stage advances.
- Failure states:
  - URL is fixed to mock brand data.
  - No URL validation or loading/error state.
- Missing UX issues:
  - The “analyze” action feels real but is instant/static.
  - No way to edit extracted colors/personality.

## Finish Context And Open Session

- User goal: use created context in a session.
- Entry point: Analyse summary after selected stages.
- Steps:
  1. Review built component list.
  2. Click Back to home or Open a session with this context.
  3. Open-session CTA navigates to `#/session/s-acme-launch?tab=context&populated=1`.
- Decisions: home vs session.
- Success outcome: seeded session Context tab shows populated context.
- Failure states:
  - New context is not saved.
  - Always opens seeded Acme session.
- Missing UX issues:
  - Summary breaks user’s mental model by attaching to a different existing session.

## Attach / Detach Context In Session

- User goal: add or remove context from a session.
- Entry point: Session Context tab.
- Steps:
  1. If no context, click Attach existing.
  2. Query sets `populated=1`; context appears.
  3. Click Detach.
  4. Query clears `populated`.
- Decisions: attach existing, create, detach, edit.
- Success outcome: visual context can appear for new/non-real sessions.
- Failure states:
  - Real seeded session with `contextId` stays attached even after detach.
  - No existing-context picker.
- Missing UX issues:
  - Detach can appear broken on real sessions.
  - Attach existing is not a selection workflow.

## Edit Existing Context

- User goal: update an existing context.
- Entry point: Global contexts row Edit or Session Context Edit.
- Steps:
  1. Click Edit.
  2. App navigates to `#/analyse?contextId=...`.
  3. Hub title changes to Edit context.
  4. Context name input is filled with the raw context id.
  5. Continue through selected stages.
- Decisions: selected components.
- Success outcome: stage wizard starts.
- Failure states:
  - Existing context values are not loaded into hub.
  - Saving does not update data.
- Missing UX issues:
  - Edit mode is mostly a create flow wearing edit labels.

## Give Feedback

- User goal: submit product feedback.
- Entry point: Topbar Give feedback.
- Steps:
  1. Open modal.
  2. Choose feature area.
  3. Enter feedback.
  4. Send feedback.
  5. Loading label appears.
  6. Success panel appears, then modal auto-closes.
- Decisions: feature area.
- Success outcome: success state.
- Failure states:
  - Empty text marks textarea invalid.
  - No backend.
- Missing UX issues:
  - Success auto-close timing could hide confirmation too quickly.

## Report Bug

- User goal: report issue with current screen context.
- Entry point: Topbar Report a bug.
- Steps:
  1. Open modal.
  2. Auto-capture starts.
  3. Optionally choose issue category.
  4. Enter attempted action.
  5. Enter required problem.
  6. Keep auto-captured screenshot, remove it, or upload/drop another image.
  7. Submit.
  8. Success state appears, then modal auto-closes.
- Decisions:
  - Category chip.
  - Screenshot keep/remove/upload.
- Success outcome: success state.
- Failure states:
  - Empty problem marks field invalid.
  - html2canvas CDN failure falls back silently to upload.
- Missing UX issues:
  - No file size validation despite copy saying max 10 MB.
  - No backend.

## Switch Prototype User Mode

- User goal: preview first-time or returning-user states.
- Entry point: Floating Admin chip.
- Steps:
  1. Click Admin chip.
  2. `localStorage` is updated or cleared.
  3. Page reloads.
- Decisions: new vs returning.
- Success outcome: dashboard/session data changes between empty and populated states.
- Failure states:
  - localStorage errors are ignored.
- Missing UX issues:
  - Useful for prototyping only; should be hidden or removed in production.
