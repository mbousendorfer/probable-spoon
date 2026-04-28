import { html, raw } from "../utils.js?v=20";
import { getThread, subscribe as subscribeThread } from "../assistant.js?v=22";

// Global Right Panel — slides in from the right edge of the viewport, overlays
// the session workspace, hosts two modes:
//   • 'drafts' — the AI's batch result (editable BatchCards, network-grouped,
//                Schedule N posts CTA).
//   • 'ideas'  — compact searchable Ideas library that injects a chosen idea
//                into the chat (Lot 5).
//
// State lives module-local; subscribers (the in-thread Drafts summary card,
// any future topbar pills, the assistant bubble) notify on transitions.
//
// Lot 4.2 — DraftsView renders network-grouped BatchCards from the active
// batch's assistant message. Selection state lives in this module and
// resets per batch. The Schedule button is wired but the modal lands in
// Lot 9; until then it shows a toast.

const PANEL_ID = "rightPanel";

const NETWORK_ICON = {
  linkedin: "ap-icon-linkedin",
  twitter: "ap-icon-twitter-official",
  x: "ap-icon-twitter-official",
  instagram: "ap-icon-instagram",
  facebook: "ap-icon-facebook",
  tiktok: "ap-icon-tiktok-official",
};

const NETWORK_NAME = {
  linkedin: "LinkedIn",
  twitter: "X",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

// Per-batch character limits — handoff §3.3 + mocks/socialAccounts. Used to
// show the live counter under each BatchCard. Conservative defaults.
const NETWORK_LIMIT = {
  linkedin: 3000,
  twitter: 280,
  x: 280,
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
};

let state = {
  mode: null, // 'drafts' | 'ideas' | null
  activeBatchRef: null, // { sessionId, messageId } | null
};
// Per-batch selection — Map<"sessionId::messageId", Set<postId>>. Defaults
// to all-selected the first time a batch is shown so the Schedule CTA is
// active out of the box.
const selectedByBatch = new Map();
// Subscriber bookkeeping — when the panel is open in Drafts mode we listen
// to the assistant thread so the panel re-renders when the batch's status
// changes (e.g. additional drafts land).
let unsubscribeActiveThread = null;
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
  rebindThread();
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
  if (unsubscribeActiveThread) {
    unsubscribeActiveThread();
    unsubscribeActiveThread = null;
  }
  renderPanel();
  notify();
}

export function setMode(mode) {
  if (mode !== "drafts" && mode !== "ideas") return;
  state = { ...state, mode };
  rebindThread();
  renderPanel();
  notify();
}

// Subscribe to the active session's thread so the panel reflects late-
// landing batch changes. Tear down + re-create on every mode flip / batch
// switch so we never leak listeners across sessions.
function rebindThread() {
  if (unsubscribeActiveThread) {
    unsubscribeActiveThread();
    unsubscribeActiveThread = null;
  }
  if (state.mode !== "drafts" || !state.activeBatchRef?.sessionId) return;
  unsubscribeActiveThread = subscribeThread(state.activeBatchRef.sessionId, () => {
    if (state.mode === "drafts") renderPanel();
  });
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
      return;
    }
    // BatchCard checkbox toggle.
    const toggle = event.target.closest("[data-rpanel-toggle]");
    if (toggle) {
      togglePostSelection(toggle.dataset.rpanelToggle);
      return;
    }
    // Schedule N posts — wired in Lot 9 once the modal exists.
    if (event.target.closest("[data-rpanel-schedule]")) {
      onSchedulePlaceholder();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.mode) {
      closePanel();
    }
  });
}

// --- Selection state ----------------------------------------------------

function batchKey(ref) {
  return `${ref.sessionId}::${ref.messageId}`;
}

function getSelected(ref, drafts) {
  const key = batchKey(ref);
  if (!selectedByBatch.has(key)) {
    // Default: every draft selected so the Schedule CTA is enabled out
    // of the box (matches handoff defaultBatch behavior).
    selectedByBatch.set(key, new Set(drafts.map((d) => d.id)));
  }
  return selectedByBatch.get(key);
}

function togglePostSelection(postId) {
  if (!state.activeBatchRef) return;
  const message = lookupActiveMessage();
  if (!message?.drafts) return;
  const set = getSelected(state.activeBatchRef, message.drafts);
  if (set.has(postId)) set.delete(postId);
  else set.add(postId);
  renderPanel();
}

