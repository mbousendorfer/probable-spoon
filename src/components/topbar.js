import { html } from "../utils.js?v=20";
import { navigate } from "../router.js?v=20";
import { open as openBugReportModal } from "./bug-report-modal.js?v=21";
import { open as openFeedbackModal } from "./feedback-modal.js?v=24";
import { open as openSettingsDrawer } from "./settings-drawer.js?v=21";
import { toggle as toggleShortcutLegend } from "./shortcut-legend.js?v=20";

// Persistent top bar. The wireframe shows it on every screen (dashboard, session,
// wizards), so it lives in index.html and is re-rendered on each route change.
//
// Accepts an options object for forward-compat (e.g. callers still pass a
// `crumb` field). Anything passed in is ignored — the topbar only renders the
// brand + action cluster.

export function renderTopbar(_options = {}) {
  const el = document.getElementById("topbar");
  if (!el) return;
  el.innerHTML = html`
    <div class="app-topbar__left">
      <button type="button" class="app-brand" data-topbar-home aria-label="Go to Archie home">
        Archie
        <span class="ap-badge blue">BETA</span>
      </button>
      <button type="button" class="app-topbar__feedback" data-topbar-feedback>
        <i class="ap-icon-single-chat-bubble"></i>
        Give feedback
      </button>
    </div>
    <div class="app-topbar__right">
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
    if (event.target.closest("[data-topbar-home]")) {
      navigate("/");
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
