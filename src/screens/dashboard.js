import { html, raw } from "../utils.js?v=20";
import { navigate } from "../router.js?v=20";
import { renderTopbar } from "../components/topbar.js?v=21";
import { open as openSettingsDrawer } from "../components/settings-drawer.js?v=21";
import { open as openChatPickerModal } from "../components/chat-picker-modal.js?v=20";
import { open as openAddSourceModal } from "../components/add-source-modal.js?v=20";
import { recentSessions, templateStarters, ideas, contextIdForNewProject, contextNameFor } from "../mocks.js?v=22";
import { getSources, subscribeSources } from "../sources-stream.js?v=20";
import { isNewUser } from "../user-mode.js?v=20";
import { renderSourceCard } from "../components/source-card.js?v=22";
import { renderIdeaCard } from "../components/idea-card.js?v=23";
import {
  contentState,
  renderContentWorkspace as renderSharedContentWorkspace,
  rerenderContentWorkspaceBody,
  renderContentEmptyState,
} from "../components/content-workspace.js?v=20";

// Dashboard — one URL (#/), state variants encoded in URL params so URLs
// like "Projects · Ideas" stay shareable.
//
// Params:
//   ctx       "none" (default) | "voice" | "brief" | "brand"
//   view      "sources" (default) | "ideas"   — Content section sub-view
//
// (The previous "Global contexts" main tab was lifted out — contexts now
// live behind the Settings entry in the sidebar.)

function readQuery() {
  const raw = window.location.hash.split("?")[1] || "";
  const params = new URLSearchParams(raw);
  return {
    ctx: params.get("ctx") || "none",
    title: params.get("title") || "",
    view: params.get("view") || "sources",
  };
}

function setQuery(next) {
  const current = readQuery();
  const merged = { ...current, ...next };
  const qs = new URLSearchParams(merged).toString();
  window.location.hash = `#/?${qs}`;
}

// Cleared and reset on every renderDashboard so subscriptions don't pile up
// across navigations.
let unsubscribeSources = null;

export function renderDashboard(_params, target) {
  renderTopbar();
  const q = readQuery();

  if (unsubscribeSources) {
    unsubscribeSources();
    unsubscribeSources = null;
  }

  target.innerHTML = html`
    <section class="screen screen--split dashboard">
      <aside class="dashboard__sidebar">
        ${raw(renderNewProjectCard(q))} ${raw(renderPreviousChats())} ${raw(renderTemplateStarters())}
        ${raw(renderSidebarSettings())}
      </aside>
      <section class="dashboard__main">${raw(renderProjectsPanel(q))}</section>
    </section>
  `;

  bindDashboard(target);

  // Re-render only the Content panel when the sources stream changes — keeps
  // the sidebar and the workspace tabs steady while uploads progress.
  unsubscribeSources = subscribeSources(() => {
    if (isNewUser()) return;
    const main = target.querySelector(".dashboard__main");
    if (main) main.innerHTML = renderProjectsPanel(readQuery());
  });
}

function renderNewProjectCard(q) {
  // The "Context" select encodes whether a context is pre-attached or created on the fly.
  const ctxOpt = (value, label) => `<option value="${value}" ${q.ctx === value ? "selected" : ""}>${label}</option>`;

  return html`
    <div class="ap-card dashboard__new-project">
      <h3 class="ap-card-title">New chat</h3>
      <div class="ap-form-field">
        <label>Chat name (optional)</label>
        <div class="ap-input-group">
          <input placeholder="e.g. Q2 launch drumbeat" data-new-project-name value="${q.title}" />
        </div>
        <p class="dashboard__form-hint muted">
          Archie will name it from the conversation, or fall back to the date and time.
        </p>
      </div>
      <div class="ap-form-field">
        <label>Context</label>
        <select class="ap-native-select" data-new-project-context>
          ${raw(ctxOpt("none", "No context — create one for this project"))}
          ${raw(ctxOpt("voice", "Use my voice profile"))} ${raw(ctxOpt("brief", "Use my strategy brief"))}
          ${raw(ctxOpt("brand", "Use my brand theme"))}
        </select>
      </div>
      <button type="button" class="ap-button primary orange" data-new-project-create>New chat</button>
    </div>
  `;
}

