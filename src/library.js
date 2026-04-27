// Per-session ideas state + the scripted "Add PDF / video / URL" flow
// behind the session composer's inline `+` menu. Sources live in the
// global sources-stream store (so a source added from any session also
// shows up on the dashboard and in every other session); ideas stay
// per-session here.
//
// Public API:
//   getSources(_sessionId) → Source[]   (delegates to sources-stream)
//   getIdeas(sessionId)    → Idea[]
//   subscribe(sessionId, fn) → unsubscribe   payload: { sources, ideas }
//   addSource(sessionId, kind)  kicks off the mocked add → extract flow

import { ideas as seedIdeas } from "./mocks.js?v=22";
import { isNewUser } from "./user-mode.js?v=20";
import {
  postAssistantMessage,
  postExtractionResult,
  postSourceIntake,
  startPending,
  finishPending,
} from "./assistant.js?v=21";
import {
  getSources as streamGetSources,
  subscribeSources,
  pushScriptedSource,
  completeScriptedSource,
} from "./sources-stream.js?v=20";

// --- Module state -------------------------------------------------------

const ideasMap = new Map(); // sessionId → Idea[]
const subscribers = new Map(); // sessionId → Set<fn>

// Stream sources are global — re-emit any change to every session that's
// currently subscribing so their Content tab repaints.
subscribeSources(() => {
  for (const sessionId of subscribers.keys()) notify(sessionId);
});

let idCounter = 0;
function newId(prefix) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

// --- Public API ---------------------------------------------------------

export function getSources(_sessionId) {
  return streamGetSources();
}

export function getIdeas(sessionId) {
  if (!ideasMap.has(sessionId)) seed(sessionId);
  return ideasMap.get(sessionId);
}

export function subscribe(sessionId, fn) {
  if (!subscribers.has(sessionId)) subscribers.set(sessionId, new Set());
  subscribers.get(sessionId).add(fn);
  return () => {
    const set = subscribers.get(sessionId);
    if (set) set.delete(fn);
  };
}

export function addSource(sessionId, kind) {
  const script = SCRIPTS[kind];
  if (!script) return;

  // Make sure ideas are seeded before we prepend to them.
  getIdeas(sessionId);

  // 1. Push the source through the global store in "Processing" state.
  const sourceId = pushScriptedSource({
    filename: script.filename,
    kind: script.kindLabel,
  });

  // 2. Right-aligned "Source intake" turn with file icon + filename · size.
  postSourceIntake(sessionId, {
    kind,
    filename: script.filename,
    size: script.size,
  });

  // 2b. Flip the composer into "thinking" mode for the duration of the
  // extraction. Hidden pending marker — never rendered as a turn.
  const pendingId = startPending(sessionId);

  // 3. Simulate extraction — ~15s so the thinking chip has time to tick
  // through the "Xs · N credits" live counter.
  const delay = 14500 + Math.round(Math.random() * 1000);
  setTimeout(() => {
    // Flip the source to Processed in the global store. notifySources()
    // inside completeScriptedSource fans out to every session subscriber.
    completeScriptedSource(sourceId, {
      signal: script.signal,
      signalColor: script.signalColor,
      ideaCount: script.ideas.length,
    });

    // Prepend the extracted ideas (per-session).
    const extracted = script.ideas.map((seed) => ({
      id: newId("idea"),
      title: seed.title,
      body: seed.body,
      rationale: seed.rationale,
      relevance: seed.relevance,
      relevanceColor: seed.relevanceColor,
      confidence: seed.confidence,
      channels: seed.channels || ["linkedin"],
      state: "New",
      pinned: false,
      sourceIds: [sourceId],
      extractedAt: "just now",
    }));
    ideasMap.get(sessionId).unshift(...extracted);

    // Structured extraction turn — Drafting pill ("Extracted N ideas") +
    // "Analyzed <filename>" + one idea card per extracted idea.
    if (extracted.length > 0) {
      postExtractionResult(sessionId, {
        filename: script.filename,
        ideas: extracted,
      });
    } else {
      postAssistantMessage(sessionId, `Scanned ${script.filename} but didn't find a clear idea to pull.`);
    }

    finishPending(sessionId, pendingId);
    notify(sessionId);
  }, delay);
}

// --- Internals ----------------------------------------------------------

function seed(sessionId) {
  const fresh = isNewUser();
  ideasMap.set(sessionId, fresh ? [] : seedIdeas.map((i) => ({ ...i })));
}

function notify(sessionId) {
  const set = subscribers.get(sessionId);
  if (!set) return;
  const payload = {
    sources: streamGetSources().slice(),
    ideas: (ideasMap.get(sessionId) || []).slice(),
  };
  set.forEach((fn) => fn(payload));
}

// --- Per-kind mock scripts ---------------------------------------------

const SCRIPTS = {
  pdf: {
    kindLabel: "PDF",
    filename: "Q2-offsite-notes.pdf",
    size: "1.2mb",
    signal: "High signal",
    signalColor: "orange",
    ideas: [
      {
        title: "Three constraints that killed our first launch",
        body: "A candid retro framed around the three bottlenecks the team kept underestimating: scope, distribution, onboarding.",
        rationale:
          "Concrete and personal — operator retros are the kind of post readers save and reread. Strong pull on discussion.",
        relevance: "High relevance",
        relevanceColor: "orange",
        confidence: 92,
        channels: ["linkedin"],
      },
      {
        title: "Why we stopped writing quarterly OKRs",
        body: "Contrarian take grounded in the offsite notes — frames OKRs as a lagging signal rather than a tool for focus.",
        rationale:
          "A contrarian frame on a rituals-heavy topic. High comment potential from teams with their own OKR scars.",
        relevance: "High relevance",
        relevanceColor: "orange",
        confidence: 88,
        channels: ["linkedin", "x"],
      },
    ],
  },
  video: {
    kindLabel: "Video",
    filename: "founder-keynote.mp4",
    size: "34mb",
    signal: "Medium signal",
    signalColor: "tagOrange",
    ideas: [
      {
        title: "What a founder keynote looks like at 50 people",
        body: "Behind-the-scenes recap of the keynote, including the bits that got cut.",
        rationale:
          "Behind-the-scenes posts earn trust fast — readers get a rare look at how the company actually operates.",
        relevance: "Medium relevance",
        relevanceColor: "tagOrange",
        confidence: 76,
        channels: ["linkedin", "instagram"],
      },
      {
        title: "The one founder story we won't tell (and why)",
        body: "A meta-post about editorial restraint.",
        rationale:
          "Meta-post about judgement, not the story itself. Niche but memorable for founders in similar positions.",
        relevance: "Low relevance",
        relevanceColor: "grey",
        confidence: 54,
        channels: ["x"],
      },
    ],
  },
  url: {
    kindLabel: "URL",
    filename: "acme.com/launch",
    size: null,
    signal: "Medium signal",
    signalColor: "tagOrange",
    ideas: [
      {
        title: "How we pick which roadmap items we talk about publicly",
        body: "An editorial rule of thumb the team actually uses.",
        rationale:
          "Editorial restraint is under-used as an angle. Positions the team as thoughtful rather than hype-driven.",
        relevance: "Medium relevance",
        relevanceColor: "tagOrange",
        confidence: 71,
        channels: ["linkedin"],
      },
    ],
  },
};
