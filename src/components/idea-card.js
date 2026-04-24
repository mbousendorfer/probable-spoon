// Shared idea-card renderer — used by the dashboard Content section (All
// ideas view) and the session Content tab.
//
// Matches Figma 42:4870. Stripped down to the four things a reader actually
// needs to judge whether to act on an idea:
//   1. Where it came from (source link at the top doubles as "open idea")
//   2. The idea itself (title + hook inside a grey-05 callout with a
//      mermaid-gradient left border)
//   3. Its editorial weight (one "High/Medium/Low potential" status pill)
//   4. One primary action — "Create post from this idea" (mermaid button),
//      plus a three-dots overflow that holds Pin / Unpin.
//
// Things that used to be on the card and are now gone from the surface:
//   numeric score, workflow-state tag, channel-fit chips, "AI confidence X%"
//   line, standalone "Why this could work" rationale block, "Open idea →"
//   button, dedicated pin button. Their data fields remain on the idea
//   object — they just stop being surfaced here.
//
// Idea shape:   { id, title, body, confidence, pinned, sourceId,
//                 extractedAt, channels, state, rationale }
// Source shape: { id, filename, kind, ... }
//
// Caller passes the full sources list so the card can resolve its origin.

function potentialFor(confidence) {
  if (confidence >= 80) return { label: "High potential", color: "green" };
  if (confidence >= 60) return { label: "Medium potential", color: "orange" };
  return { label: "Low potential", color: "grey" };
}

// Source-card keeps its own copy for Library; idea-card keeps a tiny local
// copy to stay self-contained. Four entries — no value in sharing.
const KIND_ICON = {
  pdf: "ap-icon-file--pdf",
  video: "ap-icon-file--video",
  url: "ap-icon-link",
};
function iconFor(kind) {
  return KIND_ICON[(kind || "").toLowerCase()] || "ap-icon-file";
}

const CHANNEL_META = {
  linkedin: { icon: "ap-icon-linkedin", label: "LinkedIn" },
  x: { icon: "ap-icon-twitter-official", label: "X" },
  twitter: { icon: "ap-icon-twitter-official", label: "X" },
  instagram: { icon: "ap-icon-instagram", label: "Instagram" },
};

// Still exported — source-card.js (Library view) uses it in compact mode
// to show tiny channel icons on each idea preview row.
export function renderChannelChips(channels = [], { compact = false } = {}) {
  if (!channels || channels.length === 0) return "";
  return `<span class="channel-chips${compact ? " channel-chips--compact" : ""}" aria-label="Channel fit">${channels
    .map((c) => {
      const meta = CHANNEL_META[c.toLowerCase()];
      if (!meta) return "";
      return compact
        ? `<i class="${meta.icon} channel-chips__icon" title="${meta.label}" aria-label="${meta.label}"></i>`
        : `<span class="channel-chip"><i class="${meta.icon}"></i><span>${meta.label}</span></span>`;
    })
    .join("")}</span>`;
}

// ── Overflow menu — one open at a time ─────────────────────────────────
//
// idea-card manages its own menu state so screen-level code (dashboard.js,
// session.js) only has to wire the idea-open / idea-generate actions.
//
// Since ES modules execute once per page, these listeners install exactly
// once — there's no risk of duplication when the dashboard re-renders.

function closeAllIdeaMoreMenus(exceptMenu) {
  document.querySelectorAll(".idea-card__more-menu:not([hidden])").forEach((menu) => {
    if (menu === exceptMenu) return;
    menu.hidden = true;
    const controllingBtn = document.querySelector(`[aria-controls="${menu.id}"]`);
    if (controllingBtn) controllingBtn.setAttribute("aria-expanded", "false");
  });
}

function toggleIdeaMoreMenu(triggerBtn) {
  const menuId = triggerBtn.getAttribute("aria-controls");
  const menu = menuId ? document.getElementById(menuId) : null;
  if (!menu) return;
  const willOpen = menu.hidden;
  closeAllIdeaMoreMenus(willOpen ? menu : null);
  menu.hidden = !willOpen;
  triggerBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
}

