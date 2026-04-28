import { html, raw } from "../utils.js?v=20";
import { navigate, getPath } from "../router.js?v=20";
import { open as openBugReportModal } from "./bug-report-modal.js?v=21";
import { open as openFeedbackModal } from "./feedback-modal.js?v=24";
import { open as openSettingsDrawer } from "./settings-drawer.js?v=22";
import { toggle as toggleShortcutLegend } from "./shortcut-legend.js?v=20";
import { toggleSidebar } from "./sidebar.js?v=22";
import { recentSessions } from "../mocks.js?v=23";

// Persistent top bar.
//
// Lot 2.4 refactor — the Archie brand wordmark moved into the global
// sidebar, so the topbar now carries:
//   • a sidebar-toggle button on the far left (mirrors the sidebar's own
//     collapse button so the chrome stays reachable in any state)
//   • a route-derived title in the center
//   • Feedback / Bug / Help / Settings actions on the right (unchanged)
//
// Context pill + Drafts pill + Ideas pill on the right are deferred to the
// Lots that own those surfaces (Chat re-skin Lot 3, Drafts panel Lot 4,
// Ideas panel Lot 5). Today the topbar is route-aware enough to show the
// title; the pills slot in next without disturbing this scaffold.

export function renderTopbar(_options = {}) {
  const el = document.getElementById("topbar");
  if (!el) return;
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
