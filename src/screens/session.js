import { html, raw } from "../utils.js?v=20";
import { navigate } from "../router.js?v=20";
import { renderTopbar } from "../components/topbar.js?v=20";
import {
  getSessionById,
  getContextById,
  contextComponentsFor,
  contexts as allContexts,
  posts as allPosts,
  postCountsByFilter,
  postCountsByNetwork,
  attachImageToPost,
  createPostFromIdea,
} from "../mocks.js?v=20";
import { isNewUser } from "../user-mode.js?v=20";
import { getThread, sendMessage, pickSuggestedPrompts, postAssistantMessage, subscribe } from "../assistant.js?v=20";
import { getSources, getIdeas, subscribe as subscribeLibrary, addSource } from "../library.js?v=20";
import { renderSourceCard } from "../components/source-card.js?v=20";
import { renderIdeaCard } from "../components/idea-card.js?v=20";
import { open as openGenerateImageModal } from "../components/generate-image-modal.js?v=20";

// Session screen — persistent assistant panel on the left, workspace with
// tabs on the right.
//
// URL:   #/session/:id?tab=posts|library|ideas|context
//
// For a real session id (e.g. s-acme-launch) in returning-user mode, the
// tabs render populated views; otherwise they render empty states.

function readQuery() {
  const raw = window.location.hash.split("?")[1] || "";
  const params = new URLSearchParams(raw);
  // Back-compat: old `?tab=library` / `?tab=ideas` now map to the merged
  // Content tab.
  let tab = params.get("tab") || "posts";
  let viewFromOldTab = null;
  if (tab === "library") {
    tab = "content";
    viewFromOldTab = "sources";
  } else if (tab === "ideas") {
    tab = "content";
    viewFromOldTab = "ideas";
  }
  return {
    tab,
    populated: params.get("populated") === "1" || params.get("populated") === "true",
    title: params.get("title") || "",
    contextId: params.get("contextId") || "",
    detached: params.get("detached") === "1" || params.get("detached") === "true",
    postsFilter: params.get("postsFilter") || "all",
    postsNetwork: params.get("postsNetwork") || "all",
    focusIdea: params.get("focusIdea") || "",
    focusPost: params.get("focusPost") || "",
    // Content tab state
    view: params.get("view") || viewFromOldTab || "sources",
  };
}

// Per-tab ephemeral state — search query + sort — scoped to the Content tab.
// Not URL-persisted so typing in the search input doesn't reset cursor on
// every keystroke and doesn't pollute the shareable URL.
const contentState = { q: "", sort: "potential" };

function setQuery(next) {
  const current = readQuery();
  const merged = { ...current, ...next };
  Object.keys(merged).forEach((key) => {
    if (merged[key] == null || merged[key] === "" || merged[key] === false) delete merged[key];
  });
  const qs = new URLSearchParams(merged).toString();
  const sessionId = getActiveSessionIdFromHash();
  window.location.hash = `#/session/${sessionId}?${qs}`;
}

function getActiveSessionIdFromHash() {
  const m = /^#\/session\/([^/?]+)/.exec(window.location.hash);
  return m ? m[1] : "new";
}

// Unsubscribe fn for the assistant thread + library subscriptions.
let currentUnsubscribe = null;

// Controller used to abort the click/keydown listeners that bindSession
// attaches to the stable #app element. Each renderSession call aborts the
// previous batch and hands bindSession a fresh controller — otherwise tab
// switches stack listeners and `[data-add-source]` fires N times per click.
let currentListenerController = null;

export function renderSession(params, target) {
  const mockedSession = getSessionById(params.id);
  const isRealSession = !!mockedSession && !isNewUser();
  const q = readQuery();

  const session = mockedSession || {
    id: params.id,
    name: q.title || (params.id === "new" ? "Untitled session" : "Session"),
    contextId: q.contextId || null,
  };
  renderTopbar({ crumb: session.name });

  // In "populated=1" mode we pretend the session has the default context
  // attached so the UI can demo the populated Context tab.
  const attachedContext = q.detached
    ? null
    : q.contextId
      ? getContextById(q.contextId)
      : session.contextId
        ? getContextById(session.contextId)
        : q.populated
          ? allContexts[0]
          : null;
  const hasContext = !!attachedContext;

  target.innerHTML = html`
    <section class="screen screen--split session">
      ${raw(renderAssistantPanel(session, attachedContext))}
      <section class="session__workspace">
        ${raw(renderWorkspaceTabs(q))}
        <div
          class="session__tab-body ${q.tab === "posts" && isRealSession ? "session__tab-body--flush" : ""}"
          data-tab-body="${q.tab}"
        >
          ${raw(renderTab(q, attachedContext, isRealSession, session))}
        </div>
      </section>
    </section>
  `;

  bindSession(target, session);
  wireAssistantPanel(target, session);
}

