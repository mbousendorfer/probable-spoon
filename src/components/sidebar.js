import { html, raw } from "../utils.js?v=20";
import { navigate, getPath } from "../router.js?v=20";
import { open as openSettingsDrawer } from "./settings-drawer.js?v=22";
import { open as openBugReportModal } from "./bug-report-modal.js?v=21";
import { open as openFeedbackModal } from "./feedback-modal.js?v=24";
import { toggle as toggleShortcutLegend } from "./shortcut-legend.js?v=22";
import { recentSessions } from "../mocks.js?v=24";
import { isNewUser } from "../user-mode.js?v=20";

// Global app sidebar — Brand / + New conversation / Recent chats / User footer.
// Rendered once at boot into #sidebar; re-rendered on every route change so the
// active conversation row stays highlighted.
//
// Collapsed state — driven by the .is-sidebar-collapsed class on #appShell.
// Toggle is exposed via the head button or Cmd/Ctrl+B (cf. initSidebar).
// State persists across reloads via localStorage so the chrome stays predictable.
//
// Footer popmenu (Lot 11) — the user-row's trailing button is now a popmenu
// trigger that exposes Send feedback / Report a bug / Keyboard shortcuts /
// Settings. The topbar dropped these chrome buttons in Lot 11 ; the sidebar
// foot is the single canonical place to reach them.

const COLLAPSED_KEY = "archie-sidebar-collapsed";

let menuOpen = false;

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

function setMenuOpen(open) {
  menuOpen = open;
  const popmenu = document.querySelector("[data-sidebar-foot-menu]");
  const trigger = document.querySelector("[data-sidebar-foot-toggle]");
  if (popmenu) popmenu.hidden = !open;
  if (trigger) trigger.setAttribute("aria-expanded", String(open));
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
    const navItem = event.target.closest("[data-sidebar-nav]");
    if (navItem) {
      navigate(navItem.dataset.sidebarNav);
      return;
    }
    const sessionRow = event.target.closest("[data-sidebar-session]");
    if (sessionRow) {
      navigate(`/session/${sessionRow.dataset.sidebarSession}`);
      return;
    }
    // Footer popmenu — toggle on the trigger, dispatch on item click.
    if (event.target.closest("[data-sidebar-foot-toggle]")) {
      setMenuOpen(!menuOpen);
      return;
    }
    if (event.target.closest("[data-sidebar-feedback]")) {
      setMenuOpen(false);
      openFeedbackModal();
      return;
    }
    if (event.target.closest("[data-sidebar-bug]")) {
      setMenuOpen(false);
      openBugReportModal();
      return;
    }
    if (event.target.closest("[data-sidebar-shortcuts]")) {
      setMenuOpen(false);
      toggleShortcutLegend();
      return;
    }
    if (event.target.closest("[data-sidebar-settings]")) {
      setMenuOpen(false);
      openSettingsDrawer();
    }
  });

  // Click outside the popmenu → close.
  document.addEventListener("click", (event) => {
    if (!menuOpen) return;
    if (event.target.closest("[data-sidebar-foot-menu], [data-sidebar-foot-toggle]")) return;
    setMenuOpen(false);
  });

  // Cmd/Ctrl+B toggles the sidebar — matches Claude.ai. Skip the binding when
  // the user is typing into an input/textarea/contenteditable so it never
  // hijacks composer input.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuOpen) {
      setMenuOpen(false);
      return;
    }
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
  // Re-rendering tears down the popmenu DOM, so reset the local state to
  // match. Any open menu has to be re-opened with a fresh click.
  menuOpen = false;
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
        ${raw(renderFootMenu({ collapsed: true }))}
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

    <nav class="app-sidebar__nav" aria-label="Library">${raw(renderNav(path))}</nav>

    <div class="app-sidebar__list" aria-label="Recent conversations">${raw(renderRecentList(activeSessionId))}</div>

    <div class="app-sidebar__foot">
      <div class="app-sidebar__user">
        <div class="ap-avatar size-32">MB</div>
        <div class="app-sidebar__user-meta">
          <span class="app-sidebar__user-name">Matt Bousendorfer</span>
          <span class="app-sidebar__user-plan">Studio · Team</span>
        </div>
        ${raw(renderFootMenu({ collapsed: false }))}
      </div>
    </div>
  `;
}

// Footer popmenu — trigger button + popmenu list. The popmenu lives in the
// DOM but is hidden until the user clicks the trigger. Items dispatch to
// the existing modal/drawer/legend handlers at the top of initSidebar.
function renderFootMenu({ collapsed }) {
  // Pop the menu UPWARDS from the trigger so it doesn't get cut off by the
  // viewport's bottom edge.
  return `
    <div class="app-sidebar__foot-popmenu-wrap">
      <button
        type="button"
        class="ap-icon-button transparent"
        data-sidebar-foot-toggle
        aria-haspopup="menu"
        aria-expanded="false"
        aria-label="More options"
        title="More options"
      >
        <i class="ap-icon-cog"></i>
      </button>
      <div
        class="app-sidebar__foot-popmenu ${collapsed ? "app-sidebar__foot-popmenu--collapsed" : ""}"
        role="menu"
        data-sidebar-foot-menu
        hidden
      >
        <button type="button" role="menuitem" class="app-sidebar__foot-item" data-sidebar-feedback>
          <i class="ap-icon-single-chat-bubble"></i>
          <span>Send feedback</span>
        </button>
        <button type="button" role="menuitem" class="app-sidebar__foot-item" data-sidebar-bug>
          <i class="ap-icon-bug"></i>
          <span>Report a bug</span>
        </button>
        <button type="button" role="menuitem" class="app-sidebar__foot-item" data-sidebar-shortcuts>
          <i class="ap-icon-question"></i>
          <span>Keyboard shortcuts</span>
          <kbd class="app-sidebar__foot-kbd">?</kbd>
        </button>
        <hr class="app-sidebar__foot-divider" />
        <button type="button" role="menuitem" class="app-sidebar__foot-item" data-sidebar-settings>
          <i class="ap-icon-cog"></i>
          <span>Settings</span>
        </button>
      </div>
    </div>
  `;
}

// Library nav — 4 items pointing at the dashboard + the standalone Sources /
// Ideas / Contexts views. The active item is derived from the path prefix so
// /session/* still highlights "Chats". The full views land in Lots 6/7/8;
// today the targets are placeholders.
const NAV = [
  {
    path: "/",
    icon: "ap-icon-double-chat-bubbles",
    label: "Chats",
    match: (p) => p === "/" || p.startsWith("/session/"),
  },
  { path: "/sources", icon: "ap-icon-folder", label: "Sources", match: (p) => p === "/sources" },
  { path: "/ideas", icon: "ap-icon-sparkles", label: "Ideas", match: (p) => p === "/ideas" },
  { path: "/contexts", icon: "ap-icon-target", label: "Contexts", match: (p) => p === "/contexts" },
];

function renderNav(path) {
  return NAV.map(
    (item) => `
      <button
        type="button"
        class="app-sidebar__nav-item ${item.match(path) ? "is-active" : ""}"
        data-sidebar-nav="${item.path}"
      >
        <i class="${item.icon}"></i>
        <span>${item.label}</span>
      </button>
    `,
  ).join("");
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
