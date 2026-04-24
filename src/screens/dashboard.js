import { html, raw } from "../utils.js?v=17";
import { navigate } from "../router.js?v=17";
import { renderTopbar } from "../components/topbar.js?v=17";
import { recentSessions, templateStarters, sources, ideas, contexts, contextComponentsFor } from "../mocks.js?v=17";
import { isNewUser } from "../user-mode.js?v=17";
import { renderSourceCard } from "../components/source-card.js?v=17";
import { renderIdeaCard } from "../components/idea-card.js?v=17";

// Dashboard — one URL (#/), multiple state variants encoded in URL params so
// screens like "Projects · Library" vs "Global Contexts" stay shareable.
//
// Params:
//   tab       "projects" (default) | "contexts"
//   subtab    "library" (default) | "ideas"
//   ctx       "none" (default) | "auto"   — affects the "New project" form on the left
//
// The wireframe shows these combinations as the 4 Start Screen variants.

function readQuery() {
  const raw = window.location.hash.split("?")[1] || "";
  const params = new URLSearchParams(raw);
  return {
    tab: params.get("tab") || "projects",
    subtab: params.get("subtab") || "library",
    ctx: params.get("ctx") || "none",
  };
}

function setQuery(next) {
  const current = readQuery();
  const merged = { ...current, ...next };
  const qs = new URLSearchParams(merged).toString();
  window.location.hash = `#/?${qs}`;
}

export function renderDashboard(_params, target) {
  renderTopbar();
  const q = readQuery();

  target.innerHTML = html`
    <section class="screen screen--split dashboard">
      <aside class="dashboard__sidebar">${raw(renderNewProjectCard(q))} ${raw(renderTemplateStarters())}</aside>
      <section class="dashboard__main">
        ${raw(renderMainTabs(q))} ${raw(q.tab === "contexts" ? renderContextsPanel() : renderProjectsPanel(q))}
      </section>
    </section>
  `;

  bindDashboard(target);
}

function renderNewProjectCard(q) {
  // The "Context" select encodes whether a context is pre-attached or created on the fly.
  const ctxOpt = (value, label) => `<option value="${value}" ${q.ctx === value ? "selected" : ""}>${label}</option>`;

  return html`
    <div class="ap-card dashboard__new-project">
      <h3 class="ap-card-title">New project</h3>
      <div class="ap-form-field">
        <label>Project name</label>
        <div class="ap-input-group">
          <input placeholder="e.g. Q2 launch drumbeat" data-new-project-name />
        </div>
      </div>
      <div class="ap-form-field">
        <label>Context</label>
        <select class="ap-native-select" data-new-project-context>
          ${raw(ctxOpt("none", "No context — create one for this project"))}
          ${raw(ctxOpt("voice", "Use my voice profile"))} ${raw(ctxOpt("brief", "Use my strategy brief"))}
          ${raw(ctxOpt("brand", "Use my brand theme"))}
        </select>
      </div>
      <button type="button" class="ap-button primary orange" data-new-project-create>Create</button>
    </div>
  `;
}

function renderTemplateStarters() {
  return html`
    <div class="ap-card dashboard__templates">
      <h3 class="ap-card-title">Template starters</h3>
      <ul class="dashboard__templates-list">
        ${raw(
          templateStarters
            .map(
              (t) => `
                <li>
                  <button type="button" class="dashboard__template" data-template-id="${t.id}">
                    <span class="dashboard__template-name">${t.name}</span>
                    <span class="dashboard__template-desc">${t.description}</span>
                  </button>
                </li>
              `,
            )
            .join(""),
        )}
      </ul>
    </div>
  `;
}

function renderMainTabs(q) {
  const projectsCount = isNewUser() ? 0 : recentSessions.length;
  const contextsCount = isNewUser() ? 0 : contexts.length;
  return html`
    <div class="ap-tabs dashboard__main-tabs">
      <div class="ap-tabs-nav">
        <button type="button" class="ap-tabs-tab ${q.tab === "projects" ? "active" : ""}" data-main-tab="projects">
          <i class="ap-icon-folder"></i>
          <span>Projects</span>
          <span class="ap-counter normal ${q.tab === "projects" ? "blue" : "grey"}"> ${projectsCount} </span>
        </button>
        <button type="button" class="ap-tabs-tab ${q.tab === "contexts" ? "active" : ""}" data-main-tab="contexts">
          <i class="ap-icon-sparkles"></i>
          <span>Global contexts</span>
          <span class="ap-counter normal ${q.tab === "contexts" ? "blue" : "grey"}">${contextsCount}</span>
        </button>
      </div>
    </div>
  `;
}

