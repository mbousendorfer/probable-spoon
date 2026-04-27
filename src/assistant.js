// Mocked conversational AI for the session assistant panel.
//
// Per-session thread state lives in a module-local Map (no persistence). Each
// send pushes a user turn + a placeholder AI turn, then resolves the
// placeholder to a scripted reply after a short simulated thinking delay.
//
// Subscribers re-render the thread DOM on any change — no global store.

import { ideas } from "./mocks.js?v=22";

const threads = new Map(); // sessionId → messages[]
const subscribers = new Map(); // sessionId → Set<(messages) => void>

let idCounter = 0;
function newId() {
  idCounter += 1;
  return `m-${Date.now().toString(36)}-${idCounter}`;
}

// --- Public API -----------------------------------------------------------

export function getThread(sessionId, { hasContext = false, skipGreeting = false } = {}) {
  if (!threads.has(sessionId)) {
    seedThread(sessionId, { hasContext, skipGreeting });
  }
  return threads.get(sessionId);
}

export function subscribe(sessionId, fn) {
  if (!subscribers.has(sessionId)) subscribers.set(sessionId, new Set());
  subscribers.get(sessionId).add(fn);
  return () => {
    const set = subscribers.get(sessionId);
    if (set) set.delete(fn);
  };
}

export function sendMessage(sessionId, text, options = {}) {
  if (!text || !text.trim()) return;
  const thread = getThread(sessionId);

  // System messages (e.g. source intake notices) render inline and don't
  // trigger an AI reply.
  if (options.role === "system") {
    thread.push({
      id: newId(),
      role: "system",
      meta: options.meta || "System",
      variant: options.variant || "grey",
      text: text.trim(),
      open: false,
      status: "ready",
      createdAt: Date.now(),
    });
    notify(sessionId);
    return;
  }

  // Regular user → AI exchange. We push three messages in order:
  //   1. user turn
  //   2. reasoning system-notice (mermaid-accented "Drafting" block) — open
  //      while loading, collapsed after reply
  //   3. placeholder AI bubble — hidden until the reply lands
  const userId = newId();
  const reasoningId = newId();
  const replyId = newId();

  thread.push({
    id: userId,
    role: "user",
    meta: "You",
    text: text.trim(),
    status: "ready",
    createdAt: Date.now(),
  });
  thread.push({
    id: reasoningId,
    role: "system",
    meta: "Drafting",
    variant: "mermaid",
    text: "Thinking through the best next move…",
    open: false,
    status: "loading",
    createdAt: Date.now(),
  });
  thread.push({
    id: replyId,
    role: "assistant",
    meta: "Archie",
    text: "",
    status: "loading",
    hidden: true,
    createdAt: Date.now(),
  });
  notify(sessionId);

  const delay = 900 + Math.round(Math.random() * 600);
  setTimeout(() => {
    const reply = mockAiReply({ prompt: text });
    const reasoning = thread.find((m) => m.id === reasoningId);
    if (reasoning) {
      reasoning.text = reply.reasoning;
      reasoning.status = "ready";
      reasoning.open = false; // collapse after the answer lands
    }
    const replyMsg = thread.find((m) => m.id === replyId);
    if (replyMsg) {
      replyMsg.text = reply.text;
      replyMsg.status = "ready";
      replyMsg.hidden = false;
    }
    notify(sessionId);
  }, delay);
}

// Push a ready-state AI Copilot turn directly (no user turn, no Drafting
// collapsible). Used by library.js to narrate the outcome of an extraction.
export function postAssistantMessage(sessionId, text, { meta = "Archie" } = {}) {
  const thread = getThread(sessionId);
  thread.push({
    id: newId(),
    role: "assistant",
    meta,
    text,
    status: "ready",
    createdAt: Date.now(),
  });
  notify(sessionId);
}

// Right-aligned "Source intake" turn — renders like a user turn but with a
// light electric-blue bubble containing a file icon + filename · size.
// Figma 25:1127/25:1131.
export function postSourceIntake(sessionId, { kind, filename, size }) {
  const thread = getThread(sessionId);
  thread.push({
    id: newId(),
    role: "source-intake",
    meta: "Source intake",
    kind,
    filename,
    size,
    status: "ready",
    createdAt: Date.now(),
  });
  notify(sessionId);
}