// Lot 9 wires the Schedule modal here. Until then, just nudge the user.
function onSchedulePlaceholder() {
  import("./toast.js?v=20").then(({ showToast }) => {
    showToast("Scheduling lands in Lot 9 — the modal isn't wired yet.");
  });
}

function lookupActiveMessage() {
  if (!state.activeBatchRef) return null;
  const thread = getThread(state.activeBatchRef.sessionId);
  return thread.find((m) => m.id === state.activeBatchRef.messageId) || null;
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
      ${state.mode === "drafts" ? raw(renderDraftsView()) : raw(renderIdeasEmpty())}
    </div>
  `;
}

// --- Drafts mode -------------------------------------------------------

function renderDraftsView() {
  const message = lookupActiveMessage();
  if (!message?.drafts?.length) return renderDraftsEmpty();

  const ref = state.activeBatchRef;
  const selected = getSelected(ref, message.drafts);
  const total = message.drafts.length;
  const selectedCount = message.drafts.filter((d) => selected.has(d.id)).length;

  // Group by network. Preserves first-occurrence order so LinkedIn-first
  // sequences read top-to-bottom as the user expects.
  const groups = new Map();
  for (const d of message.drafts) {
    const net = d.network || "linkedin";
    if (!groups.has(net)) groups.set(net, []);
    groups.get(net).push(d);
  }

  const headerSub =
    total === 1 ? "1 post" : `${total} posts${selectedCount !== total ? ` · ${selectedCount} selected` : ""}`;

  const groupBlocks = [...groups.entries()]
    .map(([network, drafts]) => {
      const cards = drafts.map((d) => renderBatchCard(d, selected.has(d.id))).join("");
      return `
        <div class="rpanel-drafts__group">
          <div class="rpanel-drafts__group-head">
            <i class="${NETWORK_ICON[network] || "ap-icon-megaphone"}" aria-hidden="true"></i>
            <span class="rpanel-drafts__group-name">${NETWORK_NAME[network] || network}</span>
            <span class="rpanel-drafts__group-count">${drafts.length}</span>
          </div>
          <div class="rpanel-drafts__group-list">${cards}</div>
        </div>
      `;
    })
    .join("");

  return html`
    <div class="rpanel-drafts">
      <div class="rpanel-drafts__head">
        <div class="rpanel-drafts__title-row">
          <div>
            <div class="rpanel-drafts__title">Drafts</div>
            <div class="rpanel-drafts__sub">${headerSub}</div>
          </div>
          <button type="button" class="ap-button transparent grey" data-rpanel-regenerate>
            <i class="ap-icon-refresh"></i>
            <span>Regenerate</span>
          </button>
        </div>
        <button
          type="button"
          class="ap-button primary orange rpanel-drafts__schedule"
          data-rpanel-schedule
          ${selectedCount === 0 ? "disabled" : ""}
        >
          <i class="ap-icon-calendar"></i>
          <span>Schedule ${selectedCount > 0 ? selectedCount + " " : ""}${selectedCount === 1 ? "post" : "posts"}</span>
        </button>
      </div>
      <div class="rpanel-drafts__body">${raw(groupBlocks)}</div>
    </div>
  `;
}

function renderBatchCard(draft, isSelected) {
  const network = draft.network || "linkedin";
  const limit = NETWORK_LIMIT[network] || 3000;
  const text = draft.preview || (Array.isArray(draft.text) ? draft.text.join("\n\n") : draft.text || "");
  const len = text.length;
  const overLimit = len > limit;
  return `
    <div class="rpanel-batch-card ${isSelected ? "is-selected" : ""} ${overLimit ? "is-over" : ""}">
      <div class="rpanel-batch-card__head">
        <button
          type="button"
          class="rpanel-batch-card__check ${isSelected ? "is-on" : ""}"
          data-rpanel-toggle="${draft.id}"
          aria-label="${isSelected ? "Deselect" : "Select"} draft"
          aria-pressed="${isSelected}"
        >
          ${isSelected ? '<i class="ap-icon-check"></i>' : ""}
        </button>
        <i class="${NETWORK_ICON[network] || "ap-icon-megaphone"} rpanel-batch-card__network" aria-hidden="true"></i>
        <span class="rpanel-batch-card__network-name">${NETWORK_NAME[network] || network}</span>
        <span class="rpanel-batch-card__count ${overLimit ? "is-over" : ""}">${len}/${limit}</span>
      </div>
      <div class="rpanel-batch-card__body">${escapeHtml(text)}</div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
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
