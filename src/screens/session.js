import { html, raw } from "../utils.js?v=20";
import { navigate } from "../router.js?v=20";
import { renderTopbar } from "../components/topbar.js?v=21";
import {
  getSessionById,
  getContextById,
  contextComponentsFor,
  contexts as allContexts,
  socialAccounts,
  recentSessions,
} from "../mocks.js?v=22";
import { isNewUser } from "../user-mode.js?v=20";
import {
  getThread,
  sendMessage,
  pickSuggestedPrompts,
  postAssistantMessage,
  subscribe,
  submitAssistantChoice,
} from "../assistant.js?v=21";
import { getSources, getIdeas, subscribe as subscribeLibrary, addSource } from "../library.js?v=20";
import { getPosts, attachImageToDraft, subscribe as subscribePostsStore } from "../posts-store.js?v=20";
import { startDraftFlow, executeDraft } from "../draft-flow.js?v=20";
import { startContextBuildFlow, startActionPickerFlow, handleActionPick } from "../start-flow.js?v=22";
import * as sidebarWizard from "../sidebar-wizard.js?v=29";
import * as inlineQuestion from "../inline-question.js?v=20";
import { renderPicker, bindWizardKeyboard, unbindWizardKeyboard } from "./_analyse-common.js?v=24";
import { renderSourceCard } from "../components/source-card.js?v=22";
import { renderIdeaCard } from "../components/idea-card.js?v=23";
import {
  contentState,
  renderContentWorkspace as renderSharedContentWorkspace,
  rerenderContentWorkspaceBody,
  renderContentEmptyState,
} from "../components/content-workspace.js?v=20";
import { open as openGenerateImageModal } from "../components/generate-image-modal.js?v=20";
import { open as openSettingsDrawer } from "../components/settings-drawer.js?v=21";
import { open as openChatPickerModal } from "../components/chat-picker-modal.js?v=20";

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
  return {
    tab: params.get("tab") || "posts",
    populated: params.get("populated") === "1" || params.get("populated") === "true",
    title: params.get("title") || "",
    contextId: params.get("contextId") || "",
    detached: params.get("detached") === "1" || params.get("detached") === "true",
    postsFilter: params.get("postsFilter") || "all",
    postsNetwork: params.get("postsNetwork") || "all",
    focusIdea: params.get("focusIdea") || "",
    focusPost: params.get("focusPost") || "",
    focusSource: params.get("focusSource") || "",
    view: params.get("view") || "sources",
  };
}

// Search query + sort live in the shared content-workspace module — same
// state in the dashboard's start screen and the in-session Content tab.

function setQuery(next) {
  const current = readQuery();
  const merged = { ...current, ...next };
  Object.keys(merged).forEach((key) => {
    if (merged[key] == null || merged[key] === "" || merged[key] === false) delete merged[key];
  });
  const qs = new URLSearchParams(merged).toString();
  const sessionId = getActiveSessionIdFromHash();
  navigate(`/session/${sessionId}?${qs}`);
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
  wireAssistantPanel(target, session, attachedContext);
}