// Structured AI extraction result — Drafting pill ("Extracted N ideas") →
// "Analyzed <filename>" → N idea cards. Figma 25:1053 / 25:1057.
export function postExtractionResult(sessionId, { filename, ideas }) {
  const thread = getThread(sessionId);
  thread.push({
    id: newId(),
    role: "assistant",
    variant: "extraction",
    meta: "Archie",
    filename,
    ideas: ideas.map((i) => ({ id: i.id, title: i.title, body: i.body })),
    count: ideas.length,
    status: "ready",
    open: true,
    createdAt: Date.now(),
  });
  notify(sessionId);
}

// Push a "pending" marker to indicate the session is busy (e.g. while a source
// is being extracted). Renders as an inline "Extracting" notice in the thread
// (Figma 25:1413) and also drives the composer thinking chip via its
// status === "loading" tag. Returns an id so the caller can clear the marker
// when work finishes.
export function startPending(sessionId) {
  const thread = getThread(sessionId);
  const id = newId();
  thread.push({
    id,
    role: "pending",
    status: "loading",
    createdAt: Date.now(),
  });
  notify(sessionId);
  return id;
}

export function finishPending(sessionId, id) {
  const thread = getThread(sessionId);
  const msg = thread.find((m) => m.id === id);
  if (msg) {
    msg.status = "ready";
  }
  notify(sessionId);
}

// Push only a user bubble — no reasoning chip, no AI placeholder.
// Used by the draft flow so the user sees their intent echoed without
// triggering a generic AI reply.
export function postUserTurn(sessionId, text) {
  const thread = getThread(sessionId);
  thread.push({
    id: newId(),
    role: "user",
    meta: "You",
    text: text.trim(),
    status: "ready",
    createdAt: Date.now(),
  });
  notify(sessionId);
}

// Convenience alias — same implementation as postUserTurn but semantically
// signals "channel selection echo" at call sites.
export function postUserChoice(sessionId, { text }) {
  postUserTurn(sessionId, text);
}

// Push an "assistant-choice" turn that renders a set of toggle chips plus a
// submit button. Keeps the module generic — the handler string identifies
// what the click delegate in session.js should do on submit.
export function postAssistantChoice(
  sessionId,
  { text, choices, multi = true, handler = "", context = {}, submitLabel = "Submit" },
) {
  const thread = getThread(sessionId);
  thread.push({
    id: newId(),
    role: "assistant-choice",
    meta: "Archie",
    text,
    choices, // [{ value, label, icon }]
    selected: [],
    multi,
    handler,
    context,
    submitLabel,
    status: "ready",
    createdAt: Date.now(),
  });
  notify(sessionId);
}

// Freeze a choice message after the user submits — chips become read-only.
export function submitAssistantChoice(sessionId, messageId, selectedValues) {
  const thread = getThread(sessionId);
  const msg = thread.find((m) => m.id === messageId);
  if (!msg) return;
  msg.selected = selectedValues;
  msg.status = "answered";
  notify(sessionId);
}

// Structured "Drafted N posts" result turn. Reuses the extraction-turn chrome
// (mermaid pill + collapsible detail) but shows post mini-cards instead of
// idea cards.
export function postDraftResult(sessionId, { ideaTitle, drafts }) {
  const thread = getThread(sessionId);
  thread.push({
    id: newId(),
    role: "assistant",
    variant: "draft",
    meta: "Archie",
    ideaTitle,
    drafts: drafts.map((d) => ({
      id: d.id,
      network: d.network,
      preview: Array.isArray(d.text) ? d.text[0] : d.text,
    })),
    count: drafts.length,
    status: "ready",
    open: true,
    createdAt: Date.now(),
  });
  notify(sessionId);
}

export function pickSuggestedPrompts({ hasContext } = {}) {
  const base = [
    { title: "Find strongest signal", value: "Find the strongest post angle in this session" },
    { title: "Compare top ideas", value: "Compare the top two ideas and tell me which one is more actionable" },
    { title: "Generate LinkedIn post", value: "Turn the leading idea into a short LinkedIn draft" },
    { title: "What source next?", value: "What source should I add next to strengthen this sprint?" },
  ];
  if (!hasContext) {
    base[0] = {
      title: "Help me set a context",
      value: "Walk me through attaching a context for this session",
    };
  }
  return base;
}

