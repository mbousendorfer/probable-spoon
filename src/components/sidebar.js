import { html, raw } from "../utils.js?v=20";
import { navigate, getPath } from "../router.js?v=20";
import { open as openSettingsDrawer } from "./settings-drawer.js?v=21";
import { recentSessions } from "../mocks.js?v=22";
import { isNewUser } from "../user-mode.js?v=20";

// Global app sidebar — Brand / + New conversation / Recent chats / User footer.
// Rendered once at boot into #sidebar; re-rendered on every route change so the
// active conversation row stays highlighted.

export function initSidebar() {
  const el = document.getElementById("sidebar");
  if (!el) return;
  el.addEventListener("click", (event) => {
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
}

export function renderSidebar() {
  const el = document.getElementById("sidebar");
  if (!el) return;
  const path = getPath();
  const activeSessionId = matchSessionId(path);

  el.innerHTML = html`
    <div class="app-sidebar__head">
      <button type="button" class="app-sidebar__brand" data-sidebar-home aria-label="Go to Archie home">
        <span class="app-sidebar__brand-mark"><i class="ap-icon-sparkles-mermaid"></i></span>
        <span class="app-sidebar__brand-name">Archie</span>
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