function renderAssistantPanel(session, attachedContext) {
  // Skip the default greeting if a start flow is queued — its first AI bubble
  // will introduce the conversation instead. (Read-only: don't consume the
  // flag here; the bindSession handoff below clears it after dispatching.)
  const hasPendingStartFlow = !!sessionStorage.getItem("pendingStartFlow");
  const thread = getThread(session.id, {
    hasContext: !!attachedContext,
    skipGreeting: hasPendingStartFlow,
  });
  const prompts = pickSuggestedPrompts({ hasContext: !!attachedContext });

  // Wizard mode — when sidebar-wizard has state for this session, replace the
  // normal thread + composer with the analyse-style wizard chrome.
  if (sidebarWizard.isActive(session.id)) {
    return renderAssistantPanelWizard(session);
  }
  // Inline single-question mode — same chrome as the wizard but for one-shot
  // pickers (e.g. "Which profile to draft for?").
  if (inlineQuestion.isActive(session.id)) {
    return renderAssistantPanelQuestion(session);
  }

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

// Wizard chrome — replaces the normal thread + suggestions + composer when
// sidebar-wizard is active. Reuses the analyse-* picker rendering and
// keyboard binding so the UX is identical to the standalone /analyse routes.
function renderAssistantPanelWizard(session) {
  const chrome = sidebarWizard.renderChrome(session.id);
  if (!chrome) return "";
  return html`
    <aside class="session__assistant session__assistant--wizard" aria-label="Assistant panel">
      <div class="session__assistant-wizard-chat analyse__chat" id="sidebarWizardChat">
        <div class="analyse__chat-inner">${raw(chrome.body)}</div>
      </div>
      <div class="analyse__sticky-bar session__assistant-wizard-bar" role="group" aria-label="Answer">
        <div class="analyse__sticky-bar-inner">
          ${raw(chrome.picker ? renderPicker(chrome.picker) : "")}
          <p class="analyse__hints muted">
            <kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>1</kbd>–<kbd>9</kbd> pick · <kbd>Enter</kbd> submit ·
            <kbd>Esc</kbd> exit
          </p>
        </div>
      </div>
    </aside>
  `;
}

// Inline question chrome — same shell as the wizard but for one-shot pickers.
function renderAssistantPanelQuestion(session) {
  const chrome = inlineQuestion.renderChrome(session.id);
  if (!chrome) return "";
  return html`
    <aside class="session__assistant session__assistant--wizard" aria-label="Assistant panel">
      <div class="session__assistant-wizard-chat analyse__chat" id="inlineQuestionChat">
        <div class="analyse__chat-inner">${raw(chrome.body)}</div>
      </div>
      <div class="analyse__sticky-bar session__assistant-wizard-bar" role="group" aria-label="Answer">
        <div class="analyse__sticky-bar-inner">
          ${raw(chrome.picker ? renderPicker(chrome.picker) : "")}
          <p class="analyse__hints muted">
            <kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>1</kbd>–<kbd>9</kbd> pick · <kbd>Enter</kbd> submit ·
            <kbd>Esc</kbd> exit
          </p>
        </div>
      </div>
    </aside>
  `;
}

// Build + show the "What would you like to know about this source?" inline
// question. Triggered after the user clicks "Ask" on a source card and
// picks the chat to ask in. Suggested prompts + a free-text custom row.
function askWhatToKnow(sessionId, filename) {
  inlineQuestion.ask(sessionId, {
    intro: `What would you like to know about ${filename}?`,
    title: filename || "About this source",
    stepLabel: "Source",
    items: [
      { value: "What's the main takeaway?", label: "What's the main takeaway?", icon: "ap-icon-sparkles" },
      { value: "Summarize this in 3 bullet points.", label: "Summarize in 3 bullets", icon: "ap-icon-numbered-list" },
      { value: "Find a contrarian angle worth posting.", label: "Find a contrarian angle", icon: "ap-icon-bolden" },
    ],
    customPlaceholder: "Type your own question…",
    onPick: (text) => sendMessage(sessionId, text),
    onCustom: (text) => sendMessage(sessionId, text),
    onSkip: () => {},
  });
}

// Triggered from a source card's "Ask" button — routes through the chat
// picker the same way "Draft Post" does, then the chosen session shows
// the askWhatToKnow inline question.
function startAskFlowFromSession(sessionId, sourceId, filename) {
  const handoff = (choice) => {
    if (choice.kind === "existing" && choice.session.id === sessionId) {
      // Already in the picked chat — skip the navigation and ask now.
      askWhatToKnow(sessionId, filename);
      return;
    }
    sessionStorage.setItem("pendingAskSource", JSON.stringify({ sourceId, filename }));
    if (choice.kind === "new") {
      const qs = new URLSearchParams({ tab: "posts", title: defaultChatNameLocal() });
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
}

// Local copy of dashboard's defaultChatName — keeps session.js standalone
// without a circular import for a 5-line helper.
function defaultChatNameLocal() {
  const fmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `Chat · ${fmt.format(new Date())}`;
}

// Build + show the "Which profile?" question. Used both from the in-session
// Draft Post button and from the dashboard's Draft Post handler (via the
// pendingDraftIdeaId hand-off in sessionStorage).
function askProfileQuestion(sessionId, ideaId) {
  const connected = socialAccounts.filter((a) => a.status === "connected");
  if (connected.length === 0) {
    postAssistantMessage(
      sessionId,
      "You don't have any connected social profiles yet. Open Settings → Social accounts to connect one, then come back to draft.",
    );
    return;
  }
  inlineQuestion.ask(sessionId, {
    intro: "Which profile should I draft this for?",
    title: "Pick a connected social profile",
    stepLabel: "Profile",
    items: connected.map((a) => ({
      value: a.id,
      label: a.platformLabel,
      caption: a.handle ? (a.kind ? `${a.kind} · ${a.handle}` : a.handle) : a.kind || "",
      imgSrc: a.logo,
    })),
    onPick: (accountId) => {
      sessionStorage.setItem("pendingDraftAccountId", accountId);
      startDraftFlow(sessionId, ideaId);
    },
    onSkip: () => {
      // Just exit the question — no draft started, no error.
    },
  });
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

  // Draft result — "Drafted N posts" mermaid-pill + mini post cards.
  if (message.role === "assistant" && message.variant === "draft") {
    return renderDraftTurn(message);
  }

  // Channel-picker choice turn — chip row + "Draft them" button.
  if (message.role === "assistant-choice") {
    return renderChoiceTurn(message);
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

function wireAssistantPanel(root, session, attachedContext) {
  // Tear down any subscriptions attached to the previous render.
  if (currentUnsubscribe) {
    currentUnsubscribe();
    currentUnsubscribe = null;
  }
  stopThinkingTimer();

  // The assistant aside (and thread inside it) gets replaced wholesale
  // when sidebarWizard / inlineQuestion subscribers re-render the panel.
  // Querying lazily inside the subscriber keeps writes hitting the live
  // DOM node instead of an orphaned one.
  const getThreadEl = () => root.querySelector("[data-assistant-thread]");
  {
    const thread = getThreadEl();
    if (thread) {
      queueMicrotask(() => {
        thread.scrollTop = thread.scrollHeight;
      });
    }
  }

  // Initial chip sync (in case the thread already has a loading message
  // carried over from a prior render, e.g. after a tab switch).
  updateThinkingChip(session.id);

  // Subscribe to the assistant thread.
  const offThread = subscribe(session.id, (messages) => {
    const thread = getThreadEl();
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

  // Subscribe to sidebar-wizard state — when state changes, re-render the
  // entire assistant panel (wizard chrome <-> normal thread+composer) and
  // re-bind keyboard nav for the wizard picker.
  const rebindWizardKeyboardIfActive = () => {
    const aside = root.querySelector(".session__assistant");
    if (!aside) return;
    if (sidebarWizard.isActive(session.id)) {
      bindWizardKeyboard(aside, {
        handler: "wizard-answer",
        onExit: () => {
          unbindWizardKeyboard();
          sidebarWizard.exit(session.id);
        },
        onCustomSubmit: (value) => {
          sidebarWizard.answer(session.id, "other", value);
        },
        onMultiSubmit: (selectedValues) => {
          sidebarWizard.answer(session.id, selectedValues);
        },
      });
    } else if (inlineQuestion.isActive(session.id)) {
      bindWizardKeyboard(aside, {
        handler: "inline-question",
        onExit: () => {
          unbindWizardKeyboard();
          inlineQuestion.skip(session.id);
        },
        onCustomSubmit: (value) => {
          inlineQuestion.submitCustom(session.id, value);
        },
      });
    } else {
      unbindWizardKeyboard();
    }
  };
  const refreshAssistantAside = () => {
    const aside = root.querySelector(".session__assistant");
    const screen = aside?.parentElement;
    if (screen) {
      const fresh = renderAssistantPanel(session, attachedContext);
      const tmp = document.createElement("div");
      tmp.innerHTML = fresh;
      const newAside = tmp.firstElementChild;
      if (newAside && aside) {
        screen.replaceChild(newAside, aside);
      }
    }
    rebindWizardKeyboardIfActive();
  };
  const offWizard = sidebarWizard.subscribe(session.id, refreshAssistantAside);
  const offInlineQuestion = inlineQuestion.subscribe(session.id, refreshAssistantAside);
  // Initial bind in case the panel was rendered with wizard / question mode on.
  rebindWizardKeyboardIfActive();

  // Subscribe to posts-store changes — re-render the Posts tab if active.
  const offPosts = subscribePostsStore(session.id, () => {
    const body = root.querySelector("[data-tab-body]");
    if (!body || body.dataset.tabBody !== "posts") return;
    body.innerHTML = renderPopulatedPosts(readQuery(), session.id);
    // Focus the newest draft (first post in the store) if it was just added.
    const firstCard = body.querySelector(".posts__card");
    if (firstCard) {
      firstCard.classList.add("is-focused");
      firstCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(() => firstCard.classList.remove("is-focused"), 1600);
    }
  });

  // Apply idea focus on initial render if ?focusIdea= is present.
  applyIdeaFocus(root);

  // Check for a pending draft intent set by the dashboard handler — start the
  // conversational flow after subscriptions are active so thread updates show.
  const pendingIdeaId = sessionStorage.getItem("pendingDraftIdeaId");
  if (pendingIdeaId) {
    sessionStorage.removeItem("pendingDraftIdeaId");
    setTimeout(() => askProfileQuestion(session.id, pendingIdeaId), 100);
  }

  // Hand-off from a source card's "Ask" button on the dashboard or another
  // session — open the askWhatToKnow inline question in this freshly mounted
  // chat.
  const pendingAskRaw = sessionStorage.getItem("pendingAskSource");
  if (pendingAskRaw) {
    sessionStorage.removeItem("pendingAskSource");
    try {
      const { filename } = JSON.parse(pendingAskRaw);
      setTimeout(() => askWhatToKnow(session.id, filename), 150);
    } catch {
      // Malformed JSON — silently skip.
    }
  }

  // Pending start flow set by the dashboard's New chat button. Same handoff
  // pattern as pendingDraftIdeaId — read, clear, dispatch with a tiny delay
  // so the assistant subscriber is wired up before turns get pushed.
  const pendingStartRaw = sessionStorage.getItem("pendingStartFlow");
  if (pendingStartRaw) {
    sessionStorage.removeItem("pendingStartFlow");
    try {
      const pendingStart = JSON.parse(pendingStartRaw);
      setTimeout(() => {
        if (pendingStart.hasContext) {
          startActionPickerFlow(session.id, { contextName: pendingStart.contextName });
        } else {
          startContextBuildFlow(session.id);
        }
      }, 200);
    } catch {
      // Malformed JSON — silently skip; no harm done.
    }
  }

  currentUnsubscribe = () => {
    offThread();
    offLibrary();
    offPosts();
    offWizard();
    offInlineQuestion();
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
    // Show the populated view if this is a real session, if there's a focused
    // post (e.g. just navigated here), or if the posts store already has posts
    // (a draft was generated for this session).
    const hasPosts = getPosts(session.id).length > 0;
    if (isRealSession || q.focusPost || hasPosts) return renderPopulatedPosts(q, session.id);
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
      return renderContentEmptyState();
    }
    return renderSharedContentWorkspace({
      sources: libSources,
      ideas: libIdeas,
      view: q.view === "ideas" ? "ideas" : "sources",
    });
  }

  return renderEmptyState({
    icon: "ap-icon-sparkles",
    title: "Ideas appear here",
    body: "Once Archie has a source, it will surface content ideas you can draft posts from.",
  });
}

// Thin wrapper around the shared rerenderContentWorkspaceBody — keeps the
// session.js call sites unchanged while the actual rendering lives in the
// shared module.
function rerenderContentWorkspace(root, session) {
  const q = readQuery();
  if (q.tab !== "content") return;
  rerenderContentWorkspaceBody(root, {
    sources: getSources(session.id),
    ideas: getIdeas(session.id),
    view: q.view === "ideas" ? "ideas" : "sources",
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

function renderPopulatedPosts(q, sessionId) {
  const sessionPosts = getPosts(sessionId);

  const filterCounts = {
    all: sessionPosts.length,
    needs_fixes: sessionPosts.filter((p) => p.status === "needs_fixes").length,
    scheduled: sessionPosts.filter((p) => p.status === "scheduled").length,
  };
  const networkCounts = {
    all: sessionPosts.length,
    linkedin: sessionPosts.filter((p) => p.network === "linkedin").length,
    twitter: sessionPosts.filter((p) => p.network === "twitter").length,
  };

  const filtered = sessionPosts.filter((p) => {
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

function renderPostErrors(post) {
  if (!post.errors?.length) return "";
  const body =
    post.errors.length === 1
      ? post.errors[0].message
      : `<ul class="posts__card-errors-list">${post.errors.map((e) => `<li>${e.message}</li>`).join("")}</ul>`;
  return `
    <div class="ap-infobox error" role="alert">
      <i class="ap-icon-error_fill" aria-hidden="true"></i>
      <div class="ap-infobox-content">
        <div class="ap-infobox-texts">
          <span class="ap-infobox-message">${body}</span>
        </div>
      </div>
    </div>
  `;
}

function renderPostScheduled(post) {
  if (post.status !== "scheduled") return "";
  const when = post.scheduledForLabel || "later";
  return `
    <div class="ap-status-card orange">
      <div class="upper">
        <i class="ap-icon-calendar" aria-hidden="true"></i>
        <div class="flow"><span>Scheduled</span> ${when}</div>
      </div>
    </div>
  `;
}

function renderPostCard(post, q = {}) {
  const statusPill = (() => {
    // "needs_fixes" surfaces above the card via renderPostErrors — no header pill.
    // "scheduled" surfaces above the card via renderPostScheduled — no header pill.
    if (post.status === "needs_fixes" || post.status === "scheduled") return "";
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

      <div class="posts__card-wrap">
        ${raw(renderPostErrors(post))} ${raw(renderPostScheduled(post))}
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
      </div>

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

// Channel-picker choice turn — chips toggle on click, "Draft them" submits.
function renderChoiceTurn(message) {
  const isAnswered = message.status === "answered";
  const chips = (message.choices || [])
    .map((c) => {
      const isSelected = (message.selected || []).includes(c.value);
      const selectedClass = isSelected ? " is-selected" : "";
      if (isAnswered) {
        return `<span class="chat-bubble-choice-chip${selectedClass}">
          <i class="${c.icon}" aria-hidden="true"></i>
          <span>${c.label}</span>
        </span>`;
      }
      return `<button
        type="button"
        class="chat-bubble-choice-chip${selectedClass}"
        data-assistant-choice="${c.value}"
        data-assistant-choice-msg="${message.id}"
        aria-pressed="${isSelected ? "true" : "false"}"
      >
        <i class="${c.icon}" aria-hidden="true"></i>
        <span>${c.label}</span>
      </button>`;
    })
    .join("");

  const submitLabel = message.submitLabel || "Submit";
  const footer = isAnswered
    ? ""
    : `<div class="chat-bubble-choices-footer">
        <button
          type="button"
          class="ap-button primary orange"
          data-assistant-choice-submit="${message.id}"
        >
          <span>${submitLabel}</span>
        </button>
      </div>`;

  return `
    <div class="chat-turn chat-turn--ai">
      <i class="ap-icon-sparkles-mermaid chat-turn-avatar" aria-hidden="true"></i>
      <div class="chat-bubble chat-bubble--ai">
        <p class="chat-bubble-text">${message.text}</p>
        <div class="chat-bubble-choices">${chips}</div>
        ${footer}
      </div>
    </div>
  `;
}

// Structured "Drafted N posts" result — mirrors the extraction turn chrome.
const NETWORK_ICON = {
  linkedin: "ap-icon-linkedin",
  twitter: "ap-icon-twitter-official",
  x: "ap-icon-twitter-official",
  instagram: "ap-icon-instagram",
};

function networkLabel(network) {
  if (network === "twitter") return "X";
  if (!network) return "";
  return network.charAt(0).toUpperCase() + network.slice(1);
}

function renderDraftTurn(message) {
  const openAttr = message.open === false ? "" : " open";
  const count = message.count ?? (message.drafts ? message.drafts.length : 0);

  const miniCards = (message.drafts || [])
    .map(
      (d) => `
        <div class="ap-card draft-turn__post-card">
          <div class="draft-turn__post-header">
            <i class="${NETWORK_ICON[d.network] || "ap-icon-megaphone"}" aria-hidden="true"></i>
            <span>${networkLabel(d.network)}</span>
          </div>
          <p class="draft-turn__post-preview">${d.preview || ""}</p>
          <a href="#" class="ap-link standalone small" data-go-to-posts>
            <span>View in Posts</span>
            <i class="ap-icon-external-link"></i>
          </a>
        </div>
      `,
    )
    .join("");

  return `
    <div class="chat-turn chat-turn--ai chat-turn--extraction">
      <details class="assistant-notice assistant-notice--mermaid"${openAttr}>
        <summary class="assistant-notice__toggle">
          <span class="ap-status mermaid">Drafted ${count} post${count === 1 ? "" : "s"}</span>
          <i class="ap-icon-chevron-down assistant-notice__chevron"></i>
        </summary>
        <div class="extraction-turn__detail">
          <div class="extraction-turn__analyzed-row">
            <strong>From idea</strong>
            <span>${message.ideaTitle || ""}</span>
          </div>
          ${miniCards}
        </div>
      </details>
    </div>
  `;
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
        <a class="ap-link small" href="#" data-manage-contexts>Manage all contexts in Settings →</a>
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

  // The assistant aside (and its attach menu) gets replaced wholesale on
  // sidebarWizard / inlineQuestion / library subscribe callbacks. Holding a
  // reference here would bind to a detached node — query lazily instead.
  function getAttachMenu() {
    return root.querySelector("[data-assistant-attach-menu]");
  }

  function closeAttachMenu() {
    const menu = getAttachMenu();
    if (menu) menu.hidden = true;
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

      // Sidebar wizard option click — single-select advances immediately,
      // multi-select toggles the row and waits for the Submit button.
      const wizardOption = event.target.closest("[data-wizard-answer]");
      if (wizardOption) {
        event.preventDefault();
        const opts = wizardOption.closest(".analyse__options");
        if (opts?.dataset.multi !== undefined) {
          const wasSelected = wizardOption.classList.contains("is-selected");
          wizardOption.classList.toggle("is-selected", !wasSelected);
          wizardOption.setAttribute("aria-pressed", !wasSelected ? "true" : "false");
        } else {
          sidebarWizard.answer(session.id, wizardOption.dataset.wizardAnswer);
        }
        return;
      }

      // Multi-select submit — collect every .is-selected in the picker and
      // hand the array to the wizard as the answer value.
      const wizardSubmitBtn = event.target.closest("[data-wizard-answer-submit]");
      if (wizardSubmitBtn) {
        event.preventDefault();
        const opts = wizardSubmitBtn.closest(".analyse__options");
        const selected = opts
          ? Array.from(opts.querySelectorAll("[data-wizard-answer].is-selected")).map((el) => el.dataset.wizardAnswer)
          : [];
        if (selected.length) sidebarWizard.answer(session.id, selected);
        return;
      }

      // Skip button — bumps the wizard to the next stage's intake (or to
      // the memorize step if this was the last stage).
      if (event.target.closest("[data-wizard-answer-skip]")) {
        event.preventDefault();
        sidebarWizard.skipStage(session.id);
        return;
      }

      // Inline single-question pick / skip / custom-submit.
      const inlineQuestionBtn = event.target.closest("[data-inline-question]");
      if (inlineQuestionBtn) {
        event.preventDefault();
        inlineQuestion.pick(session.id, inlineQuestionBtn.dataset.inlineQuestion);
        return;
      }
      if (event.target.closest("[data-inline-question-skip]")) {
        event.preventDefault();
        inlineQuestion.skip(session.id);
        return;
      }
      const inlineQuestionCustomSubmit = event.target.closest("[data-inline-question-custom-submit]");
      if (inlineQuestionCustomSubmit) {
        event.preventDefault();
        const input = inlineQuestionCustomSubmit
          .closest(".analyse__options")
          ?.querySelector("[data-inline-question-custom]");
        const value = input?.value?.trim();
        if (value) inlineQuestion.submitCustom(session.id, value);
        return;
      }

      // Channel-picker chip toggle — visual only, no state change yet.
      const choiceChip = event.target.closest("[data-assistant-choice]");
      if (choiceChip && choiceChip.tagName === "BUTTON") {
        event.preventDefault();
        const wasSelected = choiceChip.classList.contains("is-selected");
        choiceChip.classList.toggle("is-selected", !wasSelected);
        choiceChip.setAttribute("aria-pressed", !wasSelected ? "true" : "false");
        return;
      }

      // "Draft them" submit — freeze the choice message + run executeDraft.
      const submitChoiceBtn = event.target.closest("[data-assistant-choice-submit]");
      if (submitChoiceBtn) {
        event.preventDefault();
        const msgId = submitChoiceBtn.dataset.assistantChoiceSubmit;
        const thread = getThread(session.id);
        const msg = thread.find((m) => m.id === msgId);
        if (!msg) return;
        // Collect selected chip values from the DOM.
        const bubble = submitChoiceBtn.closest(".chat-bubble");
        const selectedValues = bubble
          ? [...bubble.querySelectorAll("button.chat-bubble-choice-chip.is-selected")]
              .map((c) => c.dataset.assistantChoice)
              .filter(Boolean)
          : [];
        if (selectedValues.length === 0) return; // nothing selected — no-op
        submitAssistantChoice(session.id, msgId, selectedValues);
        if (msg.handler === "draft-channels" && msg.context?.ideaId) {
          executeDraft(session.id, msg.context.ideaId, selectedValues);
        } else if (msg.handler === "start-action") {
          handleActionPick(session.id, msg, selectedValues, { setQuery });
        }
        return;
      }

      // "View in Posts" link inside a draft result turn.
      if (event.target.closest("[data-go-to-posts]")) {
        event.preventDefault();
        setQuery({ tab: "posts", postsFilter: "all", postsNetwork: "all" });
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

      // "Ask" inside a source card → open the chat picker (same UX as
      // Draft Post), then show the askWhatToKnow inline question in the
      // chosen chat.
      const askBtn = event.target.closest("[data-source-ask]");
      if (askBtn) {
        event.preventDefault();
        const sourceId = askBtn.dataset.sourceAsk;
        const src = getSources(session.id).find((s) => s.id === sourceId);
        if (!src) return;
        startAskFlowFromSession(session.id, sourceId, src.filename);
        return;
      }

      // Source overflow menu → no-op for the prototype.
      if (event.target.closest("[data-source-more]")) {
        event.preventDefault();
        return;
      }

      // Idea-card source chips — navigate to the source within this session.
      const openSrc = event.target.closest("[data-source-open]");
      if (openSrc) {
        event.preventDefault();
        setQuery({ tab: "content", view: "sources", focusSource: openSrc.dataset.sourceOpen });
        return;
      }

      // Idea-card title click → "Open idea": give the card a visual pulse
      // (dossier view is future work). Pin + more-menu behavior is
      // encapsulated inside src/components/idea-card.js.
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
        if (ideaId) askProfileQuestion(session.id, ideaId);
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
          attachImageToDraft(session.id, postId, imageUrl);
          setQuery({ tab: "posts", focusPost: postId, postsFilter: "all", postsNetwork: "all" });
        });
        return;
      }

      // --- Context tab ---
      if (event.target.closest("[data-create-context]")) {
        navigate("/analyse");
        return;
      }
      if (event.target.closest("[data-manage-contexts]")) {
        event.preventDefault();
        openSettingsDrawer({ section: "contexts" });
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
        const menu = getAttachMenu();
        if (menu) menu.hidden = !menu.hidden;
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