function togglePinMenuItem(pinBtn) {
  const wasPressed = pinBtn.getAttribute("aria-pressed") === "true";
  pinBtn.setAttribute("aria-pressed", wasPressed ? "false" : "true");
  const labelEl = pinBtn.querySelector("span");
  if (labelEl) labelEl.textContent = wasPressed ? "Pin idea" : "Unpin idea";
  closeAllIdeaMoreMenus();
}

document.addEventListener("click", (event) => {
  // Open/close handler
  const moreBtn = event.target.closest("[data-idea-more]");
  if (moreBtn) {
    event.preventDefault();
    toggleIdeaMoreMenu(moreBtn);
    return;
  }
  // Pin menu item — visual toggle only (mocks don't persist)
  const pinBtn = event.target.closest("[data-idea-pin]");
  if (pinBtn) {
    event.preventDefault();
    togglePinMenuItem(pinBtn);
    return;
  }
  // Clicks inside an open menu shouldn't bubble-close it
  if (event.target.closest(".idea-card__more-menu")) return;
  // Anywhere else — close everything
  closeAllIdeaMoreMenus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAllIdeaMoreMenus();
});

export function renderIdeaCard(idea, allSources = [], { hideSourceRow = false } = {}) {
  const source = allSources.find((s) => s.id === idea.sourceId) || null;
  const potential = potentialFor(idea.confidence || 0);

  // Source info row. The link itself triggers data-idea-open — the removed
  // "Open idea →" button handler takes over here.
  // When hideSourceRow is true (e.g. inside a grouped by-source layout where
  // the source is already shown as a section separator), skip this row.
  const sourceRow = hideSourceRow
    ? ""
    : source
      ? `
        <div class="idea-card__source-row">
          <a class="ap-link standalone idea-card__source-link" href="#" data-idea-open="${idea.id}">
            <i class="${iconFor(source.kind)}"></i>
            <span>${source.filename}</span>
          </a>
          ${idea.extractedAt ? `<span class="muted idea-card__source-meta">· extracted ${idea.extractedAt}</span>` : ""}
        </div>
      `
      : idea.extractedAt
        ? `<div class="idea-card__source-row"><span class="muted idea-card__source-meta">Extracted ${idea.extractedAt}</span></div>`
        : "";

  const pinLabel = idea.pinned ? "Unpin idea" : "Pin idea";

  return `
    <article class="ap-card idea-card" data-idea-id="${idea.id}">
      ${sourceRow}

      <div class="idea-card__body">
        <h3 class="idea-card__title">${idea.title}</h3>
        ${idea.body ? `<p class="idea-card__hook">${idea.body}</p>` : ""}
      </div>

      <div class="idea-card__actions">
        <span class="ap-status ${potential.color} idea-card__potential">${potential.label}</span>

        <div class="idea-card__secondary-actions">
          <button
            type="button"
            class="ap-button mermaid"
            data-idea-generate="${idea.id}"
          >
            <i class="ap-icon-sparkles"></i>
            <span>Draft a post</span>
          </button>

          <div class="idea-card__more-wrap">
            <button
              type="button"
              class="ap-icon-button transparent idea-card__more"
              data-idea-more="${idea.id}"
              aria-haspopup="menu"
              aria-expanded="false"
              aria-controls="idea-more-${idea.id}"
              aria-label="More actions"
            >
              <i class="ap-icon-more"></i>
            </button>
            <ul id="idea-more-${idea.id}" class="idea-card__more-menu" role="menu" hidden>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  class="idea-card__more-item"
                  data-idea-pin="${idea.id}"
                  aria-pressed="${idea.pinned ? "true" : "false"}"
                >
                  <i class="ap-icon-pin"></i>
                  <span>${pinLabel}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </article>
  `;
}
