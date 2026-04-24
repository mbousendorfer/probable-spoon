// Shared source-card renderer — used by the dashboard Content section and
// the session Content tab (By source view).
//
// Matches Figma 42:5197. The card is now a compact one-row listing:
// kind-icon in a tinted square, filename + meta sub, then quiet action
// buttons on the right ("Ask", "View all N ideas", more).
//
// When the source is still processing, the icon box turns electric-blue,
// the icon becomes a spinner, the filename goes grey-60, "Ask" becomes
// disabled and the primary CTA turns into a disabled "Processing" pill.
//
// Source shape: { id, filename, kind, status, ideaCount, addedAt, ... }
// Idea shape is not read here anymore (the embedded idea-preview rows that
// used to live inside the card were removed in this redesign — the user
// jumps into All ideas via "View all N ideas" instead).

const KIND_ICON = {
  pdf: "ap-icon-file--pdf",
  video: "ap-icon-file--video",
  url: "ap-icon-link",
};

function iconFor(kind) {
  return KIND_ICON[(kind || "").toLowerCase()] || "ap-icon-file";
}

export function renderSourceCard(source, allIdeas = []) {
  const isProcessing = source.status === "Processing";
  const ideasForSource = allIdeas.filter((i) => i.sourceId === source.id);
  const totalIdeas = typeof source.ideaCount === "number" ? source.ideaCount : ideasForSource.length;

  // Sub-line varies by state. While processing we don't yet have ideas to
  // count, so we just show "Processing · Added <when>".
  const subLine = isProcessing
    ? `Processing · Added ${source.addedAt}`
    : `${totalIdeas} idea${totalIdeas === 1 ? "" : "s"} · ${source.status} · Added ${source.addedAt}`;

  // Icon content — file kind icon, or a spinning ring while processing.
  const iconContent = isProcessing
    ? `<span class="source-card__spinner" role="status" aria-label="Processing"></span>`
    : `<i class="${iconFor(source.kind)} source-card__kind-icon" aria-hidden="true"></i>`;

  // Primary CTA — View all ideas, replaced with a quiet "Processing" pill
  // while the source is still being analysed.
  const primaryCta = isProcessing
    ? `<span class="ap-button secondary blue source-card__primary source-card__primary--processing" aria-disabled="true">Processing</span>`
    : `<a
        class="ap-button secondary blue source-card__primary"
        href="#"
        data-source-view="${source.id}"
      >View all ${totalIdeas} idea${totalIdeas === 1 ? "" : "s"}</a>`;

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
        ${primaryCta}
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
