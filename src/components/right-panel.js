import { html, raw } from "../utils.js?v=20";
import { getThread, subscribe as subscribeThread } from "../assistant.js?v=22";
import { ideas as MOCK_IDEAS } from "../mocks.js?v=24";
import { isNewUser } from "../user-mode.js?v=20";

// Lot 15 — empty in first-time mode so the right-panel Ideas surface lines
// up with the rest of the chrome (sidebar Recent list = empty, dashboard
// = first-run welcome). Returning user gets the full seed.
const IDEAS = isNewUser() ? [] : MOCK_IDEAS;
import { open as openScheduleModal } from "./schedule-modal.js?v=20";

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

// Idea kind taxonomy — handoff Ideas filter rail (§ 2.6). Order is the order
// shown in the chip row. The .kind selector also drives the per-kind tag
// color so each kind reads at a glance.
const IDEA_KINDS = [
  { id: "all", label: "All" },
  { id: "hook", label: "Hooks" },
  { id: "stat", label: "Stats" },
  { id: "quote", label: "Quotes" },
  { id: "story", label: "Stories" },
  { id: "insight", label: "Insights" },
];

// Ideas-mode local UI state — filter chip + search query. Resets each time
// the panel reopens in Ideas mode.
let ideasFilter = "all";
let ideasQuery = "";

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
    // Ideas filter chip.
    const chip = event.target.closest("[data-rpanel-ideas-filter]");
    if (chip) {
      ideasFilter = chip.dataset.rpanelIdeasFilter;
      renderPanel();
      return;
    }
    // Use this idea → injects a templated prompt into the assistant composer.
    const useBtn = event.target.closest("[data-rpanel-use-idea]");
    if (useBtn) {
      useIdea(useBtn.dataset.rpanelUseIdea);
      return;
    }
    // Schedule N posts — wired in Lot 9 once the modal exists.
    if (event.target.closest("[data-rpanel-schedule]")) {
      onSchedulePlaceholder();
    }
  });
  el.addEventListener("input", (event) => {
    if (event.target.matches("[data-rpanel-ideas-search]")) {
      ideasQuery = event.target.value || "";
      renderIdeasBodyOnly();
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

// Per-batch scheduling state — Map<batchKey, Set<postId>>. Drafts in this
// set render with .is-scheduled (faded + green check pill). Lot 9 keeps the
// flow purely client-side per Q9; a real Publishing API call is the
// replacement point inside onSchedulePlaceholder.
const scheduledByBatch = new Map();

function getScheduled(ref) {
  const key = batchKey(ref);
  if (!scheduledByBatch.has(key)) scheduledByBatch.set(key, new Set());
  return scheduledByBatch.get(key);
}

// Open the Schedule modal pinned to the active batch's selected drafts.
// Mock end-to-end (Q9): on confirm, the modal flags those posts as
// scheduled and we re-render. Replacement point #5: post the slots to the
// real Publishing API instead of mutating local state.
function onSchedulePlaceholder() {
  if (!state.activeBatchRef) return;
  const message = lookupActiveMessage();
  if (!message?.drafts) return;
  const selected = getSelected(state.activeBatchRef, message.drafts);
  const scheduled = getScheduled(state.activeBatchRef);
  const candidates = message.drafts.filter((d) => selected.has(d.id) && !scheduled.has(d.id));
  if (candidates.length === 0) {
    import("./toast.js?v=20").then(({ showToast }) =>
      showToast("Nothing to schedule — every selected draft is already scheduled."),
    );
    return;
  }
  openScheduleModal({
    posts: candidates,
    onConfirm: (_slots) => {
      const set = getScheduled(state.activeBatchRef);
      for (const c of candidates) set.add(c.id);
      renderPanel();
    },
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
      ${state.mode === "drafts" ? raw(renderDraftsView()) : raw(renderIdeasView())}
    </div>
  `;
}

// --- Drafts mode -------------------------------------------------------

function renderDraftsView() {
  const message = lookupActiveMessage();
  if (!message?.drafts?.length) return renderDraftsEmpty();

  const ref = state.activeBatchRef;
  const selected = getSelected(ref, message.drafts);
  const scheduled = getScheduled(ref);
  const total = message.drafts.length;
  const selectedCount = message.drafts.filter((d) => selected.has(d.id) && !scheduled.has(d.id)).length;
  const scheduledCount = message.drafts.filter((d) => scheduled.has(d.id)).length;
  const allScheduled = scheduledCount === total;

  // Group by network. Preserves first-occurrence order so LinkedIn-first
  // sequences read top-to-bottom as the user expects.
  const groups = new Map();
  for (const d of message.drafts) {
    const net = d.network || "linkedin";
    if (!groups.has(net)) groups.set(net, []);
    groups.get(net).push(d);
  }

  const headerSub = [
    `${total} ${total === 1 ? "post" : "posts"}`,
    scheduledCount > 0 ? `${scheduledCount} scheduled` : null,
    selectedCount > 0 && !allScheduled ? `${selectedCount} selected` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const groupBlocks = [...groups.entries()]
    .map(([network, drafts]) => {
      const cards = drafts.map((d) => renderBatchCard(d, selected.has(d.id), scheduled.has(d.id))).join("");
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
        ${raw(
          allScheduled
            ? `<div class="rpanel-drafts__all-scheduled"><i class="ap-icon-check"></i><span>All posts scheduled</span></div>`
            : `<button
                type="button"
                class="ap-button primary orange rpanel-drafts__schedule"
                data-rpanel-schedule
                ${selectedCount === 0 ? "disabled" : ""}
              >
                <i class="ap-icon-calendar"></i>
                <span>Schedule ${selectedCount > 0 ? selectedCount + " " : ""}${selectedCount === 1 ? "post" : "posts"}</span>
              </button>`,
        )}
      </div>
      <div class="rpanel-drafts__body">${raw(groupBlocks)}</div>
    </div>
  `;
}

function renderBatchCard(draft, isSelected, isScheduled = false) {
  const network = draft.network || "linkedin";
  const limit = NETWORK_LIMIT[network] || 3000;
  const text = draft.preview || (Array.isArray(draft.text) ? draft.text.join("\n\n") : draft.text || "");
  const len = text.length;
  const overLimit = len > limit;
  const scheduledPill = isScheduled
    ? `<span class="rpanel-batch-card__sched-pill"><i class="ap-icon-check"></i>Scheduled</span>`
    : "";
  return `
    <div class="rpanel-batch-card ${isSelected ? "is-selected" : ""} ${overLimit ? "is-over" : ""} ${isScheduled ? "is-scheduled" : ""}">
      <div class="rpanel-batch-card__head">
        <button
          type="button"
          class="rpanel-batch-card__check ${isSelected ? "is-on" : ""}"
          data-rpanel-toggle="${draft.id}"
          aria-label="${isSelected ? "Deselect" : "Select"} draft"
          aria-pressed="${isSelected}"
          ${isScheduled ? "disabled" : ""}
        >
          ${isSelected ? '<i class="ap-icon-check"></i>' : ""}
        </button>
        <i class="${NETWORK_ICON[network] || "ap-icon-megaphone"} rpanel-batch-card__network" aria-hidden="true"></i>
        <span class="rpanel-batch-card__network-name">${NETWORK_NAME[network] || network}</span>
        ${scheduledPill}
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

// --- Ideas mode -------------------------------------------------------

function renderIdeasView() {
  return html`
    <div class="rpanel-ideas">
      <div class="rpanel-ideas__head">
        <div class="ap-input-group rpanel-ideas__search">
          <i class="ap-icon-search"></i>
          <input
            type="search"
            class="ap-input"
            placeholder="Search ideas…"
            value="${escapeAttr(ideasQuery)}"
            data-rpanel-ideas-search
          />
        </div>
        <div class="rpanel-ideas__filters" role="tablist">
          ${raw(
            IDEA_KINDS.map(
              (k) => `
                <button
                  type="button"
                  class="rpanel-ideas__filter ${ideasFilter === k.id ? "is-on" : ""}"
                  data-rpanel-ideas-filter="${k.id}"
                  role="tab"
                  aria-selected="${ideasFilter === k.id}"
                >${k.label}</button>
              `,
            ).join(""),
          )}
        </div>
      </div>
      <div class="rpanel-ideas__body" data-rpanel-ideas-body>${raw(renderIdeasList())}</div>
    </div>
  `;
}

function renderIdeasList() {
  const q = ideasQuery.trim().toLowerCase();
  const list = IDEAS.filter((i) => ideasFilter === "all" || i.kind === ideasFilter).filter(
    (i) => !q || (i.body || "").toLowerCase().includes(q) || (i.title || "").toLowerCase().includes(q),
  );
  if (list.length === 0) {
    return html`<div class="rpanel-ideas__no-match">No ideas match.</div>`;
  }
  return list.map((i) => renderIdeaCompact(i)).join("");
}

function renderIdeasBodyOnly() {
  const body = document.querySelector("[data-rpanel-ideas-body]");
  if (body) body.innerHTML = renderIdeasList();
}

function renderIdeaCompact(idea) {
  const kind = idea.kind || "insight";
  const usedLabel = idea.used > 0 ? `Used ${idea.used}×` : "Unused";
  const tags = (idea.tags || [])
    .slice(0, 3)
    .map((t) => `<span class="rpanel-ideas__tag">#${escapeText(t)}</span>`)
    .join("");
  return `
    <article class="rpanel-ideas__card">
      <header class="rpanel-ideas__card-head">
        <span class="ap-tag rpanel-ideas__kind rpanel-ideas__kind--${kind}">${kind}</span>
        <span class="rpanel-ideas__used">${usedLabel}</span>
      </header>
      ${idea.title ? `<div class="rpanel-ideas__card-title">${escapeText(idea.title)}</div>` : ""}
      <p class="rpanel-ideas__card-body">${escapeText(idea.body || "")}</p>
      ${tags ? `<div class="rpanel-ideas__tag-row">${tags}</div>` : ""}
      <footer class="rpanel-ideas__card-foot">
        <span class="rpanel-ideas__ref">${escapeText(idea.ref || "Generated")}</span>
        <button type="button" class="ap-button stroked orange rpanel-ideas__use" data-rpanel-use-idea="${idea.id}">
          <i class="ap-icon-arrow-up"></i>
          <span>Use</span>
        </button>
      </footer>
    </article>
  `;
}

// Inject a templated prompt into the assistant composer of whichever session
// is currently mounted. Closes the panel so the user lands back on the chat
// surface ready to send / tweak.
function useIdea(ideaId) {
  const idea = IDEAS.find((i) => i.id === ideaId);
  if (!idea) return;
  const input = document.getElementById("assistantInput");
  if (!input) return;
  const text = `Build a batch of posts around this ${idea.kind || "idea"}:\n\n"${idea.body}"`;
  input.value = text;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  closePanel();
}

function escapeText(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return escapeText(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
