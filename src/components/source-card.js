// Shared source-card renderer — used by the dashboard Content section and
// the session Content tab (By source view).
//
// Matches Figma 42:5197. The card is a compact one-row listing:
// kind-icon in a tinted square, filename + meta sub, then quiet action
// buttons on the right ("Ask", more).
//
// When the source is still processing, the icon box turns electric-blue,
// the icon becomes a spinner, the filename goes grey-60, and "Ask" is
// disabled.
//
// Source shape: { id, filename, kind, status, ideaCount, addedAt, ... }

const KIND_ICON = {
  pdf: "ap-icon-file--pdf",
  video: "ap-icon-file--video",
  url: "ap-icon-link",
  word: "ap-icon-file--text",
  text: "ap-icon-file--text",
  image: "ap-icon-file--image",
  audio: "ap-icon-file",
};

function iconFor(kind) {
  return KIND_ICON[(kind || "").toLowerCase()] || "ap-icon-file";
}

export function renderSourceCard(source, allIdeas = []) {
  const isProcessing = source.status === "Processing";
  const totalIdeas =
    typeof source.ideaCount === "number"
      ? source.ideaCount
      : allIdeas.filter((i) => (i.sourceIds || []).includes(source.id)).length;

  // Sub-line varies by state. While processing we don't yet have ideas to
  // count, so we just show "Processing · Added <when>".
  const subLine = isProcessing
    ? `Processing · Added ${source.addedAt}`
    : `${totalIdeas} idea${totalIdeas === 1 ? "" : "s"} · ${source.status} · Added ${source.addedAt}`;

  // Icon content — file kind icon, or a spinning ring while processing.
  const iconContent = isProcessing
    ? `<span class="source-card__spinner" role="status" aria-label="Processing"></span>`
    : `<i class="${iconFor(source.kind)} source-card__kind-icon" aria-hidden="true"></i>`;

  // Processing pill — shown in place of actions while the source is still
  // being analysed.
  const processingPill = isProcessing
    ? `<span class="ap-button secondary blue source-card__primary source-card__primary--processing" aria-disabled="true">Processing</span>`
    : "";

  // "Ask" — available always, but visually muted while processing.
  const askButton = `<button
        type="button"
        class="ap-button transparent grey source-card__ask"
        data-source-ask="${source.id}"
        ${isProcessing ? 'aria-disabled="true" tabindex="-1"' : ""}
      >
        <i class="ap-icon-single-chat-bubble"></i>
        <span>Ask</span>
      </button>`;

  return `
    <article class="ap-card source-card${isProcessing ? " source-card--processing" : ""}" data-source-id="${source.id}">
      <div class="source-card__kind-box">${iconContent}</div>

      <div class="source-card__info">
        <h3 class="source-card__name">${source.filename}</h3>
        <p class="source-card__sub">${subLine}</p>
      </div>

      <div class="source-card__actions">
        ${askButton}
        ${processingPill}
        <button
          type="button"
          class="ap-icon-button transparent source-card__more"
          data-source-more="${source.id}"
          aria-label="More actions"
        >
          <i class="ap-icon-more"></i>
        </button>
      </div>
    </article>
  `;
}