function renderAssistantPanel(session, attachedContext) {
  const thread = getThread(session.id, { hasContext: !!attachedContext });
  const prompts = pickSuggestedPrompts({ hasContext: !!attachedContext });

  return html`
    <aside class="session__assistant" aria-label="Assistant panel">
      <div class="session__assistant-thread" id="assistantThread" data-assistant-thread>
        ${raw(renderThread(thread))}
      </div>
      <div class="session__assistant-suggestions" data-assistant-prompts>
        ${raw(
          prompts
            .map(
              (p) => `
                <button type="button" class="assistant-prompt" data-assistant-prompt="${p.value}">
                  <span class="assistant-prompt__title">${p.title}</span>
                </button>
              `,
            )
            .join(""),
        )}
      </div>
      <div class="session__composer">
        <div class="session__composer-card">
          <div class="session__composer-thinking" data-assistant-thinking hidden>
            <span class="session__composer-thinking-spinner" aria-hidden="true"></span>
            <span class="session__composer-thinking-text" data-thinking-text>0s · 1 credit</span>
          </div>
          <div class="session__composer-input">
            <textarea
              class="session__composer-input-field"
              id="assistantInput"
              placeholder="Ask Archie to compare ideas, find a signal, or draft the next move…"
              rows="3"
            ></textarea>
            <div class="session__composer-actions">
              <div class="assistant-attach">
                <button
                  type="button"
                  class="ap-icon-button transparent"
                  aria-label="Attach a source"
                  data-assistant-attach-toggle
                >
                  <i class="ap-icon-plus"></i>
                </button>
                <div class="assistant-attach__menu" data-assistant-attach-menu hidden>
                  <button type="button" class="assistant-attach__item" data-add-source="pdf">
                    <i class="ap-icon-file--pdf"></i>
                    <span>Add PDF</span>
                  </button>
                  <button type="button" class="assistant-attach__item" data-add-source="video">
                    <i class="ap-icon-file--video"></i>
                    <span>Add video</span>
                  </button>
                  <button type="button" class="assistant-attach__item" data-add-source="url">
                    <i class="ap-icon-link"></i>
                    <span>Add URL</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                class="ap-button primary orange session__composer-send"
                aria-label="Send"
                data-assistant-send
              >
                <i class="ap-icon-arrow-up"></i>
              </button>
            </div>
          </div>
          <button type="button" class="session__composer-session" aria-label="Choose session">
            <i class="ap-icon-folder"></i>
            <span>${session.name}</span>
            <i class="ap-icon-chevron-down"></i>
          </button>
        </div>
      </div>
    </aside>
  `;
}

function renderThread(messages) {
  return messages.map(renderTurn).join("");
}

function renderTurn(message) {
  // Hidden placeholders (pre-reply AI bubbles) don't render.
  if (message.hidden) return "";

  // Pending marker — renders the inline "Extracting" notice while loading,
  // disappears once the caller flips status to "ready". Figma 25:1413.
  if (message.role === "pending") {
    if (message.status !== "loading") return "";
    return renderExtractingNotice();
  }

  // Right-aligned "Source intake" turn — Figma 25:1127 / 25:1131.
  if (message.role === "source-intake") {
    return renderSourceIntakeTurn(message);
  }

  // AI extraction result — Figma 25:1053.
  if (message.role === "assistant" && message.variant === "extraction") {
    return renderExtractionTurn(message);
  }

  // Drafting / system notices — mermaid status pill + optional detail body.
  if (message.role === "system") {
    return renderSystemNotice(message);
  }

  const isAi = message.role === "assistant";
  const bubbleClass = isAi ? "chat-bubble--ai" : "chat-bubble--user";
  const turnClass = isAi ? "chat-turn--ai" : "chat-turn--user";
  const loadingClass = message.status === "loading" ? " is-loading" : "";
  const header = isAi
    ? `<i class="ap-icon-sparkles-mermaid chat-turn-avatar" aria-hidden="true"></i>`
    : `<span class="chat-turn-role">You</span>`;
  return `
    <div class="chat-turn ${turnClass}">
      ${header}
      <div class="chat-bubble ${bubbleClass}${loadingClass}">
        <p class="chat-bubble-text">${message.text}</p>
      </div>
    </div>
  `;
}

function renderSystemNotice(message) {
  const variantClass = message.variant === "mermaid" ? " assistant-notice--mermaid" : "";
  const loadingClass = message.status === "loading" ? " is-loading" : "";
  const openAttr = message.open ? " open" : "";
  const statusClass = message.variant === "mermaid" ? "ap-status mermaid" : "ap-status grey";
  const hasDetail = !!message.text;
  return `
    <details class="assistant-notice${variantClass}${loadingClass}"${openAttr}>
      <summary class="assistant-notice__toggle">
        <span class="${statusClass}">${message.meta || "System"}</span>
        ${hasDetail ? '<i class="ap-icon-chevron-down assistant-notice__chevron"></i>' : ""}
      </summary>
      ${hasDetail ? `<div class="assistant-notice__detail">${message.text}</div>` : ""}
    </details>
  `;
}

// Inline "Extracting" notice (Figma 25:1413) — mermaid status pill + small
// blue spinner, sits in the thread while a source extraction is in flight.
function renderExtractingNotice() {
  return `
    <div class="chat-turn chat-turn--ai chat-turn--extracting">
      <div class="extracting-notice">
        <span class="ap-status mermaid">Extracting</span>
        <span class="extracting-notice__spinner" aria-hidden="true"></span>
      </div>
    </div>
  `;
}

function renderSourceIntakeTurn(message) {
  const iconByKind = {
    pdf: "ap-icon-file--pdf",
    video: "ap-icon-file--video",
    url: "ap-icon-link",
  };
  const icon = iconByKind[message.kind] || "ap-icon-file";
  const suffix = message.size ? ` · ${message.size}` : "";
  return `
    <div class="chat-turn chat-turn--user">
      <span class="chat-turn-role">${message.meta || "Source intake"}</span>
      <div class="chat-bubble chat-bubble--source-intake">
        <i class="${icon}" aria-hidden="true"></i>
        <p class="chat-bubble-text">${message.filename}${suffix}</p>
      </div>
    </div>
  `;
}

