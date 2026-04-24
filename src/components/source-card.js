// Shared source-card renderer — used by the dashboard Library list and the
// session Library tab.
//
// The card foregrounds the extracted ideas (top 2 by confidence) and demotes
// the file metadata to a secondary line. Each idea preview is its own
// interactive row that opens the full extraction; the footer holds quiet
// secondary actions (view all, ask, extract more).
//
// Source shape: { id, filename, kind, status, signal, signalColor, ideaCount, addedAt }
// Idea shape:   { id, title, body, confidence, sourceId, ... }
//
// Caller passes the full ideas list — we filter to ideas matching this source
// and rank them by confidence.

const KIND_ICON = {
  pdf: "ap-icon-file--pdf",
  video: "ap-icon-file--video",
  url: "ap-icon-link",
};

function iconFor(kind) {
  return KIND_ICON[(kind || "").toLowerCase()] || "ap-icon-file";
}

// Map confidence (0-100) to a semantic potential bucket. Tied to DS .ap-status
// colors so the pill stays consistent with the rest of the app.
function potentialFor(confidence) {
  if (confidence >= 80) return { label: "High potential", color: "green" };
  if (confidence >= 60) return { label: "Medium potential", color: "orange" };
  return { label: "Low potential", color: "grey" };
}

export function renderSourceCard(source, allIdeas = []) {
  const ideasForSource = allIdeas
    .filter((i) => i.sourceId === source.id)
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  const top = ideasForSource.slice(0, 2);
  const remaining = Math.max(0, ideasForSource.length - top.length);
  const isProcessing = source.status === "Processing";
  const totalIdeas = typeof source.ideaCount === "number" ? source.ideaCount : ideasForSource.length;

  return `
    <article class="ap-card source-card" data-source-id="${source.id}">
      <header class="source-card__head">
        <div class="source-card__title-row">
          <i class="${iconFor(source.kind)} source-card__kind-icon" aria-hidden="true"></i>
          <h3 class="source-card__name">${source.filename}</h3>
        </div>
        <button
          type="button"
          class="ap-icon-button transparent source-card__more"
          data-source-more="${source.id}"
          aria-label="More actions"
        >
          <i class="ap-icon-more"></i>
        </button>
      </header>

      <p class="source-card__sub">
        <span>${source.kind}</span>
        <span aria-hidden="true">·</span>
        <span>${totalIdeas} idea${totalIdeas === 1 ? "" : "s"}</span>
        <span aria-hidden="true">·</span>
        <span>${source.status}</span>
        <span aria-hidden="true">·</span>
        <span>Added ${source.addedAt}</span>
      </p>

      ${
        top.length === 0
          ? `<div class="source-card__ideas-empty">${
              isProcessing
                ? `<span class="ap-status mermaid">Extracting</span><span>Ideas will appear here in a moment.</span>`
                : `<span>No ideas extracted yet.</span>`
            }</div>`
          : `<ul class="source-card__ideas" role="list">
              ${top.map(renderIdeaRow).join("")}
            </ul>`
      }

      <footer class="source-card__footer">
        <a
          class="ap-link small source-card__view-all"
          href="#"
          data-source-view="${source.id}"
        >View all ${totalIdeas} idea${totalIdeas === 1 ? "" : "s"} →</a>
        <div class="source-card__footer-actions">
          <button
            type="button"
            class="ap-button transparent grey"
            data-source-ask="${source.id}"
          >
            <i class="ap-icon-single-chat-bubble"></i>
            <span>Ask</span>
          </button>
          <button
            type="button"
            class="ap-button transparent grey"
            data-source-extract="${source.id}"
          >
            <i class="ap-icon-sparkles"></i>
            <span>Extract more</span>
          </button>
        </div>
      </footer>

      ${
        remaining > 0
          ? `<p class="source-card__more-hint muted">+${remaining} more idea${remaining === 1 ? "" : "s"} from this source</p>`
          : ""
      }
    </article>
  `;
}

function renderIdeaRow(idea) {
  const potential = potentialFor(idea.confidence || 0);
  return `
    <li class="source-card__idea">
      <button
        type="button"
        class="source-card__idea-button"
        data-source-idea="${idea.id}"
        aria-label="Open idea: ${escapeAttr(idea.title)}"
      >
        <span class="source-card__idea-title">${idea.title}</span>
        <span class="source-card__idea-meta">
          <span class="source-card__idea-score">${idea.confidence || 0}</span>
          <span class="source-card__idea-sep" aria-hidden="true">·</span>
          <span class="ap-status ${potential.color}">${potential.label}</span>
        </span>
        <i class="ap-icon-arrow-right source-card__idea-chevron" aria-hidden="true"></i>
      </button>
    </li>
  `;
}

function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}
