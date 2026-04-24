// Shared idea-card renderer — used by the dashboard Content ideas list and
// the session Content ideas tab.
//
// Redesign direction: help the user decide whether an idea is worth publishing
// BEFORE they generate a post. Engagement potential leads, AI confidence is
// demoted to secondary metadata, a concise "Why this could work" explains the
// editorial pitch, and source context is visible at a glance. Generation is a
// quiet secondary action that works across channels, not a repeated primary
// "Generate LinkedIn".
//
// Idea shape:   { id, title, body, rationale, confidence, pinned, sourceId,
//                 extractedAt, relevance }
// Source shape: { id, filename, kind, ... }
//
// Caller passes the full sources list so the card can resolve its origin.

function potentialFor(confidence) {
  if (confidence >= 80) return { label: "High potential", color: "green" };
  if (confidence >= 60) return { label: "Medium potential", color: "orange" };
  return { label: "Low potential", color: "grey" };
}

export function renderIdeaCard(idea, allSources = []) {
  const source = allSources.find((s) => s.id === idea.sourceId) || null;
  const potential = potentialFor(idea.confidence || 0);
  const confidence = typeof idea.confidence === "number" ? idea.confidence : null;

  const workflowChip = idea.pinned
    ? '<span class="ap-tag blue"><i class="ap-icon-pin"></i>Pinned</span>'
    : '<span class="ap-tag grey">New</span>';

  const sourceLine = source
    ? `From <strong>${source.filename}</strong>${idea.extractedAt ? ` · extracted ${idea.extractedAt}` : ""}`
    : idea.extractedAt
      ? `Extracted ${idea.extractedAt}`
      : "";

  return `
    <article class="ap-card idea-card" data-idea-id="${idea.id}">
      <header class="idea-card__head">
        <div class="idea-card__signals">
          <span class="ap-status ${potential.color} idea-card__potential">
            <strong>${idea.confidence || 0}</strong>
            <span>${potential.label}</span>
          </span>
          ${workflowChip}
          ${confidence !== null ? `<span class="idea-card__confidence muted">AI confidence ${confidence}%</span>` : ""}
        </div>
        <button
          type="button"
          class="ap-icon-button transparent idea-card__more"
          data-idea-more="${idea.id}"
          aria-label="More actions"
        >
          <i class="ap-icon-more"></i>
        </button>
      </header>

      <div class="idea-card__body">
        <h3 class="idea-card__title">${idea.title}</h3>
        ${idea.body ? `<p class="idea-card__hook">${idea.body}</p>` : ""}
        ${
          idea.rationale
            ? `
          <p class="idea-card__rationale">
            <span class="idea-card__rationale-label">Why this could work</span>
            <span>${idea.rationale}</span>
          </p>
        `
            : ""
        }
      </div>

      ${sourceLine ? `<p class="idea-card__source muted">${sourceLine}</p>` : ""}

      <footer class="idea-card__actions">
        <button
          type="button"
          class="ap-button stroked blue idea-card__open"
          data-idea-open="${idea.id}"
        >
          <span>Open idea</span>
          <i class="ap-icon-arrow-right"></i>
        </button>
        <div class="idea-card__secondary-actions">
          <button
            type="button"
            class="ap-button transparent grey"
            data-idea-generate="${idea.id}"
            aria-haspopup="menu"
          >
            <i class="ap-icon-sparkles"></i>
            <span>Generate post</span>
            <i class="ap-icon-chevron-down"></i>
          </button>
          <button
            type="button"
            class="ap-icon-button transparent idea-card__pin ${idea.pinned ? "is-active" : ""}"
            data-idea-pin="${idea.id}"
            aria-pressed="${idea.pinned ? "true" : "false"}"
            aria-label="${idea.pinned ? "Unpin idea" : "Pin idea"}"
          >
            <i class="ap-icon-pin"></i>
          </button>
        </div>
      </footer>
    </article>
  `;
}