function renderExtractionTurn(message) {
  const loadingClass = message.status === "loading" ? " is-loading" : "";
  const openAttr = message.open === false ? "" : " open";
  const count = message.count ?? (message.ideas ? message.ideas.length : 0);
  const cards = (message.ideas || [])
    .map(
      (i) => `
        <div class="ap-card extraction-turn__idea-card">
          <div class="extraction-turn__idea-card-text">
            <p class="extraction-turn__idea-card-title">${i.title}</p>
            <p class="extraction-turn__idea-card-body">${i.body}</p>
          </div>
          <div class="extraction-turn__idea-card-footer">
            <div class="extraction-turn__idea-card-feedback" role="group" aria-label="Rate this idea">
              <button
                type="button"
                class="extraction-turn__idea-card-thumb"
                title="Helpful"
                aria-label="Mark as helpful"
                aria-pressed="false"
                data-idea-feedback="up"
                data-idea-id="${i.id || ""}"
              >
                <i class="ap-icon-thumb-up"></i>
              </button>
              <button
                type="button"
                class="extraction-turn__idea-card-thumb"
                title="Not helpful"
                aria-label="Mark as not helpful"
                aria-pressed="false"
                data-idea-feedback="down"
                data-idea-id="${i.id || ""}"
              >
                <i class="ap-icon-thumb-down"></i>
              </button>
            </div>
            <a
              href="#"
              class="ap-link standalone small extraction-turn__idea-card-view"
              data-focus-idea="${i.id || ""}"
              aria-label="Open this idea in Content ideas"
            >
              <span>View idea</span>
              <i class="ap-icon-external-link"></i>
            </a>
          </div>
        </div>
      `,
    )
    .join("");
  return `
    <div class="chat-turn chat-turn--ai chat-turn--extraction">
      <details class="assistant-notice assistant-notice--mermaid${loadingClass}"${openAttr}>
        <summary class="assistant-notice__toggle">
          <span class="ap-status mermaid">Extracted ${count} idea${count === 1 ? "" : "s"}</span>
          <i class="ap-icon-chevron-down assistant-notice__chevron"></i>
        </summary>
        <div class="extraction-turn__detail">
          <div class="extraction-turn__analyzed-row">
            <strong>Analyzed</strong>
            <span>${message.filename}</span>
          </div>
          ${cards}
        </div>
      </details>
    </div>
  `;
}

function wireAssistantPanel(root, session) {
  // Tear down any subscriptions attached to the previous render.
  if (currentUnsubscribe) {
    currentUnsubscribe();
    currentUnsubscribe = null;
  }
  stopThinkingTimer();

  const thread = root.querySelector("[data-assistant-thread]");
  if (thread) {
    queueMicrotask(() => {
      thread.scrollTop = thread.scrollHeight;
    });
  }

  // Initial chip sync (in case the thread already has a loading message
  // carried over from a prior render, e.g. after a tab switch).
  updateThinkingChip(session.id);

  // Subscribe to the assistant thread.
  const offThread = subscribe(session.id, (messages) => {
    if (thread) {
      thread.innerHTML = renderThread(messages);
      thread.scrollTop = thread.scrollHeight;
    }
    updateThinkingChip(session.id);
  });

  // Subscribe to library/ideas changes — re-render the Content workspace
  // body (both By source and All ideas share the same data).
  const offLibrary = subscribeLibrary(session.id, ({ sources, ideas }) => {
    const body = root.querySelector("[data-tab-body]");
    if (!body) return;
    const tab = body.dataset.tabBody;
    if (tab !== "content") return;
    // If the workspace wasn't rendered before (empty state → populated now),
    // re-render the whole tab body. Otherwise patch just the list body.
    const hasWorkspace = !!body.querySelector("[data-content-body]");
    if (!hasWorkspace) {
      body.innerHTML = renderTab(readQuery(), null, false, session);
    } else {
      rerenderContentWorkspace(root, session);
    }
    applyIdeaFocus(root);
  });

  // Apply idea focus on initial render if ?focusIdea= is present.
  applyIdeaFocus(root);

  currentUnsubscribe = () => {
    offThread();
    offLibrary();
    stopThinkingTimer();
  };
}

// --- Thinking chip -------------------------------------------------------

let thinkingIntervalId = null;

function updateThinkingChip(sessionId) {
  const chip = document.querySelector("[data-assistant-thinking]");
  if (!chip) return;
  const thread = getThread(sessionId);
  const loadingMessages = thread.filter((m) => m.status === "loading");
  if (loadingMessages.length === 0) {
    chip.hidden = true;
    stopThinkingTimer();
    return;
  }
  chip.hidden = false;
  const startedAt = loadingMessages[0].createdAt || Date.now();
  paintThinkingChip(chip, startedAt);
  startThinkingTimer(sessionId);
}

function paintThinkingChip(chip, startedAt) {
  const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const credits = Math.max(1, Math.round(seconds / 6));
  const label = formatElapsed(seconds);
  const text = chip.querySelector("[data-thinking-text]");
  if (text) {
    text.textContent = `${label} · ${credits} credit${credits === 1 ? "" : "s"}`;
  }
}

