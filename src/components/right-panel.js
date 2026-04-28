import { html, raw } from "../utils.js?v=20";

// Global Right Panel — slides in from the right edge of the viewport, overlays
// the session workspace, hosts two modes:
//   • 'drafts' — the AI's batch result (editable BatchCards, network-grouped,
//                Schedule N posts CTA). Shipped piece-by-piece across Lot 4.
//   • 'ideas'  — compact searchable Ideas library that injects a chosen idea
//                into the chat (Lot 5).
//
// State lives module-local; subscribers (the in-thread Drafts summary card,
// any future topbar pills, the assistant bubble) notify on transitions.
//
// Lot 4.1 — this commit ships the scaffold only: panel chrome, open/close,
// tab toggle, and empty bodies for both modes. 4.2 fills DraftsView, 5.x
// fills IdeasView.

const PANEL_ID = "rightPanel";

let state = {
  mode: null, // 'drafts' | 'ideas' | null
  activeBatchRef: null, // { sessionId, messageId } | null
};
const subs = new Set();

function notify() {
  for (const fn of subs) fn(state);
}

export function getMode() {
  return state.mode;
}

export function getActiveBatchRef() {
  return state.activeBatchRef;
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

// Open in Drafts mode pinned to a specific assistant message in a session.
// Called by the in-thread Drafts summary card (Lot 4.3).
export function openDrafts(activeBatchRef) {
  state = { mode: "drafts", activeBatchRef: activeBatchRef || state.activeBatchRef };
  renderPanel();
  notify();
}

export function openIdeas() {
  state = { ...state, mode: "ideas" };
  renderPanel();
  notify();
}

export function closePanel() {
  state = { ...state, mode: null };
  renderPanel();
  notify();
}

export function setMode(mode) {
  if (mode !== "drafts" && mode !== "ideas") return;
  state = { ...state, mode };
  renderPanel();
  notify();
}

export function init() {
  let el = document.getElementById(PANEL_ID);
  if (!el) {
    el = document.createElement("aside");
    el.id = PANEL_ID;
    el.className = "app-right-panel";
    el.setAttribute("aria-label", "Drafts and ideas panel");
    el.hidden = true;
    document.body.appendChild(el);
  }
  el.addEventListener("click", (event) => {
    if (event.target.closest("[data-rpanel-close]")) {
      closePanel();
      return;
    }
    const tab = event.target.closest("[data-rpanel-tab]");
    if (tab) {
      setMode(tab.dataset.rpanelTab);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.mode) {
      closePanel();
    }
  });
}

function renderPanel() {
  const el = document.getElementById(PANEL_ID);
  if (!el) return;
  if (!state.mode) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  el.hidden = false;
  el.innerHTML = html`
    <div class="app-right-panel__head">
      <div class="app-right-panel__tabs" role="tablist">
        <button
          type="button"
          class="app-right-panel__tab ${state.mode === "drafts" ? "is-on" : ""}"
          role="tab"
          aria-selected="${state.mode === "drafts"}"
          data-rpanel-tab="drafts"
        >
          <i class="ap-icon-pen"></i>
          <span>Drafts</span>
        </button>
        <button
          type="button"
          class="app-right-panel__tab ${state.mode === "ideas" ? "is-on" : ""}"
          role="tab"
          aria-selected="${state.mode === "ideas"}"
          data-rpanel-tab="ideas"
        >
          <i class="ap-icon-sparkles"></i>
          <span>Ideas</span>
        </button>
      </div>
      <button
        type="button"
        class="ap-icon-button transparent"
        data-rpanel-close
        aria-label="Close panel"
        title="Close panel (Esc)"
      >
        <i class="ap-icon-close"></i>
      </button>
    </div>
    <div class="app-right-panel__body">
      ${state.mode === "drafts" ? raw(renderDraftsEmpty()) : raw(renderIdeasEmpty())}
    </div>
  `;
}

function renderDraftsEmpty() {
  return html`
    <div class="app-right-panel__empty">
      <div class="app-right-panel__empty-icon"><i class="ap-icon-pen"></i></div>
      <div class="app-right-panel__empty-title">No drafts yet</div>
      <div class="app-right-panel__empty-sub">
        Ask Archie for a batch — drafts will land here ready to review and schedule.
      </div>
    </div>
  `;
}

function renderIdeasEmpty() {
  return html`
    <div class="app-right-panel__empty">
      <div class="app-right-panel__empty-icon"><i class="ap-icon-sparkles"></i></div>
      <div class="app-right-panel__empty-title">No ideas yet</div>
      <div class="app-right-panel__empty-sub">
        The compact Ideas library lands here in Lot 5. Browse the full library from the sidebar in the meantime.
      </div>
    </div>
  `;
}