// --- Internals ------------------------------------------------------------

function notify(sessionId) {
  const set = subscribers.get(sessionId);
  if (!set) return;
  // Expose a shallow copy so subscribers can't mutate the thread by accident.
  const snapshot = threads.get(sessionId).slice();
  set.forEach((fn) => fn(snapshot));
}

function seedThread(sessionId, { hasContext, skipGreeting }) {
  // Start-flow takes over the intro — skip the default greeting so we don't
  // double up "Hi —" + the flow's first AI turn.
  if (skipGreeting) {
    threads.set(sessionId, []);
    return;
  }

  const greeting = hasContext
    ? "Hi — I can compare ideas, pick the strongest signal, or draft a post. Pick a suggestion below, type a question, or drop a source."
    : "Hi — I'll help you pick sources, sharpen angles, and draft posts. Attach a context (Voice, Brief, Brand) any time to make my suggestions sharper.";

  threads.set(sessionId, [
    {
      id: newId(),
      role: "assistant",
      meta: "Archie",
      text: greeting,
      status: "ready",
      createdAt: Date.now(),
    },
  ]);
}

// Scripted mock replies. Ported from the old prototype (src/mock-generators.js),
// extended to return a { text, reasoning } pair — `reasoning` is shown in the
// mermaid-accented "Drafting" collapsible above the answer.
function mockAiReply({ prompt }) {
  const leadIdea = ideas.find((i) => i.pinned) || ideas[0] || null;
  const otherIdea = ideas.find((i) => i.id !== leadIdea?.id) || null;
  const ideaCount = ideas.length;

  if (!leadIdea) {
    return {
      reasoning: "No sources attached in this session yet, so there's nothing to rank or draft from.",
      text: "I don't have enough source material in this session yet. Add a source first and I can extract ideas, compare angles, or draft a post.",
    };
  }

  if (/draft|generate|post|linkedin|twitter|\bx\b/i.test(prompt)) {
    return {
      reasoning: `Scanned ${ideaCount} extracted ideas, ranked by confidence and relevance. "${leadIdea.title}" came out on top (${leadIdea.confidence}% confidence) — composing a post draft grounded in its source.`,
      text: `The best post candidate is "${leadIdea.title}". I'd open with the concrete change, add one proof signal from the source, then close with a specific takeaway readers can try this week.`,
    };
  }

  if (/compare|versus|\bvs\b/i.test(prompt) && otherIdea) {
    const stronger = leadIdea.confidence >= otherIdea.confidence ? leadIdea : otherIdea;
    const weaker = stronger.id === leadIdea.id ? otherIdea : leadIdea;
    return {
      reasoning: `Compared confidence + relevance between "${leadIdea.title}" (${leadIdea.confidence}%) and "${otherIdea.title}" (${otherIdea.confidence}%). Picked the higher-confidence, more specific angle to lead with.`,
      text: `Between "${leadIdea.title}" and "${otherIdea.title}", I'd move forward with "${stronger.title}" first — clearer proof point and a higher confidence signal. Keep "${weaker.title}" as a supporting beat or follow-up draft.`,
    };
  }

  if (/pin|priority|strongest|signal|actionable/i.test(prompt)) {
    return {
      reasoning: `Looked across ${ideaCount} ideas for the one closest to "specific, believable, publishable". "${leadIdea.title}" scored highest on all three.`,
      text: `The strongest signal right now is "${leadIdea.title}" — specific, believable, and close to publishable. I'd pin it, pressure-test it against one secondary angle, then draft the first post.`,
    };
  }

  if (/source|pdf|video|url|attach|add/i.test(prompt)) {
    return {
      reasoning:
        "Reviewed current source coverage and the ideas already extracted — most are derived from marketing-adjacent material.",
      text: "Drop one more source to pressure-test the current angle — ideally something that isn't a marketing post. A transcript, a product retro, or a customer interview will shift the signal fastest.",
    };
  }

  return {
    reasoning: `Reviewed session state: ${ideaCount} ideas extracted, strongest being "${leadIdea.title}". No draft in progress.`,
    text: `I can keep working inside this session. My recommendation: tighten the angle in the Library tab, confirm the strongest idea, then generate a draft so the post stays grounded in the source context. "${leadIdea.title}" is the one I'd start with.`,
  };
}