function formatElapsed(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function startThinkingTimer(sessionId) {
  if (thinkingIntervalId) return;
  thinkingIntervalId = setInterval(() => {
    const chip = document.querySelector("[data-assistant-thinking]");
    if (!chip || chip.hidden) {
      stopThinkingTimer();
      return;
    }
    const thread = getThread(sessionId);
    const loading = thread.find((m) => m.status === "loading");
    if (!loading) {
      chip.hidden = true;
      stopThinkingTimer();
      return;
    }
    paintThinkingChip(chip, loading.createdAt || Date.now());
  }, 1000);
}

function stopThinkingTimer() {
  if (thinkingIntervalId) {
    clearInterval(thinkingIntervalId);
    thinkingIntervalId = null;
  }
}

// --- Focused-idea highlight ---------------------------------------------

function applyIdeaFocus(root) {
  const q = readQuery();
  if (!q.focusIdea || q.tab !== "content" || q.view !== "ideas") return;
  const card = root.querySelector(`[data-idea-id="${q.focusIdea}"]`);
  if (!card) return;
  card.classList.add("is-focused");
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => card.classList.remove("is-focused"), 1800);
}

function renderWorkspaceTabs(q) {
  const tab = (id, icon, label) => {
    const active = q.tab === id;
    return `
      <button type="button" class="ap-tabs-tab ${active ? "active" : ""}" data-session-tab="${id}">
        <i class="${icon}"></i>
        <span>${label}</span>
      </button>
    `;
  };

  return html`
    <div class="ap-tabs session__tabs">
      <div class="ap-tabs-nav">
        ${raw(tab("posts", "ap-icon-megaphone", "Posts"))} ${raw(tab("content", "ap-icon-feature-library", "Content"))}
        ${raw(tab("context", "ap-icon-headset", "Context"))}
      </div>
    </div>
  `;
}

function renderTab(q, attachedContext, isRealSession, session) {
  if (q.tab === "context") return renderContextTab(attachedContext);

  if (q.tab === "posts") {
    if (isRealSession || q.focusPost) return renderPopulatedPosts(q);
    return renderEmptyState({
      icon: "ap-icon-megaphone",
      title: "No posts yet",
      body: "Generate a post from an idea, or draft one from scratch in the assistant on the left.",
    });
  }

  if (q.tab === "content") {
    const libSources = getSources(session.id);
    const libIdeas = getIdeas(session.id);
    if (libSources.length === 0 && libIdeas.length === 0) {
      return renderEmptyState({
        icon: "ap-icon-feature-library",
        title: "No content yet",
        body: "Add a PDF, a video, or a URL on the left. Archie processes it and surfaces ideas you can publish.",
      });
    }
    return renderContentWorkspace(libSources, libIdeas, q);
  }

  return renderEmptyState({
    icon: "ap-icon-sparkles",
    title: "Ideas appear here",
    body: "Once Archie has a source, it will surface content ideas you can draft posts from.",
  });
}

// Unified Content workspace — "By source" vs "All ideas" view switch,
// plus a compact toolbar (search + sort).
function renderContentWorkspace(libSources, libIdeas, q) {
  const view = q.view === "ideas" ? "ideas" : "sources";
  const search = contentState.q.toLowerCase();
  const sort = contentState.sort;

  // Apply filters
  const matchesQuery = (text) => !search || (text || "").toLowerCase().includes(search);
  const filteredIdeas = libIdeas.filter(
    (i) => matchesQuery(i.title) || matchesQuery(i.body) || matchesQuery(i.rationale),
  );
  const filteredSources = libSources.filter((s) => {
    if (matchesQuery(s.filename) || matchesQuery(s.kind)) return true;
    // Also surface a source if any of its ideas match.
    return libIdeas.some((i) => i.sourceId === s.id && (matchesQuery(i.title) || matchesQuery(i.body)));
  });

  const sortedIdeas = sortIdeas(filteredIdeas, sort);

  const body =
    view === "sources"
      ? renderBySourceBody(filteredSources, libIdeas, search)
      : renderAllIdeasBody(sortedIdeas, libSources, search);

  return html`
    <section class="content-workspace">
      <header class="content-workspace__header">
        <div class="row-between">
          <h2 class="text-section">Content</h2>
          <span class="muted">
            ${libSources.length} source${libSources.length === 1 ? "" : "s"} · ${libIdeas.length}
            idea${libIdeas.length === 1 ? "" : "s"}
          </span>
        </div>
        ${raw(renderContentToolbar(view, filteredSources.length, filteredIdeas.length))}
      </header>
      <div class="content-workspace__body" data-content-body>${raw(body)}</div>
    </section>
  `;
}

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

function sortIdeas(ideas, sort) {
  const copy = ideas.slice();
  if (sort === "newest") {
    // Preserve insertion order for extracted ideas (newest-first is already
    // how library.js unshifts them). Use the original libIdeas order proxy.
    return copy;
  }
  if (sort === "source") {
    return copy.sort((a, b) => String(a.sourceId || "").localeCompare(String(b.sourceId || "")));
  }
  if (sort === "state") {
    const rank = { Pinned: 0, Reviewed: 1, Generated: 2, New: 3 };
    return copy.sort((a, b) => (rank[a.state] ?? 99) - (rank[b.state] ?? 99));
  }
  // default: potential
  return copy.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
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
  return `<div class="stack-sm">${ideas.map((i) => renderIdeaCard(i, allSources)).join("")}</div>`;
}