function renderPreviousChats() {
  if (isNewUser() || !recentSessions.length) return "";
  const items = recentSessions
    .map(
      (s) => `
        <button type="button" class="dashboard__chat" data-open-session="${s.id}">
          <span class="dashboard__chat-name">${s.name}</span>
          <span class="dashboard__chat-meta">
            ${s.sourceCount} sources · ${s.ideaCount} ideas · ${s.postCount} posts · ${s.lastActivity}
          </span>
        </button>
      `,
    )
    .join("");
  return html`
    <section class="dashboard__chats-section">
      <h3 class="dashboard__chats-heading">Previous chats</h3>
      <div class="dashboard__chats-list">${raw(items)}</div>
    </section>
  `;
}

function renderSidebarSettings() {
  return html`
    <div class="dashboard__settings">
      <button type="button" class="ap-button transparent grey" data-open-settings>
        <i class="ap-icon-cog"></i>
        <span>Settings</span>
      </button>
    </div>
  `;
}

function renderTemplateStarters() {
  return html`
    <section class="dashboard__templates-section">
      <header class="dashboard__templates-header">
        <h3 class="dashboard__templates-title">Workflow templates</h3>
        <p class="dashboard__templates-tagline">Use one of these actions to quickly draft some posts</p>
      </header>
      <ul class="dashboard__templates-list">
        ${raw(
          templateStarters
            .map(
              (t) => `
                <li>
                  <button type="button" class="dashboard__template" data-template-id="${t.id}">
                    <span class="dashboard__template-text">
                      <span class="dashboard__template-name">${t.name}</span>
                      <span class="dashboard__template-desc">${t.description}</span>
                    </span>
                    <i class="ap-icon-arrow-right dashboard__template-arrow" aria-hidden="true"></i>
                  </button>
                </li>
              `,
            )
            .join(""),
        )}
      </ul>
    </section>
  `;
}

// ---- Main panel — Content section -----------------------------------------

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
  return html` <div class="dashboard__panel">${raw(renderContentSection(q))}</div> `;
}

function renderContentSection(q) {
  const sources = getSources();
  // Same Content workspace as the in-session Content tab: header with count
  // meta + the dashboard-only "+ Add source" button, search + sort toolbar,
  // By source / All ideas tabs, body of cards.
  const addSourceButton = `
    <button type="button" class="ap-button stroked blue" data-dashboard-add-source>
      <i class="ap-icon-plus"></i>
      <span>Add source</span>
    </button>
  `;
  if (sources.length === 0 && ideas.length === 0) {
    return renderContentEmptyState({ actionHtml: addSourceButton });
  }
  const view = q.view === "ideas" ? "ideas" : "sources";
  return renderSharedContentWorkspace({ sources, ideas, view, headerActions: addSourceButton });
}

// ---- Wiring -------------------------------------------------------------------