// ---- Projects tab -------------------------------------------------------------

function renderProjectsPanel(q) {
  if (isNewUser()) {
    return html`
      <div class="dashboard__panel">
        <div class="ap-card dashboard__first-run">
          <div class="dashboard__first-run-icon">
            <i class="ap-icon-sparkles-mermaid md"></i>
          </div>
          <div class="grow stack-sm">
            <h2 class="text-subtitle">Welcome to Archie</h2>
            <p class="muted">
              You don't have any projects yet. Start one from the form on the left, or pick a template starter to
              prefill it.
            </p>
          </div>
        </div>
      </div>
    `;
  }
  return html`
    <div class="dashboard__panel">
      ${raw(renderRecentSessions())} ${raw(renderProjectsSubtabs(q))}
      ${raw(q.subtab === "ideas" ? renderIdeasBody() : renderLibraryBody())}
    </div>
  `;
}

function renderRecentSessions() {
  const cards = recentSessions
    .map(
      (s) => `
        <button type="button" class="ap-card dashboard__session-card" data-open-session="${s.id}">
          <div class="dashboard__session-card-head">
            <span class="dashboard__session-name">${s.name}</span>
            ${
              s.hasContext
                ? '<span class="ap-status blue">Context attached</span>'
                : '<span class="ap-status grey">No context</span>'
            }
          </div>
          <div class="dashboard__session-meta muted">
            <span>${s.sourceCount} sources</span>
            <span>·</span>
            <span>${s.ideaCount} ideas</span>
            <span>·</span>
            <span>${s.postCount} posts</span>
            <span>·</span>
            <span>${s.lastActivity}</span>
          </div>
        </button>
      `,
    )
    .join("");

  return html`
    <section class="dashboard__section">
      <div class="row-between">
        <h2 class="text-section">Your recent sessions</h2>
        <a class="ap-link small" href="#/">View all →</a>
      </div>
      <div class="dashboard__session-grid">${raw(cards)}</div>
    </section>
  `;
}

function renderProjectsSubtabs(q) {
  return html`
    <div class="ap-tabs dashboard__subtabs">
      <div class="ap-tabs-nav">
        <button type="button" class="ap-tabs-tab ${q.subtab === "ideas" ? "active" : ""}" data-subtab="ideas">
          <span>Content ideas</span>
          <span class="ap-counter normal ${q.subtab === "ideas" ? "blue" : "grey"}"> ${ideas.length} </span>
        </button>
        <button type="button" class="ap-tabs-tab ${q.subtab === "library" ? "active" : ""}" data-subtab="library">
          <span>Library</span>
          <span class="ap-counter normal ${q.subtab === "library" ? "blue" : "grey"}"> ${sources.length} </span>
        </button>
      </div>
    </div>
  `;
}

function renderLibraryBody() {
  return html`
    <section class="dashboard__section">
      <div class="row-between">
        <h2 class="text-section">Library</h2>
        <button type="button" class="ap-button stroked blue">
          <i class="ap-icon-plus"></i>
          <span>Add source</span>
        </button>
      </div>
      <div class="stack-sm">${raw(sources.map((s) => renderSourceCard(s, ideas)).join(""))}</div>
    </section>
  `;
}

function renderIdeasBody() {
  return html`
    <section class="dashboard__section">
      <div class="row-between">
        <h2 class="text-section">Content ideas</h2>
        <a class="ap-link small" href="#/?tab=projects&subtab=ideas">View all ${ideas.length} ideas →</a>
      </div>
      <div class="stack-sm">${raw(ideas.map((i) => renderIdeaCard(i, sources)).join(""))}</div>
    </section>
  `;
}

// ---- Global contexts tab ------------------------------------------------------

