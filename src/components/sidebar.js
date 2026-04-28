import { html, raw } from "../utils.js?v=20";
import { navigate, getPath } from "../router.js?v=20";
import { open as openSettingsDrawer } from "./settings-drawer.js?v=21";
import { recentSessions } from "../mocks.js?v=22";
import { isNewUser } from "../user-mode.js?v=20";

// Global app sidebar — Brand / + New conversation / Recent chats / User footer.
// Rendered once at boot into #sidebar; re-rendered on every route change so the
// active conversation row stays highlighted.
//
// Collapsed state — driven by the .is-sidebar-collapsed class on #appShell.
// Toggle is exposed via the head button or Cmd/Ctrl+B (cf. initSidebar).
// State persists across reloads via localStorage so the chrome stays predictable.

const COLLAPSED_KEY = "archie-sidebar-collapsed";

export function isSidebarCollapsed() {
  return localStorage.getItem(COLLAPSED_KEY) === "1";
}

export function setSidebarCollapsed(collapsed) {
  const shell = document.getElementById("appShell");
  if (!shell) return;
  shell.classList.toggle("is-sidebar-collapsed", collapsed);
  if (collapsed) localStorage.setItem(COLLAPSED_KEY, "1");
  else localStorage.removeItem(COLLAPSED_KEY);
  // Re-render so the collapsed/expanded chrome swaps without leaving stale
  // pieces (e.g. the brand wordmark) hidden under CSS-only rules.
  renderSidebar();
}

export function toggleSidebar() {
  setSidebarCollapsed(!isSidebarCollapsed());
}

export function initSidebar() {
  const el = document.getElementById("sidebar");
  if (!el) return;

  // Apply persisted collapse state before the first render so we don't flash
  // the expanded layout on boot.
  const shell = document.getElementById("appShell");
  if (shell && isSidebarCollapsed()) shell.classList.add("is-sidebar-collapsed");

  el.addEventListener("click", (event) => {
    if (event.target.closest("[data-sidebar-toggle]")) {
      toggleSidebar();
      return;
    }
    if (event.target.closest("[data-sidebar-home]")) {
      navigate("/");
      return;
    }
    if (event.target.closest("[data-sidebar-new]")) {
      navigate("/session/new");
      return;
    }
    const sessionRow = event.target.closest("[data-sidebar-session]");
    if (sessionRow) {
      navigate(`/session/${sessionRow.dataset.sidebarSession}`);
      return;
    }
    if (event.target.closest("[data-sidebar-settings]")) {
      openSettingsDrawer();
    }
  });

  // Cmd/Ctrl+B toggles the sidebar — matches Claude.ai. Skip the binding when
  // the user is typing into an input/textarea/contenteditable so it never
  // hijacks composer input.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "b" && event.key !== "B") return;
    if (!(event.metaKey || event.ctrlKey)) return;
    const t = event.target;
    if (
      t instanceof HTMLElement &&
      (t.matches("input, textarea, [contenteditable=true]") || t.closest("[contenteditable=true]"))
    ) {
      // Inside an editable surface — let the platform shortcut (e.g. bold) win.
      return;
    }
    event.preventDefault();
    toggleSidebar();
  });
}

export function renderSidebar() {
  const el = document.getElementById("sidebar");
  if (!el) return;
  const path = getPath();
  const activeSessionId = matchSessionId(path);
  const collapsed = isSidebarCollapsed();

  if (collapsed) {
    el.innerHTML = html`
      <div class="app-sidebar__head app-sidebar__head--collapsed">
        <button
          type="button"
          class="ap-icon-button transparent"
          data-sidebar-toggle
          aria-label="Expand sidebar"
          title="Expand sidebar (⌘B)"
        >
          <i class="ap-icon-view-list"></i>
        </button>
      </div>

      <button
        type="button"
        class="app-sidebar__new app-sidebar__new--collapsed"
        data-sidebar-new
        aria-label="New conversation"
        title="New conversation"
      >
        <i class="ap-icon-plus"></i>
      </button>

      <div class="app-sidebar__list-spacer"></div>

      <div class="app-sidebar__foot app-sidebar__foot--collapsed">
        <div class="ap-avatar size-32">MB</div>
        <button
          type="button"
          class="ap-icon-button transparent"
          data-sidebar-settings
          aria-label="Settings"
          title="Settings"
        >
          <i class="ap-icon-cog"></i>
        </button>
      </div>
    `;
    return;
  }

  el.innerHTML = html`
    <div class="app-sidebar__head">
      <button type="button" class="app-sidebar__brand" data-sidebar-home aria-label="Go to Archie home">
        <span class="app-sidebar__brand-mark"><i class="ap-icon-sparkles-mermaid"></i></span>
        <span class="app-sidebar__brand-name">Archie</span>
      </button>
      <button
        type="button"
        class="ap-icon-button transparent"
        data-sidebar-toggle
        aria-label="Collapse sidebar"
        title="Collapse sidebar (⌘B)"
      >
        <i class="ap-icon-chevron-left"></i>
      </button>
    </div>

    <button type="button" class="app-sidebar__new" data-sidebar-new>
      <i class="ap-icon-plus"></i>
      <span>New conversation</span>
    </button>

    <div class="app-sidebar__list" aria-label="Recent conversations">${raw(renderRecentList(activeSessionId))}</div>

    <div class="app-sidebar__foot">
      <div class="app-sidebar__user">
        <div class="ap-avatar size-32">MB</div>
        <div class="app-sidebar__user-meta">
          <span class="app-sidebar__user-name">Matt Bousendorfer</span>
          <span class="app-sidebar__user-plan">Studio · Team</span>
        </div>
        <button type="button" class="ap-icon-button transparent" data-sidebar-settings aria-label="Settings">
          <i class="ap-icon-cog"></i>
        </button>
      </div>
    </div>
  `;
}

function renderRecentList(activeSessionId) {
  if (isNewUser() || recentSessions.length === 0) {
    return html`
      <div class="app-sidebar__empty">
        <span class="app-sidebar__empty-text">No conversations yet</span>
      </div>
    `;
  }
  const heading = html`<div class="app-sidebar__section-heading">Recent</div>`;
  const rows = recentSessions
    .map(
      (s) => `
        <button
          type="button"
          class="app-sidebar__row ${s.id === activeSessionId ? "is-active" : ""}"
          data-sidebar-session="${s.id}"
        >
          <span class="app-sidebar__row-title">${s.name}</span>
          <span class="app-sidebar__row-meta">${s.lastActivity}</span>
        </button>
      `,
    )
    .join("");
  return heading + rows;
}

function matchSessionId(path) {
  const m = /^\/session\/([^/?]+)/.exec(path);
  return m ? m[1] : null;
}