function bindDashboard(root) {
  root.addEventListener("click", (event) => {
    const contentView = event.target.closest("[data-content-view]");
    if (contentView) {
      setQuery({ view: contentView.dataset.contentView });
      return;
    }

    const openSession = event.target.closest("[data-open-session]");
    if (openSession) {
      navigate(`/session/${openSession.dataset.openSession}`);
      return;
    }

    if (event.target.closest("[data-open-settings]")) {
      openSettingsDrawer();
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
          title,
          ctx: contextSelect?.value || "voice",
        });
      }
      return;
    }

    if (event.target.closest("[data-new-project-create]")) {
      const nameInput = root.querySelector("[data-new-project-name]");
      const contextSelect = root.querySelector("[data-new-project-context]");
      // Name is optional. When the user leaves it blank we fall back to a
      // date+time stamp; the eventual product behavior will rename the chat
      // from the conversation content once it has enough material.
      const typed = nameInput?.value.trim() || "";
      const title = typed || defaultChatName();
      const contextValue = contextSelect?.value || "none";
      const contextId = contextIdForNewProject(contextValue);
      const qs = new URLSearchParams({ tab: "posts", title });
      if (contextId) qs.set("contextId", contextId);
      // Hand-off pattern (mirrors pendingDraftIdeaId): the session screen
      // reads + clears this flag on mount and triggers the right start flow.
      sessionStorage.setItem(
        "pendingStartFlow",
        JSON.stringify({
          hasContext: !!contextId,
          contextName: contextNameFor(contextValue),
        }),
      );
      navigate(`/session/new?${qs.toString()}`);
      return;
    }

    if (event.target.closest("[data-dashboard-add-source]")) {
      openAddSourceModal();
      return;
    }

    // Source-card actions on the Content section — open the default session
    // and land in the right tab. The card now exposes three actions:
    // "Ask" → posts tab, "View all N ideas" → All ideas view, more → no-op.
    const defaultSessionId = recentSessions[0]?.id || "new";

    // Idea-card source chips — navigate to the source within its session.
    const openSrc = event.target.closest("[data-source-open]");
    if (openSrc) {
      event.preventDefault();
      navigate(`/session/${defaultSessionId}?tab=content&view=sources&focusSource=${openSrc.dataset.sourceOpen}`);
      return;
    }
    if (event.target.closest("[data-source-view]")) {
      event.preventDefault();
      navigate(`/session/${defaultSessionId}?tab=content&view=ideas`);
      return;
    }
    const askBtn = event.target.closest("[data-source-ask]");
    if (askBtn) {
      event.preventDefault();
      const sourceId = askBtn.dataset.sourceAsk;
      const source = getSources().find((s) => s.id === sourceId);
      if (!source) return;
      const handoff = (choice) => {
        sessionStorage.setItem("pendingAskSource", JSON.stringify({ sourceId, filename: source.filename }));
        if (choice.kind === "new") {
          const qs = new URLSearchParams({ tab: "posts", title: defaultChatName() });
          navigate(`/session/new?${qs.toString()}`);
        } else {
          navigate(`/session/${choice.session.id}?tab=posts`);
        }
      };
      if (recentSessions.length === 0) {
        handoff({ kind: "new" });
      } else {
        openChatPickerModal({ onPick: handoff });
      }
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
      if (!ideaId) return;
      // The session screen consumes pendingDraftIdeaId on mount and triggers
      // the inline "Which profile?" question before starting the draft. Same
      // hand-off shape regardless of whether we land in a fresh chat or an
      // existing one.
      sessionStorage.setItem("pendingDraftIdeaId", ideaId);
      // Zero existing chats — skip the picker, go straight to a new one.
      if (recentSessions.length === 0) {
        const qs = new URLSearchParams({ tab: "content", view: "ideas", title: defaultChatName() });
        navigate(`/session/new?${qs.toString()}`);
        return;
      }
      // Otherwise ask explicitly where the draft should land.
      openChatPickerModal({
        onPick: (choice) => {
          if (choice.kind === "new") {
            const qs = new URLSearchParams({ tab: "content", view: "ideas", title: defaultChatName() });
            navigate(`/session/new?${qs.toString()}`);
          } else {
            navigate(`/session/${choice.session.id}?tab=content&view=ideas`);
          }
        },
      });
      return;
    }
  });

  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-new-project-context]")) {
      setQuery({ ctx: event.target.value || "none" });
      return;
    }
    if (event.target.matches("[data-content-sort]")) {
      contentState.sort = event.target.value;
      rerenderContentWorkspaceBody(root, {
        sources: getSources(),
        ideas,
        view: readQuery().view === "ideas" ? "ideas" : "sources",
      });
    }
  });

  root.addEventListener("input", (event) => {
    if (event.target.matches("[data-new-project-name]")) {
      const error = root.querySelector("[data-new-project-error]");
      if (error && event.target.value.trim()) error.hidden = true;
      return;
    }
    if (event.target.matches("[data-content-search]")) {
      contentState.q = event.target.value;
      rerenderContentWorkspaceBody(root, {
        sources: getSources(),
        ideas,
        view: readQuery().view === "ideas" ? "ideas" : "sources",
      });
    }
  });
}

// Fallback chat name when the user submits with no title typed in. Eventually
// this stamp gets replaced by an AI-derived title once there's enough
// material in the thread; for now the date+time is good enough to scan in
// the recent-chats list.
function defaultChatName() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `Chat · ${fmt.format(now)}`;
}
