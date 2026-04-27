// Shared "Content" workspace — used by both the dashboard's start screen
// and the in-session Content tab. Same UI in both places (header with
// counts, search input, sort dropdown, By source / All ideas tabs, body
// of cards).
//
// State (search query + sort) lives module-locally, shared across screens
// so the user's filter persists when they navigate from start screen into
// a session and back.
//
// Public API:
//   contentState                                — { q, sort } shared state
//   renderContentWorkspace({ sources, ideas, view, headerActions })
//                                                — full HTML render
//   rerenderContentWorkspaceBody(root, { sources, ideas, view })
//                                                — partial re-render (body
//                                                  + counter pills) so the
//                                                  search input keeps focus
//
// Caller wires its own input/change listeners and calls
// rerenderContentWorkspaceBody(...) on each tick.

import { html, raw } from "../utils.js?v=20";
import { renderSourceCard } from "./source-card.js?v=22";
import { renderIdeaCard } from "./idea-card.js?v=23";

export const contentState = { q: "", sort: "potential" };

// ─── Filters / sort ───────────────────────────────────────────────────────

function filterContent(sources, ideas, search) {
  const lower = (search || "").toLowerCase();
  const matches = (text) => !lower || (text || "").toLowerCase().includes(lower);
  const filteredIdeas = ideas.filter((i) => matches(i.title) || matches(i.body) || matches(i.rationale));
  const filteredSources = sources.filter((s) => {
    if (matches(s.filename) || matches(s.kind)) return true;
    return ideas.some((i) => (i.sourceIds || []).includes(s.id) && (matches(i.title) || matches(i.body)));
  });
  return { filteredIdeas, filteredSources };
}

function sortIdeas(ideas, sort) {
  const copy = ideas.slice();
  if (sort === "newest") return copy;
  if (sort === "source") {
    return copy.sort((a, b) =>
      String((a.sourceIds || [])[0] || "").localeCompare(String((b.sourceIds || [])[0] || "")),
    );
  }
  if (sort === "state") {
    const rank = { Pinned: 0, Reviewed: 1, Generated: 2, New: 3 };
    return copy.sort((a, b) => (rank[a.state] ?? 99) - (rank[b.state] ?? 99));
  }
  // default: highest potential
  return copy.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}

// ─── Body renderers ───────────────────────────────────────────────────────

function renderEmptyState({ icon, title, body, actionHtml = "" }) {
  return `
    <div class="session__empty">
      <div class="session__empty-icon">
        <i class="${icon} lg"></i>
      </div>
      <h3 class="text-subtitle">${title}</h3>
      <p class="muted">${body}</p>
      ${actionHtml ? `<div class="session__empty-action">${actionHtml}</div>` : ""}
    </div>
  `;
}

function renderBySourceBody(sources, allIdeas, search) {
  if (sources.length === 0) {
    return renderEmptyState({
      icon: "ap-icon-feature-library",
      title: "No sources match",
      body: search ? `No source matches "${search}". Try a different term.` : "No sources yet.",
    });
  }
  return `<div class="stack-sm">${sources.map((s) => renderSourceCard(s, allIdeas)).join("")}</div>`;
}

function renderAllIdeasBody(ideas, allSources, search) {
  if (ideas.length === 0) {
    return renderEmptyState({
      icon: "ap-icon-sparkles",
      title: "No ideas match",
      body: search ? `No idea matches "${search}". Try a different term.` : "No ideas yet.",
    });
  }
  return `<div class="dashboard__ideas-grid">${ideas.map((i) => renderIdeaCard(i, allSources)).join("")}</div>`;
}

// ─── Toolbar (search + sort + view tabs) ─────────────────────────────────