function renderContextsPanel() {
  const availableContexts = isNewUser() ? [] : contexts;

  const rows = availableContexts.length
    ? availableContexts
        .map(
          (c) => `
            <div class="ap-card dashboard__context-row">
              <div class="dashboard__context-left">
                <i class="ap-icon-sparkles-mermaid md"></i>
                <div class="stack-sm">
                  <span class="dashboard__context-title">${c.name}</span>
                  <span class="muted">${contextComponentsFor(c).join(" · ")} · Updated ${c.updatedAt}</span>
                </div>
              </div>
              <div class="dashboard__context-actions">
                <button type="button" class="ap-button stroked grey" data-open-context="${c.id}">
                  <i class="ap-icon-pen"></i>
                  <span>Edit</span>
                </button>
                <button type="button" class="ap-icon-button stroked" aria-label="More actions">
                  <i class="ap-icon-more"></i>
                </button>
              </div>
            </div>
          `,
        )
        .join("")
    : `<p class="muted">No saved contexts yet — create your first one above.</p>`;

  return html`
    <div class="dashboard__panel">
      <section class="dashboard__section">
        <div class="ap-card dashboard__context-create">
          <div class="dashboard__context-create-icon">
            <i class="ap-icon-sparkles md"></i>
          </div>
          <div class="grow stack-sm">
            <h3 class="text-subtitle">Create a new context</h3>
            <p class="muted">
              Teach Archie how you write, what you're building, and how your brand looks. Contexts can be reused across
              projects.
            </p>
          </div>
          <button type="button" class="ap-button primary orange" data-create-context>Create context</button>
        </div>
      </section>
      <section class="dashboard__section">
        <h2 class="text-section">Available contexts</h2>
        <div class="stack-sm">${raw(rows)}</div>
      </section>
    </div>
  `;
}

// ---- Wiring -------------------------------------------------------------------

function bindDashboard(root) {
  root.addEventListener("click", (event) => {
    const mainTab = event.target.closest("[data-main-tab]");
    if (mainTab) {
      setQuery({ tab: mainTab.dataset.mainTab });
      return;
    }

    const subtab = event.target.closest("[data-subtab]");
    if (subtab) {
      setQuery({ subtab: subtab.dataset.subtab });
      return;
    }

    const openSession = event.target.closest("[data-open-session]");
    if (openSession) {
      navigate(`/session/${openSession.dataset.openSession}`);
      return;
    }

    if (event.target.closest("[data-new-project-create]")) {
      // In the prototype, all new projects land on the same empty session.
      navigate("/session/new");
      return;
    }

    if (event.target.closest("[data-create-context]")) {
      navigate("/analyse");
      return;
    }

    const openContext = event.target.closest("[data-open-context]");
    if (openContext) {
      navigate(`/analyse?contextId=${openContext.dataset.openContext}`);
      return;
    }

    // Source-card actions on the Library tab — open the default session
    // and land in the right tab.
    const defaultSessionId = recentSessions[0]?.id || "new";
    const sourceIdeaBtn = event.target.closest("[data-source-idea]");
    if (sourceIdeaBtn) {
      event.preventDefault();
      navigate(`/session/${defaultSessionId}?tab=ideas&focusIdea=${sourceIdeaBtn.dataset.sourceIdea}`);
      return;
    }
    if (event.target.closest("[data-source-view]")) {
      event.preventDefault();
      navigate(`/session/${defaultSessionId}?tab=ideas`);
      return;
    }
    if (event.target.closest("[data-source-ask]")) {
      event.preventDefault();
      navigate(`/session/${defaultSessionId}?tab=posts`);
      return;
    }
    if (event.target.closest("[data-source-extract]")) {
      event.preventDefault();
      navigate(`/session/${defaultSessionId}?tab=library`);
      return;
    }
    if (event.target.closest("[data-source-more]")) {
      event.preventDefault();
      return;
    }

    // Idea-card actions on the Content ideas tab — "Open idea" routes into
    // the default session's Content ideas tab with focus; pin toggles the
    // icon state on-card; others no-op.
    const openIdeaBtn = event.target.closest("[data-idea-open]");
    if (openIdeaBtn) {
      event.preventDefault();
      navigate(`/session/${defaultSessionId}?tab=ideas&focusIdea=${openIdeaBtn.dataset.ideaOpen}`);
      return;
    }
    const pinBtn = event.target.closest("[data-idea-pin]");
    if (pinBtn) {
      event.preventDefault();
      const wasActive = pinBtn.classList.contains("is-active");
      pinBtn.classList.toggle("is-active", !wasActive);
      pinBtn.setAttribute("aria-pressed", wasActive ? "false" : "true");
      pinBtn.setAttribute("aria-label", wasActive ? "Pin idea" : "Unpin idea");
      return;
    }
    if (event.target.closest("[data-idea-generate]") || event.target.closest("[data-idea-more]")) {
      event.preventDefault();
      return;
    }
  });

  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-new-project-context]")) {
      setQuery({ ctx: event.target.value === "none" ? "none" : "auto" });
    }
  });
}
