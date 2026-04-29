import { html, raw } from "../utils.js?v=20";
import { getPath } from "../router.js?v=20";
import { open as openBugReportModal } from "./bug-report-modal.js?v=21";
import { open as openFeedbackModal } from "./feedback-modal.js?v=24";
import { open as openSettingsDrawer } from "./settings-drawer.js?v=22";
import { toggle as toggleShortcutLegend } from "./shortcut-legend.js?v=20";
import { toggleSidebar } from "./sidebar.js?v=22";
import {
  openDrafts as openDraftsPanel,
  openIdeas as openIdeasPanel,
  closePanel as closeRightPanel,
  getMode as getRightPanelMode,
  getActiveBatchRef as getActiveDraftsBatchRef,
  subscribe as subscribeRightPanel,
} from "./right-panel.js?v=22";
import { getThread, subscribe as subscribeThread } from "../assistant.js?v=22";
import { recentSessions } from "../mocks.js?v=24";

// Persistent top bar.
//
// Layout:
//   • Far left  — sidebar-toggle button (mirrors the sidebar's own collapse
//     control so the chrome stays reachable in any state) + route-derived
//     title
//   • Right     — Drafts pill + Ideas pill (only on /session/:id, drives the
//     right-panel modes), divider, then Feedback / Bug / Help / Settings
//
// The Archie wordmark moved to the global sidebar at Lot 2.1.

export function renderTopbar(_options = {}) {
  const el = document.getElementById("topbar");
  if (!el) return;
  const onSession = isSessionRoute();
  const rpMode = getRightPanelMode();
  const draftCount = onSession ? latestDraftCount() : 0;
  el.innerHTML = html`
    <div class="app-topbar__left">
      <button
        type="button"
        class="ap-icon-button transparent"
        data-topbar-sidebar-toggle
        aria-label="Toggle sidebar (⌘B)"
        title="Toggle sidebar (⌘B)"
      >
        <i class="ap-icon-view-list"></i>
      </button>
      <h1 class="app-topbar__title">${raw(currentTitle())}</h1>
    </div>
    <div class="app-topbar__right">
      ${raw(onSession ? renderSessionPills(rpMode, draftCount) : "")}
      <button type="button" class="app-topbar__feedback" data-topbar-feedback>
        <i class="ap-icon-single-chat-bubble"></i>
        Give feedback
      </button>
      <button type="button" class="ap-button stroked grey" data-topbar-bug>
        <i class="ap-icon-bug"></i>
        <span>Report a bug</span>
      </button>
      <button
        type="button"
        class="ap-icon-button stroked"
        aria-label="Keyboard shortcuts (press ?)"
        data-topbar-shortcuts
      >
        <i class="ap-icon-question"></i>
      </button>
      <button type="button" class="ap-icon-button stroked" aria-label="Settings" data-topbar-settings>
        <i class="ap-icon-cog"></i>
      </button>
    </div>
  `;
}