function renderContentToolbar(view, sourcesCount, ideasCount) {
  const sort = contentState.sort;
  const q = contentState.q;
  return `
    <div class="content-workspace__toolbar">
      <div class="ap-input-group content-workspace__search">
        <i class="ap-icon-search"></i>
        <input
          type="text"
          placeholder="Search sources and ideas…"
          value="${q.replace(/"/g, "&quot;")}"
          data-content-search
          aria-label="Search content"
        />
      </div>
      <div class="content-workspace__toolbar-right">
        <label class="content-workspace__sort-label">
          <span class="muted">Sort</span>
          <select class="ap-native-select" data-content-sort aria-label="Sort ideas">
            <option value="potential" ${sort === "potential" ? "selected" : ""}>Highest potential</option>
            <option value="newest" ${sort === "newest" ? "selected" : ""}>Newest</option>
            <option value="source" ${sort === "source" ? "selected" : ""}>Source</option>
            <option value="state" ${sort === "state" ? "selected" : ""}>Workflow state</option>
          </select>
        </label>
      </div>
    </div>
    <div class="ap-tabs content-workspace__view-tabs">
      <div class="ap-tabs-nav">
        <button type="button" class="ap-tabs-tab ${view === "sources" ? "active" : ""}" data-content-view="sources">
          <i class="ap-icon-feature-library"></i>
          <span>By source</span>
          <span class="ap-counter normal ${view === "sources" ? "blue" : "grey"}">${sourcesCount}</span>
        </button>
        <button type="button" class="ap-tabs-tab ${view === "ideas" ? "active" : ""}" data-content-view="ideas">
          <i class="ap-icon-sparkles"></i>
          <span>All ideas</span>
          <span class="ap-counter normal ${view === "ideas" ? "blue" : "grey"}">${ideasCount}</span>
        </button>
      </div>
    </div>
  `;
}

// ─── Full + partial render ───────────────────────────────────────────────

// Returns the full content workspace HTML. When called, applies the live
// contentState (search query + sort) to the passed sources/ideas.
//
// `view` — 'sources' | 'ideas'
// `headerActions` — optional HTML injected to the right of the count meta
//                   (e.g. "+ Add source" button on the dashboard)
export function renderContentWorkspace({ sources, ideas, view, headerActions = "" }) {
  const search = contentState.q;
  const { filteredSources, filteredIdeas } = filterContent(sources, ideas, search);
  const sortedIdeas = sortIdeas(filteredIdeas, contentState.sort);
  const body =
    view === "sources"
      ? renderBySourceBody(filteredSources, ideas, search)
      : renderAllIdeasBody(sortedIdeas, sources, search);
  return html`
    <section class="content-workspace">
      <header class="content-workspace__header">
        <div class="row-between">
          <h2 class="text-section">Content</h2>
          <div class="content-workspace__header-right">
            <span class="muted">
              ${sources.length} source${sources.length === 1 ? "" : "s"} · ${ideas.length}
              idea${ideas.length === 1 ? "" : "s"}
            </span>
            ${raw(headerActions)}
          </div>
        </div>
        ${raw(renderContentToolbar(view, filteredSources.length, filteredIdeas.length))}
      </header>
      <div class="content-workspace__body" data-content-body>${raw(body)}</div>
    </section>
  `;
}

// Patches the body + counter pills in place. Preserves search input focus
// and cursor position because the input itself is left untouched.
export function rerenderContentWorkspaceBody(root, { sources, ideas, view }) {
  const search = contentState.q;
  const { filteredSources, filteredIdeas } = filterContent(sources, ideas, search);
  const sortedIdeas = sortIdeas(filteredIdeas, contentState.sort);
  const body = root.querySelector("[data-content-body]");
  if (body) {
    body.innerHTML =
      view === "sources"
        ? renderBySourceBody(filteredSources, ideas, search)
        : renderAllIdeasBody(sortedIdeas, sources, search);
  }
  // Update counter pills in place — don't rebuild the tab buttons.
  root.querySelectorAll("[data-content-view]").forEach((t) => {
    const which = t.dataset.contentView;
    const counter = t.querySelector(".ap-counter");
    if (counter) counter.textContent = which === "sources" ? filteredSources.length : filteredIdeas.length;
  });
}

// Default empty-state for "no sources, no ideas at all" — both screens
// surface the same message before any content has been ingested. Pass
// `actionHtml` to render a CTA underneath (e.g. "+ Add source"); callers
// that don't have a primary action can omit it.
export function renderContentEmptyState({ actionHtml = "" } = {}) {
  return renderEmptyState({
    icon: "ap-icon-feature-library",
    title: "No content yet",
    body: "Add a PDF, a video, or a URL to get started. Archie processes it and surfaces ideas you can publish.",
    actionHtml,
  });
}