// Called from bindSession to re-render only the content workspace body (not
// the whole tab), preserving the focus of the search input.
function rerenderContentWorkspace(root, session) {
  const q = readQuery();
  if (q.tab !== "content") return;
  const libSources = getSources(session.id);
  const libIdeas = getIdeas(session.id);
  const view = q.view === "ideas" ? "ideas" : "sources";
  const search = contentState.q.toLowerCase();
  const matchesQuery = (text) => !search || (text || "").toLowerCase().includes(search);
  const filteredIdeas = libIdeas.filter(
    (i) => matchesQuery(i.title) || matchesQuery(i.body) || matchesQuery(i.rationale),
  );
  const filteredSources = libSources.filter((s) => {
    if (matchesQuery(s.filename) || matchesQuery(s.kind)) return true;
    return libIdeas.some((i) => i.sourceId === s.id && (matchesQuery(i.title) || matchesQuery(i.body)));
  });
  const sortedIdeas = sortIdeas(filteredIdeas, contentState.sort);
  const body = root.querySelector("[data-content-body]");
  if (body) {
    body.innerHTML =
      view === "sources"
        ? renderBySourceBody(filteredSources, libIdeas, search)
        : renderAllIdeasBody(sortedIdeas, libSources, search);
  }
  // Update counter pills in the view tabs in place (don't rebuild the tabs)
  const tabs = root.querySelectorAll("[data-content-view]");
  tabs.forEach((t) => {
    const which = t.dataset.contentView;
    const counter = t.querySelector(".ap-counter");
    if (counter) counter.textContent = which === "sources" ? filteredSources.length : filteredIdeas.length;
  });
}

function renderEmptyState({ icon, title, body }) {
  return html`
    <div class="session__empty">
      <div class="session__empty-icon">
        <i class="${icon} lg"></i>
      </div>
      <h3 class="text-subtitle">${title}</h3>
      <p class="muted">${body}</p>
    </div>
  `;
}

// ---------- Populated Posts tab ----------

function renderPopulatedPosts(q) {
  const filterCounts = postCountsByFilter();
  const networkCounts = postCountsByNetwork();

  const filtered = allPosts.filter((p) => {
    if (q.postsFilter === "needs_fixes" && p.status !== "needs_fixes") return false;
    if (q.postsFilter === "scheduled" && p.status !== "scheduled") return false;
    if (q.postsNetwork !== "all" && p.network !== q.postsNetwork) return false;
    return true;
  });

  return html`
    <div class="posts">
      ${raw(renderPostsFilterRail(q, filterCounts, networkCounts))}
      <div class="posts__feed">
        ${raw(filtered.length ? filtered.map((post) => renderPostCard(post, q)).join("") : renderPostsEmpty(q))}
      </div>
    </div>
  `;
}

function renderPostsFilterRail(q, filterCounts, networkCounts) {
  const filterRow = (id, icon, label, count) => {
    const active = q.postsFilter === id;
    return `
      <button
        type="button"
        class="posts__filter ${active ? "is-active" : ""}"
        data-posts-filter="${id}"
      >
        <i class="${icon}"></i>
        <span class="posts__filter-label">${label}</span>
        <span class="posts__filter-count">${count}</span>
      </button>
    `;
  };

  const networkRow = (id, label, count) => {
    const active = q.postsNetwork === id;
    return `
      <button
        type="button"
        class="posts__filter posts__filter--network ${active ? "is-active" : ""}"
        data-posts-network="${id}"
      >
        <span class="posts__filter-label">${label}</span>
        <span class="posts__filter-count">${count}</span>
      </button>
    `;
  };

  return html`
    <aside class="posts__rail" aria-label="Post filters">
      <div class="posts__rail-group">
        ${raw(filterRow("all", "ap-icon-megaphone", "All posts", filterCounts.all))}
        ${raw(filterRow("needs_fixes", "ap-icon-error", "Needs fixes", filterCounts.needs_fixes))}
        ${raw(filterRow("scheduled", "ap-icon-calendar", "Scheduled", filterCounts.scheduled))}
      </div>
      <div class="posts__rail-group">
        <h3 class="posts__rail-heading">Network</h3>
        ${raw(networkRow("all", "All", networkCounts.all))}
        ${raw(networkRow("linkedin", "LinkedIn", networkCounts.linkedin))}
        ${raw(networkRow("twitter", "X", networkCounts.twitter))}
      </div>
    </aside>
  `;
}

function renderPostsEmpty(q) {
  return html`
    <div class="session__empty posts__empty">
      <div class="session__empty-icon">
        <i class="ap-icon-megaphone lg"></i>
      </div>
      <h3 class="text-subtitle">No posts match this filter</h3>
      <p class="muted">Try another filter, or clear the current one.</p>
      <button type="button" class="ap-button stroked blue" data-posts-clear>Clear filters</button>
    </div>
  `;
}