// Bind once at startup — the topbar DOM node is persistent.
export function initTopbar() {
  const el = document.getElementById("topbar");
  if (!el) return;
  el.addEventListener("click", (event) => {
    if (event.target.closest("[data-topbar-sidebar-toggle]")) {
      toggleSidebar();
      return;
    }
    // Drafts pill — toggle the right panel between Drafts mode and closed.
    // If the panel is open in Ideas mode, switch to Drafts (don't close).
    if (event.target.closest("[data-topbar-drafts]")) {
      const mode = getRightPanelMode();
      if (mode === "drafts") {
        closeRightPanel();
      } else {
        const sessionId = currentSessionId();
        let activeRef = getActiveDraftsBatchRef();
        if (sessionId) {
          const thread = getThread(sessionId);
          const latestDraft = [...thread].reverse().find((m) => m.variant === "draft");
          if (latestDraft) activeRef = { sessionId, messageId: latestDraft.id };
        }
        openDraftsPanel(activeRef);
      }
      return;
    }
    if (event.target.closest("[data-topbar-ideas]")) {
      const mode = getRightPanelMode();
      if (mode === "ideas") closeRightPanel();
      else openIdeasPanel();
      return;
    }
    if (event.target.closest("[data-topbar-feedback]")) {
      openFeedbackModal();
      return;
    }
    if (event.target.closest("[data-topbar-bug]")) {
      openBugReportModal();
      return;
    }
    if (event.target.closest("[data-topbar-shortcuts]")) {
      toggleShortcutLegend();
      return;
    }
    if (event.target.closest("[data-topbar-settings]")) {
      openSettingsDrawer();
    }
  });

  // Re-render the topbar whenever the right panel state changes so the
  // pills reflect the live mode (.is-on accent flips).
  subscribeRightPanel(() => renderTopbar());

  // When the active session's thread updates (new drafts land), re-render
  // so the Drafts pill badge reflects the latest count. Re-attach when the
  // route changes to a different session.
  let lastSessionId = null;
  let unsubscribeThread = null;
  function syncThreadSubscription() {
    const sid = currentSessionId();
    if (sid === lastSessionId) return;
    if (unsubscribeThread) {
      unsubscribeThread();
      unsubscribeThread = null;
    }
    lastSessionId = sid;
    if (sid) {
      unsubscribeThread = subscribeThread(sid, () => renderTopbar());
    }
  }
  syncThreadSubscription();
  window.addEventListener("hashchange", syncThreadSubscription);

  // Global "?" keypress opens the shortcut legend (skipped if user is typing).
  document.addEventListener("keydown", (event) => {
    if (event.key !== "?") return;
    const t = event.target;
    if (
      t instanceof HTMLElement &&
      (t.matches("input, textarea, [contenteditable=true]") || t.closest("[contenteditable=true]"))
    ) {
      return;
    }
    event.preventDefault();
    toggleShortcutLegend();
  });
}

// Drafts + Ideas pills — only on /session/:id. Returned as a plain HTML
// string and wrapped with raw() at the call site so the outer template
// tag doesn't escape the markup.
function renderSessionPills(rpMode, draftCount) {
  const draftBadge = draftCount > 0 ? `<span class="app-topbar__pill-count">${draftCount}</span>` : "";
  return `
    <button
      type="button"
      class="app-topbar__pill ${rpMode === "drafts" ? "is-on" : ""}"
      data-topbar-drafts
      aria-pressed="${rpMode === "drafts"}"
      title="Toggle Drafts panel"
    >
      <i class="ap-icon-pen"></i>
      <span>Drafts</span>
      ${draftBadge}
    </button>
    <button
      type="button"
      class="app-topbar__pill ${rpMode === "ideas" ? "is-on" : ""}"
      data-topbar-ideas
      aria-pressed="${rpMode === "ideas"}"
      title="Toggle Ideas panel"
    >
      <i class="ap-icon-sparkles"></i>
      <span>Ideas</span>
    </button>
    <span class="app-topbar__divider" aria-hidden="true"></span>
  `;
}

// Resolve the latest draft message in the active session (if any) and return
// its count. Used to show the badge on the Drafts pill so the user has a
// visible cue that drafts are waiting in the panel even when it's closed.
function latestDraftCount() {
  const sessionId = currentSessionId();
  if (!sessionId) return 0;
  const thread = getThread(sessionId);
  const latestDraft = [...thread].reverse().find((m) => m.variant === "draft");
  if (!latestDraft) return 0;
  return latestDraft.count ?? latestDraft.drafts?.length ?? 0;
}

function isSessionRoute() {
  return /^\/session\//.test(getPath());
}

function currentSessionId() {
  const m = /^\/session\/([^/?]+)/.exec(getPath());
  return m ? m[1] : null;
}

// Resolve the title shown in the topbar from the current route. Session
// titles fall back to a generic label so /session/new and unknown ids stay
// readable. Anchors back to the dashboard via the sidebar — no need to make
// the topbar title clickable.
function currentTitle() {
  const path = getPath();
  if (path === "/") return "Home";
  if (path === "/sources") return "Sources";
  if (path === "/ideas") return "Ideas";
  if (path === "/contexts") return "Contexts";
  const sessionMatch = /^\/session\/([^/?]+)/.exec(path);
  if (sessionMatch) {
    const id = sessionMatch[1];
    const known = recentSessions.find((s) => s.id === id);
    return known?.name || "New conversation";
  }
  return "Archie";
}
