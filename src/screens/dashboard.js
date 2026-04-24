import { html, raw } from "../utils.js?v=20";
import { navigate } from "../router.js?v=20";
import { renderTopbar } from "../components/topbar.js?v=20";
import {
  createPostFromIdea,
  recentSessions,
  templateStarters,
  sources,
  ideas,
  contexts,
  contextComponentsFor,
} from "../mocks.js?v=20";
import { isNewUser } from "../user-mode.js?v=20";
import { renderSourceCard } from "../components/source-card.js?v=20";
import { renderIdeaCard } from "../components/idea-card.js?v=20";

// Dashboard — one URL (#/), multiple state variants encoded in URL params so
// screens like "Projects · Library" vs "Global Contexts" stay shareable.
//
// Params:
//   tab       "projects" (default) | "contexts"
//   subtab    "library" (default) | "ideas"
//   ctx       "none" (default) | "voice" | "brief" | "brand"
//
// The wireframe shows these combinations as the 4 Start Screen variants.

function readQuery() {
  const raw = window.location.hash.split("?")[1] || "";
  const params = new URLSearchParams(raw);
  // Back-compat: `subtab=library` or `subtab=ideas` → merged `content`
  // tab with the corresponding inner view.
  let view = params.get("view") || "sources";
  const subtab = params.get("subtab");
  if (subtab === "ideas") view = "ideas";
  return {
    tab: params.get("tab") || "projects",
    ctx: params.get("ctx") || "none",
    title: params.get("title") || "",
    view,
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
          <input placeholder="e.g. Q2 launch drumbeat" data-new-project-name value="${q.title}" />
        </div>
        <p class="dashboard__form-error" data-new-project-error hidden>Give this project a name before creating it.</p>
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
  return html` <div class="dashboard__panel">${raw(renderRecentSessions())} ${raw(renderContentSection(q))}</div> `;
}

function renderContentSection(q) {
  const view = q.view === "ideas" ? "ideas" : "sources";
  const body =
    view === "ideas"
      ? `<div class="stack-sm">${ideas.map((i) => renderIdeaCard(i, sources)).join("")}</div>`
      : `<div class="stack-sm">${sources.map((s) => renderSourceCard(s, ideas)).join("")}</div>`;
  return html`
    <section class="dashboard__section">
      <div class="row-between">
        <h2 class="text-section">Content</h2>
        <button type="button" class="ap-button stroked blue" data-dashboard-add-source>
          <i class="ap-icon-plus"></i>
          <span>Add source</span>
        </button>
      </div>
      ${raw(renderContentViewTabs(q))} ${raw(body)}
    </section>
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

function renderContentViewTabs(q) {
  const view = q.view === "ideas" ? "ideas" : "sources";
  return html`
    <div class="ap-tabs dashboard__subtabs">
      <div class="ap-tabs-nav">
        <button type="button" class="ap-tabs-tab ${view === "sources" ? "active" : ""}" data-content-view="sources">
          <i class="ap-icon-feature-library"></i>
          <span>By source</span>
          <span class="ap-counter normal ${view === "sources" ? "blue" : "grey"}">${sources.length}</span>
        </button>
        <button type="button" class="ap-tabs-tab ${view === "ideas" ? "active" : ""}" data-content-view="ideas">
          <i class="ap-icon-sparkles"></i>
          <span>All ideas</span>
          <span class="ap-counter normal ${view === "ideas" ? "blue" : "grey"}">${ideas.length}</span>
        </button>
      </div>
    </div>
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

    const contentView = event.target.closest("[data-content-view]");
    if (contentView) {
      setQuery({ tab: "projects", view: contentView.dataset.contentView });
      return;
    }

    const openSession = event.target.closest("[data-open-session]");
    if (openSession) {
      navigate(`/session/${openSession.dataset.openSession}`);
      return;
    }

    const templateBtn = event.target.closest("[data-template-id]");
    if (templateBtn) {
      const template = templateStarters.find((t) => t.id === templateBtn.dataset.templateId);
      if (template) {
        const nameInput = root.querySelector("[data-new-project-name]");
        const contextSelect = root.querySelector("[data-new-project-context]");
        const title = `${template.name} project`;
        if (nameInput) nameInput.value = title;
        if (contextSelect) contextSelect.value = template.id === "tpl-launch" ? "brand" : "voice";
        setQuery({
          tab: "projects",
          title,
          ctx: contextSelect?.value || "voice",
        });
      }
      return;
    }

    if (event.target.closest("[data-new-project-create]")) {
      const nameInput = root.querySelector("[data-new-project-name]");
      const contextSelect = root.querySelector("[data-new-project-context]");
      const error = root.querySelector("[data-new-project-error]");
      const title = nameInput?.value.trim() || "";
      if (!title) {
        if (error) error.hidden = false;
        nameInput?.focus();
        return;
      }
      if (error) error.hidden = true;
      const contextId = contextIdForNewProject(contextSelect?.value || "none");
      const qs = new URLSearchParams({ tab: "posts", title });
      if (contextId) qs.set("contextId", contextId);
      navigate(`/session/new?${qs.toString()}`);
      return;
    }

    if (event.target.closest("[data-dashboard-add-source]")) {
      navigate(`/session/${recentSessions[0]?.id || "new"}?tab=content&view=sources`);
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

    // Source-card actions on the Content section — open the default session
    // and land in the right tab. The card now exposes three actions:
    // "Ask" → posts tab, "View all N ideas" → All ideas view, more → no-op.
    const defaultSessionId = recentSessions[0]?.id || "new";
    if (event.target.closest("[data-source-view]")) {
      event.preventDefault();
      navigate(`/session/${defaultSessionId}?tab=content&view=ideas`);
      return;
    }
    if (event.target.closest("[data-source-ask]")) {
      event.preventDefault();
      navigate(`/session/${defaultSessionId}?tab=posts`);
      return;
    }
    if (event.target.closest("[data-source-more]")) {
      event.preventDefault();
      return;
    }

    // Idea-card source link doubles as "Open idea" — jump to the default
    // session's All ideas view with focus on that idea. Pin + more-menu
    // behavior is encapsulated inside src/components/idea-card.js.
    const openIdeaBtn = event.target.closest("[data-idea-open]");
    if (openIdeaBtn) {
      event.preventDefault();
      navigate(`/session/${defaultSessionId}?tab=content&view=ideas&focusIdea=${openIdeaBtn.dataset.ideaOpen}`);
      return;
    }
    if (event.target.closest("[data-idea-generate]")) {
      event.preventDefault();
      const ideaId = event.target.closest("[data-idea-generate]")?.dataset.ideaGenerate;
      const idea = ideas.find((i) => i.id === ideaId);
      if (idea) {
        const post = createPostFromIdea(
          idea,
          sources.find((s) => s.id === idea.sourceId),
        );
        navigate(`/session/${defaultSessionId}?tab=posts&focusPost=${post.id}`);
      }
      return;
    }
  });

  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-new-project-context]")) {
      setQuery({ ctx: event.target.value || "none" });
    }
  });

  root.addEventListener("input", (event) => {
    if (event.target.matches("[data-new-project-name]")) {
      const error = root.querySelector("[data-new-project-error]");
      if (error && event.target.value.trim()) error.hidden = true;
    }
  });
}

function contextIdForNewProject(value) {
  if (value === "voice") return "ctx-founder-voice";
  if (value === "brief" || value === "brand") return "ctx-acme";
  return "";
}