function renderPostCard(post, q = {}) {
  const statusPill = (() => {
    if (post.status === "needs_fixes") {
      return '<span class="ap-status red">Needs fixes</span>';
    }
    if (post.status === "scheduled") {
      return `<span class="ap-status orange">Scheduled · ${post.scheduledForLabel || ""}</span>`;
    }
    return '<span class="ap-status green">Draft ready</span>';
  })();

  const bodyParagraphs = post.text.map((p) => `<p class="posts__card-paragraph">${p}</p>`).join("");

  const hashtags = post.hashtags.length
    ? `<p class="posts__card-hashtags">${post.hashtags.map((h) => `<a>#${h}</a>`).join(" ")}</p>`
    : "";

  const cta = post.cta ? `<p class="posts__card-cta">${post.cta}</p>` : "";

  const stats = post.stats;
  const engagement =
    stats.likes || stats.comments || stats.reposts
      ? `
        <div class="posts__card-engagement">
          <span class="posts__card-reactions">
            <span class="posts__card-reaction">👍</span>
            <span class="posts__card-reaction">💡</span>
            <span class="posts__card-reaction-count">${stats.likes}</span>
          </span>
          <span class="posts__card-meta muted">${stats.comments} comments · ${stats.reposts} reposts</span>
        </div>
      `
      : "";

  const imageBlock = post.imageUrl
    ? `<img class="posts__card-image" src="${post.imageUrl}" alt="Generated image for this post" />`
    : `<button type="button" class="posts__card-image-placeholder" data-generate-image="${post.id}">
          <i class="ap-icon-sparkles-mermaid"></i>
          <span>Generate an image</span>
        </button>`;

  return html`
    <article class="posts__row ${q.focusPost === post.id ? "is-focused" : ""}" data-post-id="${post.id}">
      <label class="ap-checkbox-container posts__row-check" aria-label="Select post">
        <input type="checkbox" />
        <i></i>
      </label>

      <article class="ap-card posts__card">
        <header class="posts__card-header">
          <div class="posts__card-avatar" aria-hidden="true">${post.author.initials}</div>
          <div class="posts__card-author">
            <div class="row posts__card-author-row">
              <span class="posts__card-name">${post.author.name}</span>
              <span class="muted">· ${post.author.connection}</span>
            </div>
            <div class="muted posts__card-title">${post.author.title}</div>
            <div class="muted posts__card-meta">${post.timeLabel} · ${post.author.visibility}</div>
          </div>
          <div class="posts__card-status">${raw(statusPill)}</div>
        </header>

        <div class="posts__card-body">${raw(bodyParagraphs)} ${raw(hashtags)} ${raw(cta)}</div>

        ${raw(imageBlock)} ${raw(engagement)}

        <footer class="posts__card-footer">
          <button class="posts__card-action" type="button">
            <i class="ap-icon-thumb-up"></i>
            <span>Like</span>
          </button>
          <button class="posts__card-action" type="button">
            <i class="ap-icon-single-chat-bubble"></i>
            <span>Comment</span>
          </button>
          <button class="posts__card-action" type="button">
            <i class="ap-icon-repost"></i>
            <span>Repost</span>
          </button>
          <button class="posts__card-action" type="button">
            <i class="ap-icon-paper-plane"></i>
            <span>Send</span>
          </button>
        </footer>
      </article>

      <div class="posts__row-actions" aria-label="Post actions">
        <button type="button" class="ap-icon-button stroked" aria-label="Edit post">
          <i class="ap-icon-pen"></i>
        </button>
        <button
          type="button"
          class="ap-icon-button stroked"
          aria-label="Rewrite with AI"
          data-post-rewrite="${post.id}"
        >
          <i class="ap-icon-sparkles"></i>
        </button>
        <button type="button" class="ap-icon-button stroked" aria-label="Schedule post">
          <i class="ap-icon-calendar"></i>
        </button>
        <button type="button" class="ap-icon-button stroked" aria-label="Duplicate post">
          <i class="ap-icon-copy"></i>
        </button>
        <button type="button" class="ap-icon-button stroked posts__row-action--danger" aria-label="Delete post">
          <i class="ap-icon-trash"></i>
        </button>
      </div>
    </article>
  `;
}

function postAssistantGeneratedDraft(sessionId, idea, post) {
  postAssistantMessage(
    sessionId,
    `I created a draft from "${idea.title}" and moved it into Posts as ${post.id}. Review the hook, then use the rewrite action to keep refining it.`,
    { meta: "Archie" },
  );
}

// Context tab — single-context view. A session attaches at most one context;
// the tab shows its three components (Voice, Brief, Brand) as collapsible
// sections, or a CTA to attach/create one if none is attached yet.

function renderContextTab(attachedContext) {
  if (attachedContext) return renderAttachedContext(attachedContext);
  return renderNoContext();
}

function renderNoContext() {
  return html`
    <div class="session__context">
      <div class="stack-sm">
        <h2 class="text-title">No context attached</h2>
        <p class="muted">
          A context bundles your Voice, Strategy brief, and Brand theme. Attach one so Archie's suggestions stay
          on-message.
        </p>
      </div>
      <div class="session__context-actions">
        <button type="button" class="ap-button primary orange" data-create-context>
          <i class="ap-icon-plus"></i>
          <span>Create a context</span>
        </button>
      </div>
      <div class="session__context-picker">
        <h3 class="text-section">Attach existing</h3>
        <div class="stack-sm">
          ${raw(
            allContexts
              .map(
                (context) => `
                  <button type="button" class="ap-card session__context-option" data-attach-context="${context.id}">
                    <span class="session__context-option-title">${context.name}</span>
                    <span class="muted">${contextComponentsFor(context).join(" · ")} · Updated ${context.updatedAt}</span>
                    <i class="ap-icon-arrow-right"></i>
                  </button>
                `,
              )
              .join(""),
          )}
        </div>
      </div>
    </div>
  `;
}

