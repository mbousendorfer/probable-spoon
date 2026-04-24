// Shared renderer — groups ideas by their source and displays each group
// under a lightweight source-separator header.
//
// Used by:
//   - src/screens/dashboard.js  (Content → All ideas view)
//   - src/screens/session.js    (Content tab → All ideas view)
//
// Each group is a flex-column container (.dashboard__ideas-group) with:
//   1. A separator row showing the source kind-icon + filename + extracted-at.
//   2. A 2-column auto-fill grid (.dashboard__ideas-grid) of idea cards
//      rendered without their source-row (hideSourceRow: true) to avoid
//      repeating the same file name for every card in the group.

import { renderIdeaCard } from "./idea-card.js?v=20";

const KIND_ICON = {
  pdf: "ap-icon-file--pdf",
  video: "ap-icon-file--video",
  url: "ap-icon-link",
};

function iconFor(kind) {
  return KIND_ICON[(kind || "").toLowerCase()] || "ap-icon-file";
}

// Returns the grouped HTML string. Preserves insertion order of ideas so the
// display matches the order ideas were extracted (newest-first if the caller
// sorts that way upstream).
export function renderIdeasBySource(ideas, allSources) {
  if (!ideas || ideas.length === 0) return "";

  // Group ideas by sourceId while preserving the first-seen order of sources.
  const groups = new Map();
  for (const idea of ideas) {
    const key = idea.sourceId || "__unknown__";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(idea);
  }

  return [...groups.entries()]
    .map(([sourceId, groupIdeas]) => {
      const source = allSources.find((s) => s.id === sourceId) || null;
      const latestExtractedAt = groupIdeas[0]?.extractedAt || "";

      const separator = source
        ? `<div class="dashboard__ideas-separator">
            <i class="${iconFor(source.kind)}" aria-hidden="true"></i>
            <span class="dashboard__ideas-separator-name">${source.filename}</span>
            ${latestExtractedAt ? `<span class="muted">· extracted ${latestExtractedAt}</span>` : ""}
          </div>`
        : latestExtractedAt
          ? `<div class="dashboard__ideas-separator"><span class="muted">Extracted ${latestExtractedAt}</span></div>`
          : "";

      const cards = groupIdeas.map((idea) => renderIdeaCard(idea, allSources, { hideSourceRow: true })).join("");

      return `<div class="dashboard__ideas-group">
        ${separator}
        <div class="dashboard__ideas-grid">${cards}</div>
      </div>`;
    })
    .join("");
}