function renderAttachedContext(context) {
  const components = [
    { key: "voice", title: "Voice", data: context.voice },
    { key: "brief", title: "Strategy brief", data: context.brief },
    { key: "brand", title: "Brand theme", data: context.brand },
  ];

  const items = components
    .map((c, i) => {
      if (!c.data) {
        return `
          <div class="session__context-missing">
            <div class="stack-sm grow">
              <span class="text-section">${c.title}</span>
              <span class="muted">Not yet analyzed.</span>
            </div>
            <button type="button" class="ap-button stroked blue" data-add-component="${c.key}">
              <i class="ap-icon-plus"></i>
              <span>Add ${c.title.toLowerCase()}</span>
            </button>
          </div>
        `;
      }
      return `
        <details class="ap-accordion session__accordion" ${i === 0 ? "open" : ""}>
          <summary class="ap-accordion-header">
            <i class="ap-icon-chevron-down ap-accordion-toggle"></i>
            <span>${c.title}</span>
          </summary>
          <div class="ap-accordion-content">
            ${renderComponentBody(c.key, c.data)}
          </div>
        </details>
      `;
    })
    .join("");

  return html`
    <div class="session__context">
      <div class="row-between">
        <div class="stack-sm">
          <h2 class="text-title">${context.name}</h2>
          <p class="muted">Updated ${context.updatedAt}.</p>
        </div>
        <div class="row">
          <button type="button" class="ap-button stroked grey" data-edit-context="${context.id}">
            <i class="ap-icon-pen"></i>
            <span>Edit</span>
          </button>
          <button type="button" class="ap-button transparent grey" data-detach-context>
            <span>Detach</span>
          </button>
        </div>
      </div>
      <div class="stack-sm">${raw(items)}</div>
    </div>
  `;
}

function renderComponentBody(key, data) {
  if (key === "voice") {
    return `
      <div class="session__component-sections">
        ${data.sections
          .map(
            (s) => `
              <section class="session__component-section">
                <h4>${s.title}</h4>
                <ul>${s.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
              </section>
            `,
          )
          .join("")}
      </div>
    `;
  }
  if (key === "brief") {
    return `
      <div class="session__component-sections">
        ${data.sections
          .map(
            (s) => `
              <section class="session__component-section">
                <h4>${s.title}</h4>
                <dl>
                  ${s.fields
                    .map(
                      (f) => `
                        <div>
                          <dt>${f.label}</dt>
                          <dd>${f.value}</dd>
                        </div>
                      `,
                    )
                    .join("")}
                </dl>
              </section>
            `,
          )
          .join("")}
      </div>
    `;
  }
  // brand
  return `
    <div class="session__component-brand">
      <p class="muted">Pulled from <b>${data.url}</b>.</p>
      <div class="session__component-brand-colors">
        ${data.colors
          .map(
            (c) => `
              <div class="session__component-brand-color">
                <span class="session__component-brand-swatch" style="background:${c.hex}"></span>
                <span>${c.name}</span>
                <span class="muted">${c.hex}</span>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="session__component-brand-tags">
        ${data.personality.map((p) => `<span class="ap-tag blue">${p}</span>`).join("")}
      </div>
    </div>
  `;
}

function bindSession(root, session) {
  // Abort any listeners attached by the previous render so they don't stack
  // on the stable #app element and fire N times per click.
  if (currentListenerController) currentListenerController.abort();
  currentListenerController = new AbortController();
  const { signal } = currentListenerController;

  const input = root.querySelector("#assistantInput");
  const attachMenu = root.querySelector("[data-assistant-attach-menu]");

  function closeAttachMenu() {
    if (attachMenu) attachMenu.hidden = true;
  }

  function submitInput() {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    sendMessage(session.id, text);
    input.value = "";
  }

  root.addEventListener(
    "click",
    (event) => {
      // Thumb up/down feedback on an extraction idea card — exclusive toggle.
      const thumb = event.target.closest("[data-idea-feedback]");
      if (thumb) {
        event.preventDefault();
        const card = thumb.closest(".extraction-turn__idea-card");
        if (card) {
          const wasActive = thumb.classList.contains("is-active");
          // Mutually exclusive: clear both thumbs in this card first.
          card.querySelectorAll("[data-idea-feedback]").forEach((b) => {
            b.classList.remove("is-active");
            b.setAttribute("aria-pressed", "false");
            const i = b.querySelector("i");
            if (i) {
              const dir = b.dataset.ideaFeedback;
              i.className = dir === "up" ? "ap-icon-thumb-up" : "ap-icon-thumb-down";
            }
          });
          if (!wasActive) {
            thumb.classList.add("is-active");
            thumb.setAttribute("aria-pressed", "true");
            const i = thumb.querySelector("i");
            if (i) {
              const dir = thumb.dataset.ideaFeedback;
              i.className = dir === "up" ? "ap-icon-thumb-up_fill" : "ap-icon-thumb-down_fill";
            }
          }
        }
        return;
      }

      // External-link on an extraction idea card — jump to Content ideas + focus.
      const focusBtn = event.target.closest("[data-focus-idea]");
      if (focusBtn) {
        event.preventDefault();
        const id = focusBtn.dataset.focusIdea;
        if (id) setQuery({ tab: "content", view: "ideas", focusIdea: id });
        return;
      }

      // "View all N ideas" inside a source card → switch to All ideas view.
      if (event.target.closest("[data-source-view]")) {
        event.preventDefault();
        setQuery({ tab: "content", view: "ideas", focusIdea: "" });
        return;
      }

      // Content workspace view switch — By source / All ideas.
      const contentViewBtn = event.target.closest("[data-content-view]");
      if (contentViewBtn) {
        event.preventDefault();
        setQuery({ tab: "content", view: contentViewBtn.dataset.contentView, focusIdea: "" });
        return;
      }

      // "Ask" inside a source card → focus the composer with a primed prompt.
      const askBtn = event.target.closest("[data-source-ask]");
      if (askBtn) {
        event.preventDefault();
        const sourceId = askBtn.dataset.sourceAsk;
        const src = getSources(session.id).find((s) => s.id === sourceId);
        if (input) {
          input.value = `Tell me what stands out in ${src ? src.filename : "this source"}`;
          input.focus();
        }
        return;
      }

      // Source overflow menu → no-op for the prototype.
      if (event.target.closest("[data-source-more]")) {
        event.preventDefault();
        return;
      }

      // Idea-card source link doubles as "Open idea" — give the card a
      // visual pulse (dossier view is future work). Pin + more-menu behavior
      // is encapsulated inside src/components/idea-card.js.
      const openBtn = event.target.closest("[data-idea-open]");
      if (openBtn) {
        event.preventDefault();
        const card = openBtn.closest(".idea-card");
        if (card) {
          card.classList.add("is-focused");
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => card.classList.remove("is-focused"), 1600);
        }
        return;
      }

      if (event.target.closest("[data-idea-generate]")) {
        event.preventDefault();
        const ideaId = event.target.closest("[data-idea-generate]")?.dataset.ideaGenerate;
        const idea = getIdeas(session.id).find((i) => i.id === ideaId);
        if (idea) {
          const source = getSources(session.id).find((s) => s.id === idea.sourceId);
          const post = createPostFromIdea(idea, source);
          setQuery({ tab: "posts", focusPost: post.id, postsFilter: "all", postsNetwork: "all" });
          postAssistantGeneratedDraft(session.id, idea, post);
        }
        return;
      }

      const tab = event.target.closest("[data-session-tab]");
      if (tab) {
        // Clear focusIdea on any explicit tab switch.
        setQuery({ tab: tab.dataset.sessionTab, focusIdea: "" });
        return;
      }

      const filter = event.target.closest("[data-posts-filter]");
      if (filter) {
        setQuery({ postsFilter: filter.dataset.postsFilter });
        return;
      }

      const network = event.target.closest("[data-posts-network]");
      if (network) {
        setQuery({ postsNetwork: network.dataset.postsNetwork });
        return;
      }

      if (event.target.closest("[data-posts-clear]")) {
        setQuery({ postsFilter: "all", postsNetwork: "all" });
        return;
      }

      // Post card "Generate an image" placeholder → open the modal.
      const genImageBtn = event.target.closest("[data-generate-image]");
      if (genImageBtn) {
        event.preventDefault();
        const postId = genImageBtn.dataset.generateImage;
        openGenerateImageModal(postId, (imageUrl) => {
          attachImageToPost(postId, imageUrl);
          setQuery({ tab: "posts", focusPost: postId, postsFilter: "all", postsNetwork: "all" });
        });
        return;
      }

      // --- Context tab ---
      if (event.target.closest("[data-create-context]")) {
        navigate("/analyse");
        return;
      }
      const attachContext = event.target.closest("[data-attach-context]");
      if (attachContext) {
        setQuery({ tab: "context", contextId: attachContext.dataset.attachContext, detached: "", populated: "" });
        return;
      }
      const editCtx = event.target.closest("[data-edit-context]");
      if (editCtx) {
        navigate(`/analyse?contextId=${editCtx.dataset.editContext}`);
        return;
      }
      if (event.target.closest("[data-detach-context]")) {
        setQuery({ tab: "context", detached: "1", contextId: "", populated: "" });
        return;
      }
      const addComp = event.target.closest("[data-add-component]");
      if (addComp) {
        navigate(`/analyse/${addComp.dataset.addComponent}?stages=${addComp.dataset.addComponent}`);
        return;
      }

      // --- Assistant panel ---
      const promptBtn = event.target.closest("[data-assistant-prompt]");
      if (promptBtn && input) {
        input.value = promptBtn.dataset.assistantPrompt;
        input.focus();
        return;
      }

      if (event.target.closest("[data-assistant-send]")) {
        submitInput();
        return;
      }

      const rewritePost = event.target.closest("[data-post-rewrite]");
      if (rewritePost && input) {
        input.value = "Rewrite this post with a sharper hook and one concrete proof point.";
        input.focus();
        return;
      }

      if (event.target.closest("[data-assistant-attach-toggle]")) {
        if (attachMenu) attachMenu.hidden = !attachMenu.hidden;
        return;
      }

      const addSrc = event.target.closest("[data-add-source]");
      if (addSrc) {
        // library.js owns the full flow: source card → Processing → Processed
        // + extracted ideas + "Source intake" system notice + AI wrap-up turn.
        addSource(session.id, addSrc.dataset.addSource);
        closeAttachMenu();
        return;
      }

      // Click outside the attach menu → close it
      if (!event.target.closest(".assistant-attach")) {
        closeAttachMenu();
      }
    },
    { signal },
  );

  if (input) {
    input.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          submitInput();
        }
      },
      { signal },
    );
  }

  // Content workspace: live search input + sort dropdown. These update the
  // module-level contentState and re-render just the list body so the input
  // cursor and focus are preserved.
  root.addEventListener(
    "input",
    (event) => {
      if (event.target.matches("[data-content-search]")) {
        contentState.q = event.target.value;
        rerenderContentWorkspace(root, session);
      }
    },
    { signal },
  );
  root.addEventListener(
    "change",
    (event) => {
      if (event.target.matches("[data-content-sort]")) {
        contentState.sort = event.target.value;
        rerenderContentWorkspace(root, session);
      }
    },
    { signal },
  );
}
