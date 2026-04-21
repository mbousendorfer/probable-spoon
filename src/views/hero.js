import { store, sortSessions } from "../store.js?v=15";
import { escapeHtml, icons, assistantModeCopy, iconForType, priorityPill } from "../utils.js?v=17";

const workspaceContent = document.getElementById("workspaceContent");

// ============================================================
// Cards
// ============================================================

const CARD_ORDER = [
  {
    id: "brief",
    label: "Define the brief",
    dot: "amber",
    description: "Goal, audience, and a short brand voice summary.",
  },
  {
    id: "voice",
    label: "Analyze my voice",
    dot: "blue",
    description: "Let Archie learn your style from profiles or docs.",
  },
  {
    id: "brand",
    label: "Set brand theme",
    dot: "purple",
    description: "Colors, imagery, and personality pulled from your site.",
  },
];

// ============================================================
// Mocked data
// ============================================================

const SOCIAL_PROFILES = [
  { id: "linkedin-archie", platform: "LinkedIn", handle: "@archieco", icon: "ap-icon-linkedin" },
  { id: "twitter-archie", platform: "Twitter/X", handle: "@archie", icon: "ap-icon-twitter-official" },
  { id: "instagram-archie", platform: "Instagram", handle: "@archie.social", icon: "ap-icon-instagram" },
  { id: "facebook-archie", platform: "Facebook", handle: "Archie Inc.", icon: "ap-icon-facebook" },
];

let _entryIdCounter = 0;
function entryId() {
  _entryIdCounter += 1;
  return "en-" + Date.now().toString(36) + "-" + _entryIdCounter;
}

function emptyBrief() {
  return {
    sections: [
      {
        id: "goals",
        icon: "🎯",
        title: "Goals",
        entries: [
          { id: entryId(), label: "Primary objective", value: "", multiline: false },
          { id: entryId(), label: "Target action", value: "", multiline: false },
        ],
      },
      {
        id: "audience",
        icon: "👥",
        title: "Audience",
        entries: [
          { id: entryId(), label: "Target demographic", value: "", multiline: true },
          { id: entryId(), label: "Pain points", value: "", multiline: true },
        ],
      },
      {
        id: "brand-voice",
        icon: "📣",
        title: "Brand Voice",
        entries: [
          { id: entryId(), label: "Tone", value: "", multiline: false },
          { id: entryId(), label: "Style", value: "", multiline: false },
        ],
      },
      { id: "cta-links", icon: "🔗", title: "CTA Links", kind: "url-list", entries: [] },
    ],
  };
}

function mockBriefFromUrl(url) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    host = url;
  }
  const isAgorapulse = host.includes("agorapulse");
  const brief = emptyBrief();
  const fill = (sectionId, entries) => {
    const section = brief.sections.find((s) => s.id === sectionId);
    if (section) section.entries = entries;
  };

  if (isAgorapulse) {
    fill("goals", [
      { id: entryId(), label: "Primary objective", value: "Drive traffic", multiline: false },
      { id: entryId(), label: "Target action", value: "Visit website", multiline: false },
    ]);
    fill("audience", [
      {
        id: entryId(),
        label: "Target demographic",
        value: "Social media managers, marketing teams, agencies, and consultants managing multiple accounts.",
        multiline: true,
      },
      {
        id: entryId(),
        label: "Pain points",
        value:
          "Inefficient social media workflows, Disjointed communication and collaboration, Difficulty demonstrating social media ROI",
        multiline: true,
      },
    ]);
    fill("brand-voice", [
      { id: entryId(), label: "Tone", value: "Professional and informative", multiline: false },
      {
        id: entryId(),
        label: "Style",
        value: "Data-driven with practical advice and customer success stories",
        multiline: false,
      },
    ]);
    fill("cta-links", [
      { id: entryId(), label: "Agorapulse Academy", url: "https://agorapulse.com/academy/" },
      { id: entryId(), label: "Social Media Today Community", url: "https://agorapulse.com/social-media-today" },
      { id: entryId(), label: "Features Overview", url: "https://agorapulse.com/features" },
      { id: entryId(), label: "Pricing", url: "https://agorapulse.com/pricing" },
      { id: entryId(), label: "Request a Demo", url: "https://agorapulse.com/demo" },
    ]);
  } else {
    fill("goals", [
      {
        id: entryId(),
        label: "Primary objective",
        value: "Build awareness and drive qualified traffic from content to product",
        multiline: false,
      },
      { id: entryId(), label: "Target action", value: "Visit product page", multiline: false },
    ]);
    fill("audience", [
      {
        id: entryId(),
        label: "Target demographic",
        value: "Decision-makers at small-to-mid-sized businesses evaluating the category.",
        multiline: true,
      },
      {
        id: entryId(),
        label: "Pain points",
        value: "Manual reporting, Tool sprawl, Unclear ROI",
        multiline: true,
      },
    ]);
    fill("brand-voice", [
      {
        id: entryId(),
        label: "Tone",
        value: "Confident, clear, and practical — informed without being jargon-heavy",
        multiline: false,
      },
      { id: entryId(), label: "Style", value: "Short sentences, concrete examples", multiline: false },
    ]);
    fill("cta-links", [
      { id: entryId(), label: "Homepage", url: "https://" + (host || "example.com") + "/" },
      { id: entryId(), label: "Pricing", url: "https://" + (host || "example.com") + "/pricing" },
      { id: entryId(), label: "Demo", url: "https://" + (host || "example.com") + "/demo" },
    ]);
  }
  return brief;
}

function mockBriefRefined(prevBrief) {
  const next = emptyBrief();
  const findSection = (id) => next.sections.find((s) => s.id === id);
  const existing = (id) => prevBrief.sections.find((s) => s.id === id);

  findSection("goals").entries = [
    { id: entryId(), label: "Primary objective", value: "Qualified pipeline from brand content", multiline: false },
    { id: entryId(), label: "Target action", value: "Book a demo", multiline: false },
  ];
  findSection("audience").entries = [
    {
      id: entryId(),
      label: "Target demographic",
      value: "Growth-minded marketing leads at 10-200 person teams.",
      multiline: true,
    },
    {
      id: entryId(),
      label: "Pain points",
      value: "Limited bandwidth, Reporting fatigue, Siloed workflows",
      multiline: true,
    },
  ];
  findSection("brand-voice").entries = [
    { id: entryId(), label: "Tone", value: "Direct, helpful, opinionated", multiline: false },
    {
      id: entryId(),
      label: "Style",
      value: "Short bursts, specific examples, no filler",
      multiline: false,
    },
  ];
  // Preserve CTA Links — refinement doesn't scramble URLs
  findSection("cta-links").entries = existing("cta-links")?.entries?.slice() || [];
  return next;
}

function mockVoiceFromSources(sources) {
  const sourcesCount = sources.length;
  const sourceName = sourcesCount > 1 ? "Merged analysis" : sources[0]?.label || "Analysis";
  return {
    sources: sources.slice(),
    sourceName,
    sourcesCount,
    openingHooks: [
      {
        name: "Direct Subject Introduction",
        detail: "Starting with the name of the subject in bold or as the primary focus (Post 25, 26, 31)",
      },
      { name: "Nickname/Moniker Openings", detail: "Using a descriptive name before the formal one (Post 19, 21, 63)" },
      { name: "Enthusiastic Declarations", detail: "Short, high-energy bursts (Post 93, 28)" },
      {
        name: "Functional Test Labels",
        detail: "Minimalist 'Test' prefixes for technical verification (Post 4, 5, 40)",
      },
      { name: "Lifestyle Alliteration", detail: "Catchy, rhythmic phrases for food/lifestyle (Post 13, 17)" },
    ],
    closingPatterns: [
      {
        name: "Fact-Based Summaries",
        detail: "Ending with a definitive statement about the subject's nature (Post 92, 98)",
      },
      { name: "Hashtag Stacks", detail: "A series of 1-3 specific topic-related hashtags (Post 19, 21, 30)" },
      { name: "Call to Action/Link", detail: "Appending a shortened URL or tracking link (Post 72, 78, 80)" },
      { name: "Brand Sign-offs", detail: "Using a signature phrase for specific businesses (Post 13, 17)" },
      { name: "Conservation Warnings", detail: "Closing with the status of an endangered species (Post 58, 82)" },
    ],
    formattingRhythm:
      "The author oscillates between ultra-minimalist 'test' strings and dense, single-paragraph educational blocks. They use pipes (|) to separate metadata or tags from the main body of text.",
    visualStyle:
      "Frequent use of bolding for keywords, parentheses for scientific names, and a clean emoji-at-the-end style for lifestyle content.",
    soul: "Core themes: Marine Biology and Cephalopods, Rare and 'Cute' Animal Facts, Technical Platform Testing. Emotional vibe: Educational, appreciative, and curious. The voice treats nature with a sense of wonder.",
    verbatimExamples:
      "Hooks: 'The Spotted garden eel is a small, shy eel…' (Post 25). Closings: 'That's the Burgworks effect!' (Post 13). Signature expressions: 'dancing noodles', 'mobile fortress'.",
    metadata: { postsAnalyzed: 100, analysisDate: "2023-10-27", language: "en" },
  };
}

function mockBrandFromUrl(_url) {
  return {
    colors: ["#D85A30", "#212E44", "#F5F5F7", "#FAC775"],
    imagery: ["placeholder-a", "placeholder-b"],
    buttons: [
      { variant: "primary", label: "Get started" },
      { variant: "stroked", label: "Learn more" },
    ],
    traits: ["Confident", "Approachable", "Modern", "Practical"],
  };
}

// ============================================================
// Flow graphs
// ============================================================

const BRIEF_FLOW = {
  _intro: "Let's set up your brief. It'll only take a minute.",
  _start: "brief-q1",

  "brief-q1": {
    id: "brief-q1",
    kind: "yes-no",
    title: "Do you have a website?",
    onYes: "brief-q2-url",
    onNo: "brief-q3-goal",
  },

  "brief-q2-url": {
    id: "brief-q2-url",
    kind: "url-input",
    title: "What's your website URL?",
    placeholder: "https://yourcompany.com",
    next: "brief-q2-analyze",
  },

  "brief-q2-analyze": {
    id: "brief-q2-analyze",
    kind: "analysis-loading",
    label: "Analyzing {url}…",
    duration: 2000,
    onComplete: (hero) => {
      const url = hero._context?.url || "";
      hero.brief = mockBriefFromUrl(url);
      pushAI(hero, "I've pulled your goal, audience, and brand voice from the site. Review and tweak below.");
    },
    next: "brief-recap",
  },

  "brief-q3-goal": {
    id: "brief-q3-goal",
    kind: "text-input",
    title: "What's your goal?",
    hint: "What is your primary objective for the content we're about to create? (e.g., brand awareness, lead generation, or building thought leadership)",
    placeholder: "Your main content objective…",
    next: "brief-q4-audience",
  },

  "brief-q4-audience": {
    id: "brief-q4-audience",
    kind: "text-input",
    title: "What's your audience?",
    hint: "Now, who are you trying to reach with these posts? (e.g., small business owners, corporate executives, or a specific professional group)",
    placeholder: "Who you're writing for…",
    next: "brief-q5-voice",
  },

  "brief-q5-voice": {
    id: "brief-q5-voice",
    kind: "text-input-with-suggestions",
    title: "What's your brand voice?",
    hint: "Finally, how would you describe your brand voice? (e.g., professional and authoritative, or perhaps more casual and bold)",
    placeholder: "Describe your brand voice in a sentence or two…",
    suggestions: ["Professional", "Casual & bold", "Witty & direct", "Empathetic & supportive"],
    next: "brief-recap",
  },

  "brief-recap": {
    id: "brief-recap",
    kind: "brief-recap",
    title: "Your brief",
  },
};

const VOICE_FLOW = {
  _intro: "Want me to learn how you write?",
  _start: "voice-q1",

  "voice-q1": {
    id: "voice-q1",
    kind: "yes-no",
    title: "Want me to analyze your style?",
    hint: "I can read your past posts or a writing sample to match your voice.",
    onYes: "voice-q2-picker",
    onNo: "voice-skip-confirm",
  },

  "voice-q2-picker": {
    id: "voice-q2-picker",
    kind: "multi-action",
    title: "Pick a source — you can add more than one.",
    options: [
      { id: "profile", icon: "ap-icon-link", label: "Select a social profile", next: "voice-q3-profiles" },
      { id: "doc", icon: "ap-icon-upload", label: "Upload a document", next: "voice-q3-doc" },
      {
        id: "done",
        icon: "ap-icon-check",
        label: "I'm done, analyze my voice",
        next: "voice-analyze",
        requiresSource: true,
      },
    ],
  },

  "voice-q3-profiles": {
    id: "voice-q3-profiles",
    kind: "social-picker",
    title: "Which profile should I analyze?",
    next: "voice-q2-picker",
  },

  "voice-q3-doc": {
    id: "voice-q3-doc",
    kind: "file-upload",
    title: "Drop a document that sounds like you.",
    placeholder: "PDF, DOCX, or TXT up to 5MB",
    accept: ".pdf,.docx,.txt",
    next: "voice-q2-picker",
  },

  "voice-analyze": {
    id: "voice-analyze",
    kind: "analysis-loading",
    label: "Analyzing your voice from {count} source(s)…",
    duration: 2500,
    onComplete: (hero) => {
      hero.voice = mockVoiceFromSources(hero.voice.sources);
    },
    next: "voice-preview",
  },

  "voice-preview": {
    id: "voice-preview",
    kind: "voice-preview",
    title: "Here's how you sound",
  },

  "voice-skip-confirm": {
    id: "voice-skip-confirm",
    kind: "yes-no",
    title: "Skip for now?",
    hint: "You can analyze your voice later from the Voice tab. Archie will use a neutral, professional voice by default.",
    onYes: "voice-skipped-end",
    onNo: "voice-q2-picker",
  },

  "voice-skipped-end": {
    id: "voice-skipped-end",
    kind: "terminal",
    aiBubble: "No problem. I'll use a neutral professional voice for now. You can come back any time.",
    complete: false,
  },
};

const BRAND_FLOW = {
  _intro: "Let's set the brand theme.",
  _start: "brand-q1",

  "brand-q1": {
    id: "brand-q1",
    kind: "url-input",
    title: "Where's your brand?",
    hint: "I'll pull colors, imagery, buttons, and personality from your site.",
    placeholder: "https://yourcompany.com",
    submitLabel: "Analyze brand",
    next: "brand-q2-analyze",
  },

  "brand-q2-analyze": {
    id: "brand-q2-analyze",
    kind: "analysis-loading",
    label: "Analyzing {url}…",
    duration: 2500,
    onComplete: (hero) => {
      const url = hero._context?.url || "";
      hero.brand = mockBrandFromUrl(url);
    },
    next: "brand-recap",
  },

  "brand-recap": {
    id: "brand-recap",
    kind: "brand-recap",
    title: "Your brand theme",
  },
};

function getFlow(cardId) {
  if (cardId === "brief") return BRIEF_FLOW;
  if (cardId === "voice") return VOICE_FLOW;
  if (cardId === "brand") return BRAND_FLOW;
  return null;
}

function getNode(cardId, nodeId) {
  const flow = getFlow(cardId);
  return flow ? flow[nodeId] : null;
}

// ============================================================
// State
// ============================================================

const PHASE_STORAGE_KEY = "bigbet-archie-hero-phase";
const ADMIN_MOCK_KEY = "bigbet-archie-admin-mock";
const STORE_STORAGE_KEY = "bigbet-library-prototype-v2";

function readAdminMock() {
  try {
    return window.localStorage.getItem(ADMIN_MOCK_KEY) === "new" ? "new" : "returning";
  } catch {
    return "returning";
  }
}

function applyAdminMockOnInit() {
  if (readAdminMock() !== "new") return;
  const s = store.getState();
  if ((s.sessions || []).length === 0) return;
  store.setState({ sessions: [], activeSessionId: null, sessionSwitcherOpen: false });
}

function setAdminMock(mode) {
  try {
    if (mode === "new") {
      window.localStorage.setItem(ADMIN_MOCK_KEY, "new");
    } else {
      window.localStorage.removeItem(ADMIN_MOCK_KEY);
    }
    window.localStorage.removeItem(STORE_STORAGE_KEY);
    window.localStorage.removeItem(PHASE_STORAGE_KEY);
  } catch {
    // localStorage unavailable — the reload will still produce best-effort state.
  }
  window.__archieHero = null;
  window.location.reload();
}

function renderAdminChip() {
  const existing = document.getElementById("archieAdminChip");
  if (existing) existing.remove();
  const mode = readAdminMock();
  const el = document.createElement("button");
  el.id = "archieAdminChip";
  el.type = "button";
  el.className = "archie-admin-chip" + (mode === "new" ? " is-new" : "");
  el.setAttribute("aria-label", "Admin mock mode toggle");
  el.title = "Click to switch to " + (mode === "new" ? "Returning" : "New") + " user";
  el.innerHTML =
    '<span class="archie-admin-chip__dot"></span>' +
    '<span class="archie-admin-chip__label">Admin · ' +
    (mode === "new" ? "New user" : "Returning user") +
    "</span>";
  el.addEventListener("click", () => {
    setAdminMock(mode === "new" ? "returning" : "new");
  });
  document.body.appendChild(el);
}

const SOURCE_TYPES = [
  { kind: "pdf", label: "PDF" },
  { kind: "url", label: "URL" },
  { kind: "video", label: "Video" },
  { kind: "audio", label: "Audio" },
];

function readStoredPhase() {
  try {
    const value = window.localStorage.getItem(PHASE_STORAGE_KEY);
    return value === "workspace" || value === "hero" ? value : null;
  } catch {
    return null;
  }
}

function writeStoredPhase(phase) {
  try {
    window.localStorage.setItem(PHASE_STORAGE_KEY, phase);
  } catch {
    /* noop */
  }
}

function defaultHeroState() {
  return {
    phase: readStoredPhase() || "hero",
    stage: "empty",
    activeCard: null,
    activeQuestionId: null,
    sourceKind: "pdf",
    draft: "",
    thread: [],
    selectedOptions: [],
    partialThread: {},
    freetextShakeAt: 0,
    analysisStartedAt: 0,
    editingQuestionId: null,
    _preEditQuestionId: null,
    editBannerDismissed: false,
    useFreeTextEscape: false,
    _context: {},

    brief: emptyBrief(),
    voice: { sources: [], summary: "", examples: [], traits: [] },
    brand: { colors: [], imagery: [], buttons: [], traits: [] },

    completed: { brief: false, voice: false, brand: false },
    inProgress: { brief: false, voice: false, brand: false },
    completedBriefs: {},

    sessionOverrides: { brief: null, voice: null, brand: null },
    setupChain: null,
    proposalDismissed: false,

    onboardingDismissed: false,
  };
}

// ============================================================
// User defaults (persistent across sessions)
// ============================================================

const USER_DEFAULTS_KEY = "bigbet-archie-user-defaults";

function emptyUserDefaults() {
  return {
    brief: { defined: false, data: null },
    voice: { defined: false, data: null },
    brand: { defined: false, data: null },
  };
}

function readUserDefaults() {
  try {
    const raw = window.localStorage.getItem(USER_DEFAULTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...emptyUserDefaults(), ...parsed };
    }
  } catch {
    /* noop */
  }
  return emptyUserDefaults();
}

function writeUserDefaults() {
  try {
    window.localStorage.setItem(USER_DEFAULTS_KEY, JSON.stringify(window.__archieUserDefaults || {}));
  } catch {
    /* noop */
  }
}

if (!window.__archieUserDefaults) {
  window.__archieUserDefaults = readUserDefaults();
}

window.__archieSetDefaults = function (patch) {
  window.__archieUserDefaults = { ...window.__archieUserDefaults, ...patch };
  writeUserDefaults();
  dispatchHeroUpdate();
};

window.__archieClearDefaults = function () {
  window.__archieUserDefaults = emptyUserDefaults();
  writeUserDefaults();
  dispatchHeroUpdate();
};

function setDefault(key, data) {
  window.__archieUserDefaults = {
    ...window.__archieUserDefaults,
    [key]: { defined: true, data: JSON.parse(JSON.stringify(data)) },
  };
  writeUserDefaults();
}

function getEffectiveSetup(key) {
  const hero = ensureHeroState();
  const override = hero.sessionOverrides?.[key];
  if (override) return { source: "override", data: override };
  const def = window.__archieUserDefaults?.[key];
  if (def?.defined) return { source: "default", data: def.data };
  return { source: "none", data: null };
}

function setOverride(key, data) {
  const hero = ensureHeroState();
  hero.sessionOverrides = hero.sessionOverrides || { brief: null, voice: null, brand: null };
  hero.sessionOverrides[key] = JSON.parse(JSON.stringify(data));
}

function clearOverride(key) {
  const hero = ensureHeroState();
  if (!hero.sessionOverrides) return;
  hero.sessionOverrides[key] = null;
}

function anySetupDefined() {
  return ["brief", "voice", "brand"].some((k) => getEffectiveSetup(k).source !== "none");
}

function allSetupsNone() {
  return ["brief", "voice", "brand"].every((k) => getEffectiveSetup(k).source === "none");
}

export { getEffectiveSetup, customizeCardForSession, closeSetupPreviewModal };
export { renderBriefRecapBody, renderVoicePreviewBody, renderBrandRecapBody };

export function ensureHeroState() {
  const base = defaultHeroState();
  if (!window.__archieHero) {
    window.__archieHero = base;
    return window.__archieHero;
  }
  const hero = window.__archieHero;
  for (const key of Object.keys(base)) {
    if (!(key in hero)) hero[key] = base[key];
  }
  return hero;
}

function dispatchHeroUpdate() {
  const hero = window.__archieHero;
  if (hero && (hero.phase === "hero" || hero.phase === "workspace")) {
    writeStoredPhase(hero.phase);
  }
  window.dispatchEvent(new CustomEvent("archie:hero-update"));
}

function resetToHero() {
  const hero = ensureHeroState();
  hero.phase = "hero";
  hero.stage = "empty";
  hero.activeCard = null;
  hero.activeQuestionId = null;
  hero.thread = [];
  hero.draft = "";
  hero.selectedOptions = [];
  hero._context = {};
  dispatchHeroUpdate();
}

// ============================================================
// Shared utils
// ============================================================

function cardDef(cardId) {
  return CARD_ORDER.find((c) => c.id === cardId);
}

function currentNode(hero) {
  return hero.activeCard && hero.activeQuestionId ? getNode(hero.activeCard, hero.activeQuestionId) : null;
}

let _threadIdCounter = 0;
function nextThreadId() {
  _threadIdCounter += 1;
  return "t-" + Date.now().toString(36) + "-" + _threadIdCounter;
}

function pushUser(hero, text) {
  hero.thread.push({ id: nextThreadId(), type: "user-bubble", text });
}

function pushAI(hero, text) {
  hero.thread.push({ id: nextThreadId(), type: "ai-bubble", text });
}

function pushEyebrow(hero, cardId) {
  hero.thread.push({ id: nextThreadId(), type: "ai-eyebrow", cardId });
}

function pushCollapsedPicker(hero, questionId, questionTitle, answerText) {
  hero.thread.push({
    id: nextThreadId(),
    type: "collapsed-picker",
    questionId,
    questionTitle,
    answerText,
  });
}

function triggerFreetextShake() {
  const hero = ensureHeroState();
  hero.freetextShakeAt = Date.now();
  dispatchHeroUpdate();
  setTimeout(() => {
    const h = ensureHeroState();
    h.freetextShakeAt = 0;
    dispatchHeroUpdate();
  }, 400);
}

// ============================================================
// STATE A — Empty hero (greeting, cards, onboarding, sessions)
// ============================================================

function previewSnippetForSetup(cardId, data) {
  if (!data) return "";
  if (cardId === "brief") {
    const sections = data.sections || [];
    const first = sections.flatMap((s) => s.entries || []).find((e) => e && e.value && e.value.trim && e.value.trim());
    return first ? first.value : "";
  }
  if (cardId === "voice") {
    const parts = [];
    if (data.sourceName) parts.push(data.sourceName);
    const hooks = (data.openingHooks || []).length;
    const closings = (data.closingPatterns || []).length;
    if (hooks) parts.push(hooks + " hooks");
    if (closings) parts.push(closings + " closings");
    return parts.join(" · ");
  }
  if (cardId === "brand") {
    const parts = [];
    const colors = (data.colors || []).length;
    const traits = (data.traits || []).length;
    if (colors) parts.push(colors + " color" + (colors === 1 ? "" : "s"));
    if (traits) parts.push(traits + " trait" + (traits === 1 ? "" : "s"));
    return parts.join(" · ");
  }
  return "";
}

function renderCardGrid(hero) {
  const cards = CARD_ORDER.map((card) => {
    const setup = getEffectiveSetup(card.id);
    const source = setup.source;
    const inProgress = hero.inProgress[card.id];
    const active = hero.stage === "elicitation" && hero.activeCard === card.id;
    const classes = ["archie-card"];
    if (source === "default") classes.push("is-defined");
    if (source === "override") classes.push("is-override");
    if (inProgress) classes.push("is-in-progress");
    if (active) classes.push("is-active");

    let badge = "";
    if (source === "default") {
      badge =
        '<span class="archie-card__badge archie-card__badge--defined"><i class="ap-icon-check" aria-hidden="true"></i>Defined</span>';
    } else if (source === "override") {
      badge =
        '<span class="archie-card__badge archie-card__badge--override"><i class="ap-icon-pen" aria-hidden="true"></i>For this session</span>';
    }

    let trailing = "";
    if (inProgress) {
      trailing = '<span class="archie-card__progress" aria-label="In progress">…</span>';
    }

    const labelSuffix = inProgress ? " …" : "";

    const preview = source === "none" ? card.description : previewSnippetForSetup(card.id, setup.data);
    const descClass = source === "none" ? "archie-card__description" : "archie-card__preview";

    let footerRow = "";
    if (source === "default") {
      footerRow =
        '<div class="archie-card__footer">' +
        '<button type="button" class="archie-card__footer-link" data-archie-customize="' +
        card.id +
        '">Customize for this session…</button>' +
        "</div>";
    } else if (source === "override") {
      footerRow =
        '<div class="archie-card__footer">' +
        '<button type="button" class="archie-card__footer-link" data-archie-revert="' +
        card.id +
        '">Revert to default</button>' +
        "</div>";
    }

    return (
      '<div class="archie-card-wrap">' +
      '<button type="button" class="' +
      classes.join(" ") +
      '" data-archie-card="' +
      card.id +
      '">' +
      '<div class="archie-card__head">' +
      '<span class="archie-card__dot ' +
      card.dot +
      '" aria-hidden="true"></span>' +
      '<span class="archie-card__label">' +
      escapeHtml(card.label + labelSuffix) +
      "</span>" +
      badge +
      trailing +
      "</div>" +
      '<div class="' +
      descClass +
      '">' +
      escapeHtml(preview || card.description) +
      "</div>" +
      "</button>" +
      footerRow +
      "</div>"
    );
  });

  return '<div class="archie-onboarding__cards">' + cards.join("") + "</div>";
}

function renderOnboarding(hero) {
  if (hero.onboardingDismissed) return "";
  const hasAnyDefined = anySetupDefined();
  const hasAnyNone = ["brief", "voice", "brand"].some((k) => getEffectiveSetup(k).source === "none");
  const title = hasAnyDefined ? "Your setup" : "Set up your session";
  const sub = hasAnyDefined
    ? "Applied automatically to this session. Customize per-card if needed."
    : "Optional — helps Archie match your style from the first draft.";
  const skipBtn = hasAnyNone
    ? '<button type="button" class="ap-button ghost grey" data-archie-skip-onboarding>Skip onboarding</button>'
    : "";

  return (
    '<section class="archie-onboarding" aria-label="Set up your session">' +
    '<header class="archie-onboarding__header">' +
    '<div class="archie-onboarding__copy">' +
    '<div class="archie-onboarding__title">' +
    escapeHtml(title) +
    "</div>" +
    '<div class="archie-onboarding__sub">' +
    escapeHtml(sub) +
    "</div>" +
    "</div>" +
    '<div class="archie-onboarding__actions">' +
    skipBtn +
    '<button type="button" class="ap-icon-button stroked" data-archie-resuggest aria-label="Re-suggest">' +
    '<i class="ap-icon-rotate-right"></i>' +
    "</button>" +
    "</div>" +
    "</header>" +
    renderCardGrid(hero) +
    "</section>"
  );
}

function countSessionIdeas(session) {
  return (session?.sources || []).reduce((n, s) => n + (s.ideas?.length || 0), 0);
}

function renderSourcePreviewCard(source) {
  const type = source.type || "pdf";
  const ideaCount = source.ideas?.length || 0;
  const meta =
    (type === "url" ? "URL" : type.toUpperCase()) +
    " · " +
    ideaCount +
    " ideas" +
    (source.importedAt ? " · " + source.importedAt : "");
  return (
    '<button type="button" class="archie-hero-lib__card" data-hero-source-id="' +
    source.id +
    '">' +
    '<span class="archie-hero-lib__card-icon">' +
    iconForType(type) +
    "</span>" +
    '<span class="archie-hero-lib__card-body">' +
    '<span class="archie-hero-lib__card-title">' +
    escapeHtml(source.name) +
    "</span>" +
    '<span class="archie-hero-lib__card-meta">' +
    escapeHtml(meta) +
    "</span>" +
    "</span>" +
    "</button>"
  );
}

function renderIdeaPreviewCard(idea) {
  return (
    '<button type="button" class="archie-hero-lib__card archie-hero-lib__card--idea" data-hero-idea-id="' +
    idea.id +
    '">' +
    '<span class="archie-hero-lib__card-body">' +
    '<span class="archie-hero-lib__card-pill">' +
    priorityPill(idea.priority) +
    "</span>" +
    '<span class="archie-hero-lib__card-title">' +
    escapeHtml(idea.title) +
    "</span>" +
    '<span class="archie-hero-lib__card-meta">' +
    escapeHtml(idea.sourceName || "") +
    "</span>" +
    "</span>" +
    "</button>"
  );
}

function renderSourcesBlock(session) {
  const sources = (session?.sources || []).slice().sort((a, b) => {
    const ai = session.sources.indexOf(a);
    const bi = session.sources.indexOf(b);
    return bi - ai;
  });

  const header =
    '<header class="archie-hero-lib__header">' +
    '<div class="archie-hero-lib__header-title">' +
    '<i class="ap-icon-feature-library" aria-hidden="true"></i>' +
    "<span>Sources</span>" +
    "</div>" +
    '<a href="#" class="ap-link standalone small archie-hero-lib__header-action" data-hero-add-source>+ Add source</a>' +
    "</header>";

  if (!sources.length) {
    return (
      '<section class="archie-hero-lib__block" aria-label="Sources">' +
      header +
      '<div class="archie-hero-lib__empty">' +
      '<span class="archie-hero-lib__empty-tile"><i class="ap-icon-upload" aria-hidden="true"></i></span>' +
      '<div class="archie-hero-lib__empty-title">No sources yet</div>' +
      '<div class="archie-hero-lib__empty-sub">Drop a PDF or paste a URL</div>' +
      "</div>" +
      "</section>"
    );
  }

  const cards = sources.slice(0, 3).map(renderSourcePreviewCard).join("");
  const footer =
    sources.length > 3
      ? '<a href="#" class="ap-link standalone small archie-hero-lib__view-all" data-hero-view-all-sources>View all ' +
        sources.length +
        " sources →</a>"
      : "";

  return (
    '<section class="archie-hero-lib__block" aria-label="Sources">' +
    header +
    '<div class="archie-hero-lib__content">' +
    cards +
    footer +
    "</div>" +
    "</section>"
  );
}

function renderIdeasBlock(session) {
  const allIdeas = (session?.sources || []).flatMap((s) =>
    (s.ideas || []).map((idea) => ({ ...idea, sourceName: s.name })),
  );
  const priorityScore = (p) => (p === "high" ? 0 : p === "medium" ? 1 : 2);
  allIdeas.sort((a, b) => priorityScore(a.priority) - priorityScore(b.priority));

  const count = allIdeas.length;
  const header =
    '<header class="archie-hero-lib__header">' +
    '<div class="archie-hero-lib__header-title">' +
    '<i class="ap-icon-sparkles" aria-hidden="true"></i>' +
    "<span>Generated ideas</span>" +
    "</div>" +
    (count > 0 ? '<span class="archie-hero-lib__header-count">' + count + "</span>" : "") +
    "</header>";

  if (!count) {
    return (
      '<section class="archie-hero-lib__block" aria-label="Generated ideas">' +
      header +
      '<div class="archie-hero-lib__empty">' +
      '<span class="archie-hero-lib__empty-tile"><i class="ap-icon-sparkles" aria-hidden="true"></i></span>' +
      '<div class="archie-hero-lib__empty-title">Ideas appear here</div>' +
      '<div class="archie-hero-lib__empty-sub">Once Archie has a source</div>' +
      "</div>" +
      "</section>"
    );
  }

  const cards = allIdeas.slice(0, 3).map(renderIdeaPreviewCard).join("");
  const footer =
    count > 3
      ? '<a href="#" class="ap-link standalone small archie-hero-lib__view-all" data-hero-view-all-ideas>View all ' +
        count +
        " ideas →</a>"
      : "";

  return (
    '<section class="archie-hero-lib__block" aria-label="Generated ideas">' +
    header +
    '<div class="archie-hero-lib__content">' +
    cards +
    footer +
    "</div>" +
    "</section>"
  );
}

function renderHeroLibrary(session) {
  return '<div class="archie-hero-lib">' + renderSourcesBlock(session) + renderIdeasBlock(session) + "</div>";
}

function renderRecentSessions(state, session) {
  const all = sortSessions(state.sessions || [], true);
  const recent = all.filter((item) => item.id !== session?.id && !item.archived).slice(0, 6);

  const header =
    '<header class="archie-recent__header">' +
    '<div class="archie-recent__title">' +
    '<i class="ap-icon-single-chat-bubble" aria-hidden="true"></i>' +
    "<span>Your recent sessions</span>" +
    "</div>" +
    '<a href="#" class="ap-link standalone small archie-recent__view-all" data-archie-view-all>View all →</a>' +
    "</header>";

  if (!recent.length) {
    return (
      '<section class="archie-recent" aria-label="Recent sessions">' +
      header +
      '<div class="archie-recent__empty">' +
      '<i class="ap-icon-plus" aria-hidden="true"></i>' +
      '<div class="archie-recent__empty-title">Your sessions will appear here</div>' +
      '<div class="archie-recent__empty-sub">Create a new one from the + in the top bar or by sending a message below.</div>' +
      "</div>" +
      "</section>"
    );
  }

  const items = recent
    .map(
      (item) =>
        '<button type="button" class="archie-session-card" data-archie-session="' +
        item.id +
        '">' +
        '<span class="archie-session-card__icon"><i class="ap-icon-single-chat-bubble" aria-hidden="true"></i></span>' +
        '<span class="archie-session-card__title">' +
        escapeHtml(item.name) +
        "</span>" +
        '<span class="archie-session-card__meta">' +
        escapeHtml(item.updatedAtLabel) +
        "</span>" +
        "</button>",
    )
    .join("");

  return (
    '<section class="archie-recent" aria-label="Recent sessions">' +
    header +
    '<div class="archie-recent__grid">' +
    items +
    "</div>" +
    "</section>"
  );
}

function renderGreeting(session) {
  const name = session?.name?.trim() || "Untitled";
  return (
    '<div class="archie-hero__greeting">' +
    '<div class="archie-hero__eyebrow">New session · ' +
    escapeHtml(name) +
    "</div>" +
    '<h1 class="archie-hero__title">What do you want to create today?</h1>' +
    '<p class="archie-hero__subtitle">Drop a source, paste a URL, or just tell Archie what you have in mind.</p>' +
    "</div>"
  );
}

function renderHeroComposer(hero) {
  const modeCopy = assistantModeCopy(hero.sourceKind);
  const draft = hero.draft || "";
  const sendDisabled = !draft.trim();

  return (
    '<div class="archie-hero__composer" aria-label="Archie composer">' +
    '<div class="archie-hero__composer-toolbar">' +
    '<div class="source-type-tabs" data-archie-source-tabs>' +
    SOURCE_TYPES.map(
      (t) =>
        '<button class="source-type-tab' +
        (t.kind === hero.sourceKind ? " active" : "") +
        '" type="button" data-archie-source-kind="' +
        t.kind +
        '">' +
        t.label +
        "</button>",
    ).join("") +
    "</div>" +
    '<div class="archie-hero__composer-mode">' +
    escapeHtml(modeCopy.label) +
    "</div>" +
    "</div>" +
    '<textarea class="archie-hero__input" data-archie-input rows="2" placeholder="Drop a source, paste a URL, or tell Archie what you have in mind…" aria-label="Composer">' +
    escapeHtml(draft) +
    "</textarea>" +
    '<div class="archie-hero__composer-actions">' +
    '<button type="button" class="ap-icon-button stroked" data-archie-attach aria-label="Attach source">' +
    icons.plus +
    "</button>" +
    '<button type="button" class="ap-button primary orange" data-archie-send' +
    (sendDisabled ? " disabled" : "") +
    ">Send</button>" +
    "</div>" +
    "</div>"
  );
}

// ============================================================
// STATE B — Conversation (intro eyebrow + thread)
// ============================================================

function renderThread(hero) {
  const editingIdx = hero.editingQuestionId
    ? hero.thread.findIndex((t) => t.type === "collapsed-picker" && t.questionId === hero.editingQuestionId)
    : -1;

  const parts = hero.thread.map((item, idx) => {
    const dimmed = editingIdx >= 0 && idx > editingIdx ? " archie-thread__item--dimmed" : "";
    const attrs = ' data-thread-item-id="' + item.id + '"';

    if (item.type === "ai-eyebrow") {
      const card = cardDef(item.cardId);
      return (
        '<div class="archie-thread__item archie-thread__eyebrow' +
        dimmed +
        '"' +
        attrs +
        ">" +
        '<div class="ai-notice">' +
        '<span class="ai-notice__label">Archie · ' +
        escapeHtml(card?.label || "") +
        "</span>" +
        "</div>" +
        "</div>"
      );
    }

    if (item.type === "user-bubble") {
      return (
        '<article class="archie-thread__item assistant-turn' +
        dimmed +
        '"' +
        attrs +
        '><div class="assistant-turn__prompt"><div class="assistant-turn__meta">' +
        '<span class="assistant-turn__role assistant-turn__role--user">' +
        icons.question +
        '<span class="assistant-turn__role-label">You</span>' +
        "</span></div>" +
        '<div class="assistant-turn__content">' +
        escapeHtml(item.text) +
        "</div></div></article>"
      );
    }

    if (item.type === "ai-bubble") {
      return (
        '<article class="archie-thread__item assistant-turn' +
        dimmed +
        '"' +
        attrs +
        '><div class="assistant-turn__response"><div class="assistant-turn__meta">' +
        '<span class="assistant-turn__role assistant-turn__role--assistant">' +
        icons.sparklesMermaid +
        '<span class="assistant-turn__role-label">AI Copilot</span>' +
        "</span></div>" +
        '<div class="assistant-turn__content">' +
        escapeHtml(item.text) +
        "</div></div></article>"
      );
    }

    if (item.type === "ai-proposal") {
      return (
        '<article class="archie-thread__item assistant-turn archie-proposal' +
        dimmed +
        '"' +
        attrs +
        '><div class="assistant-turn__response"><div class="assistant-turn__meta">' +
        '<span class="assistant-turn__role assistant-turn__role--assistant">' +
        icons.sparklesMermaid +
        '<span class="assistant-turn__role-label">AI Copilot</span>' +
        "</span></div>" +
        '<div class="assistant-turn__content">' +
        escapeHtml(item.text) +
        '<div class="archie-proposal__actions">' +
        '<button type="button" class="ap-button primary orange" data-setup-proposal-accept>Let\'s set up</button>' +
        '<button type="button" class="ap-button stroked grey" data-setup-proposal-dismiss>Skip for now</button>' +
        "</div>" +
        "</div></div></article>"
      );
    }

    if (item.type === "collapsed-picker") {
      const isEditing = hero.editingQuestionId === item.questionId;
      return (
        '<button type="button" class="archie-thread__item archie-collapsed-picker' +
        dimmed +
        (isEditing ? " is-editing" : "") +
        '" data-collapsed-picker="' +
        item.questionId +
        '"' +
        attrs +
        ">" +
        '<span class="archie-collapsed-picker__title">' +
        escapeHtml(item.questionTitle) +
        "</span>" +
        '<span class="archie-collapsed-picker__answer">' +
        escapeHtml(item.answerText) +
        "</span>" +
        '<i class="ap-icon-pen archie-collapsed-picker__edit" aria-hidden="true"></i>' +
        "</button>"
      );
    }

    return "";
  });

  return parts.join("");
}

// ============================================================
// Question kind renderers
// ============================================================

function renderPickerHeader(title, hint, opts) {
  return (
    '<header class="archie-picker__header">' +
    '<div class="archie-picker__title-group">' +
    '<div class="archie-picker__title">' +
    escapeHtml(title) +
    "</div>" +
    (hint ? '<div class="archie-picker__hint">' + escapeHtml(hint) + "</div>" : "") +
    "</div>" +
    '<div class="archie-picker__nav">' +
    (opts?.showClose !== false
      ? '<button type="button" class="ap-icon-button stroked" data-picker-close aria-label="Close"><i class="ap-icon-close"></i></button>'
      : "") +
    "</div>" +
    "</header>"
  );
}

function renderYesNo(q) {
  const opts = [
    { label: "Yes", value: "yes", next: q.onYes },
    { label: "No", value: "no", next: q.onNo },
  ];
  const rows = opts
    .map(
      (o, i) =>
        '<li class="archie-picker__row">' +
        '<button type="button" class="archie-picker__row-btn" data-picker-row="' +
        i +
        '" data-yesno="' +
        o.value +
        '" data-picker-index="' +
        i +
        '">' +
        '<span class="archie-picker__number">' +
        (i + 1) +
        "</span>" +
        '<span class="archie-picker__label">' +
        escapeHtml(o.label) +
        "</span>" +
        '<i class="ap-icon-arrow-right archie-picker__arrow" aria-hidden="true"></i>' +
        "</button>" +
        "</li>",
    )
    .join("");

  return (
    '<section class="archie-picker" data-archie-picker tabindex="-1">' +
    renderPickerHeader(q.title, q.hint) +
    '<ol class="archie-picker__list">' +
    rows +
    renderTypeOwnRow() +
    "</ol>" +
    "</section>"
  );
}

function renderTextInput(hero, q, withSuggestions) {
  const suggestions = withSuggestions
    ? '<div class="archie-textarea-suggestions">' +
      q.suggestions
        .map(
          (s) =>
            '<button type="button" class="archie-chip-suggestion" data-suggestion="' +
            escapeHtml(s) +
            '">' +
            escapeHtml(s) +
            "</button>",
        )
        .join("") +
      "</div>"
    : "";

  const hint = q.hint ? '<div class="archie-picker__hint">' + escapeHtml(q.hint) + "</div>" : "";

  return (
    '<section class="archie-picker archie-picker--form" data-archie-picker tabindex="-1">' +
    '<header class="archie-picker__header">' +
    '<div class="archie-picker__title-group">' +
    '<div class="archie-picker__title">' +
    escapeHtml(q.title) +
    "</div>" +
    hint +
    "</div>" +
    '<div class="archie-picker__nav">' +
    '<button type="button" class="ap-icon-button stroked" data-picker-close aria-label="Close"><i class="ap-icon-close"></i></button>' +
    "</div>" +
    "</header>" +
    '<div class="archie-picker__body">' +
    suggestions +
    '<div class="archie-textarea">' +
    '<textarea class="archie-textarea__input" data-textarea-input rows="3" placeholder="' +
    escapeHtml(q.placeholder || "") +
    '"></textarea>' +
    '<div class="archie-textarea__actions">' +
    '<button type="button" class="ap-button primary orange" data-textarea-send disabled>Send →</button>' +
    "</div>" +
    "</div>" +
    "</div>" +
    "</section>"
  );
}

function renderUrlInput(hero, q) {
  const submitLabel = q.submitLabel || "Send →";
  const error = hero._context?.urlError
    ? '<div class="archie-url-input__error">' + escapeHtml(hero._context.urlError) + "</div>"
    : "";

  return (
    '<section class="archie-picker archie-picker--form" data-archie-picker tabindex="-1">' +
    renderPickerHeader(q.title, q.hint) +
    '<div class="archie-picker__body">' +
    '<div class="archie-url-input">' +
    '<input type="url" class="archie-url-input__field" data-url-input placeholder="' +
    escapeHtml(q.placeholder || "") +
    '" value="' +
    escapeHtml(hero._context?.urlDraft || "") +
    '" />' +
    '<button type="button" class="ap-button primary orange" data-url-send>' +
    escapeHtml(submitLabel) +
    "</button>" +
    "</div>" +
    error +
    "</div>" +
    "</section>"
  );
}

function renderFileUpload(hero, q) {
  return (
    '<section class="archie-picker archie-picker--form" data-archie-picker tabindex="-1">' +
    renderPickerHeader(q.title, q.hint) +
    '<div class="archie-picker__body">' +
    '<div class="archie-file-drop" data-file-drop>' +
    '<i class="ap-icon-upload" aria-hidden="true"></i>' +
    '<div class="archie-file-drop__title">Drop a file or click to choose</div>' +
    '<div class="archie-file-drop__sub">' +
    escapeHtml(q.placeholder || "") +
    "</div>" +
    '<button type="button" class="ap-button stroked grey" data-file-pick>Choose file</button>' +
    "</div>" +
    "</div>" +
    "</section>"
  );
}

function renderSocialPicker(hero, q) {
  const selected = hero.selectedOptions || [];
  const rows = SOCIAL_PROFILES.map((p, i) => {
    const isSelected = selected.includes(p.id);
    return (
      '<li class="archie-picker__row' +
      (isSelected ? " is-selected-multi" : "") +
      '">' +
      '<button type="button" class="archie-picker__row-btn" data-picker-row="' +
      i +
      '" data-social-id="' +
      p.id +
      '" data-picker-index="' +
      i +
      '" aria-pressed="' +
      (isSelected ? "true" : "false") +
      '">' +
      (isSelected
        ? '<span class="archie-picker__number archie-picker__number--selected"><i class="ap-icon-check" aria-hidden="true"></i></span>'
        : '<span class="archie-picker__number"><i class="' + p.icon + '" aria-hidden="true"></i></span>') +
      '<span class="archie-picker__label">' +
      escapeHtml(p.platform) +
      ' <span class="archie-social-handle">' +
      escapeHtml(p.handle) +
      "</span></span>" +
      (isSelected
        ? '<i class="ap-icon-check archie-picker__multi-check" aria-hidden="true"></i>'
        : '<i class="ap-icon-arrow-right archie-picker__arrow" aria-hidden="true"></i>') +
      "</button>" +
      "</li>"
    );
  }).join("");

  const continueDisabled = selected.length === 0;

  return (
    '<section class="archie-picker" data-archie-picker tabindex="-1">' +
    renderPickerHeader(q.title, q.hint) +
    '<ol class="archie-picker__list">' +
    rows +
    "</ol>" +
    '<div class="archie-picker__footer">' +
    '<span class="archie-picker__footer-helper">Pick one or more' +
    (selected.length ? " · " + selected.length + " selected" : "") +
    "</span>" +
    '<button type="button" class="ap-button primary orange" data-social-continue' +
    (continueDisabled ? " disabled" : "") +
    ">Continue →</button>" +
    "</div>" +
    "</section>"
  );
}

function renderMultiAction(hero, q) {
  const hasSources = hero.voice.sources.length > 0;
  const rows = q.options
    .map((o) => {
      const disabled = o.requiresSource && !hasSources;
      return (
        '<li class="archie-multi-action__row' +
        (disabled ? " is-disabled" : "") +
        '">' +
        '<button type="button" class="archie-multi-action__btn" data-action-next="' +
        o.next +
        '" data-action-id="' +
        o.id +
        '"' +
        (disabled ? ' disabled title="Add at least one source first"' : "") +
        ">" +
        '<span class="archie-multi-action__icon"><i class="' +
        o.icon +
        '" aria-hidden="true"></i></span>' +
        '<span class="archie-multi-action__label">' +
        escapeHtml(o.label) +
        "</span>" +
        '<i class="ap-icon-chevron-right archie-multi-action__chev" aria-hidden="true"></i>' +
        "</button>" +
        "</li>"
      );
    })
    .join("");

  const sourcesList = hero.voice.sources.length
    ? '<div class="archie-multi-action__sources">Added: ' +
      hero.voice.sources.map((s) => escapeHtml(s.label)).join(", ") +
      "</div>"
    : "";

  return (
    '<section class="archie-picker" data-archie-picker tabindex="-1">' +
    renderPickerHeader(q.title, q.hint) +
    '<ul class="archie-multi-action">' +
    rows +
    "</ul>" +
    sourcesList +
    "</section>"
  );
}

function renderAnalysisLoading(hero, q) {
  const url = hero._context?.url || "";
  const count = hero.voice.sources.length || 0;
  const label = (q.label || "").replace("{url}", url).replace("{count}", String(count));
  return (
    '<section class="archie-picker archie-picker--loading" data-archie-picker tabindex="-1">' +
    '<div class="archie-loader">' +
    '<div class="ap-loader orange size-30"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14"></circle><circle cx="16" cy="16" r="14"></circle></svg></div>' +
    '<div class="archie-loader__label">' +
    escapeHtml(label) +
    "</div>" +
    "</div>" +
    "</section>"
  );
}

function renderBriefEntry(entry, section, editingEntryId) {
  const isEditing = editingEntryId === entry.id;
  const isUrl = section.kind === "url-list";
  if (isEditing) {
    if (isUrl) {
      return (
        '<div class="archie-brief-recap__entry is-editing" data-entry-id="' +
        entry.id +
        '">' +
        '<input type="text" class="archie-brief-recap__edit-input" data-entry-label placeholder="Label" value="' +
        escapeHtml(entry.label || "") +
        '" />' +
        '<input type="url" class="archie-brief-recap__edit-input" data-entry-url placeholder="https://…" value="' +
        escapeHtml(entry.url || "") +
        '" />' +
        '<div class="archie-brief-recap__entry-actions">' +
        '<button type="button" class="ap-button stroked grey" data-entry-cancel>Cancel</button>' +
        '<button type="button" class="ap-button primary orange" data-entry-save>Save</button>' +
        "</div>" +
        "</div>"
      );
    }
    const tag = entry.multiline ? "textarea" : "input";
    const typeAttr = entry.multiline ? "" : ' type="text"';
    const rowsAttr = entry.multiline ? ' rows="3"' : "";
    const val = escapeHtml(entry.value || "");
    const field = entry.multiline
      ? '<textarea class="archie-brief-recap__edit-input archie-brief-recap__edit-input--multi" data-entry-value' +
        rowsAttr +
        ">" +
        val +
        "</textarea>"
      : '<input type="text" class="archie-brief-recap__edit-input" data-entry-value value="' + val + '" />';
    return (
      '<div class="archie-brief-recap__entry is-editing" data-entry-id="' +
      entry.id +
      '">' +
      '<div class="archie-brief-recap__entry-label">' +
      escapeHtml(entry.label || "") +
      "</div>" +
      field +
      '<div class="archie-brief-recap__entry-actions">' +
      '<button type="button" class="ap-button stroked grey" data-entry-cancel>Cancel</button>' +
      '<button type="button" class="ap-button primary orange" data-entry-save>Save</button>' +
      "</div>" +
      "</div>"
    );
  }

  const emptyValue = isUrl ? !entry.url : !entry.value;
  const placeholder = "Not set — click to add";

  if (isUrl) {
    return (
      '<button type="button" class="archie-brief-recap__entry" data-entry-id="' +
      entry.id +
      '" data-entry-open>' +
      '<div class="archie-brief-recap__entry-label">' +
      escapeHtml(entry.label || "Untitled") +
      "</div>" +
      (entry.url
        ? '<a class="archie-brief-recap__entry-url" href="' +
          escapeHtml(entry.url) +
          '" target="_blank" rel="noopener">' +
          escapeHtml(entry.url) +
          "</a>"
        : '<span class="archie-brief-recap__entry-placeholder">' + placeholder + "</span>") +
      '<i class="ap-icon-pen archie-brief-recap__entry-edit" aria-hidden="true"></i>' +
      "</button>"
    );
  }

  return (
    '<button type="button" class="archie-brief-recap__entry" data-entry-id="' +
    entry.id +
    '" data-entry-open>' +
    '<div class="archie-brief-recap__entry-label">' +
    escapeHtml(entry.label || "Untitled") +
    "</div>" +
    (emptyValue
      ? '<span class="archie-brief-recap__entry-placeholder">' + placeholder + "</span>"
      : '<div class="archie-brief-recap__entry-value">' + escapeHtml(entry.value) + "</div>") +
    '<i class="ap-icon-pen archie-brief-recap__entry-edit" aria-hidden="true"></i>' +
    "</button>"
  );
}

function renderBriefSection(section, hero) {
  const editingEntryId = hero._context?.editingEntryId || null;
  const refiningSectionId = hero._context?.refiningSectionId;
  const refiningAll = hero._context?.refiningAll;
  const isRefining = refiningAll || refiningSectionId === section.id;

  const entriesHtml = section.entries.map((entry) => renderBriefEntry(entry, section, editingEntryId)).join("");

  return (
    '<section class="archie-brief-recap__section' +
    (isRefining ? " is-refining" : "") +
    '" data-section-id="' +
    section.id +
    '">' +
    '<header class="archie-brief-recap__section-header">' +
    '<span class="archie-brief-recap__section-icon" aria-hidden="true">' +
    escapeHtml(section.icon || "✨") +
    "</span>" +
    '<h3 class="archie-brief-recap__section-title">' +
    escapeHtml(section.title) +
    "</h3>" +
    "</header>" +
    (isRefining
      ? '<div class="archie-brief-recap__section-loader"><div class="ap-loader grey size-16"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14"></circle><circle cx="16" cy="16" r="14"></circle></svg></div>Refining…</div>'
      : "") +
    '<div class="archie-brief-recap__entries">' +
    entriesHtml +
    "</div>" +
    "</section>"
  );
}

function renderBriefRecapBody(brief, hero) {
  const sections = (brief?.sections || []).map((s) => renderBriefSection(s, hero)).join("");
  return '<div class="archie-brief-recap">' + sections + "</div>";
}

function renderBriefRecap(hero) {
  return (
    '<section class="archie-picker archie-picker--recap archie-brief-recap-card" data-archie-picker tabindex="-1">' +
    '<header class="archie-picker__header">' +
    '<div class="archie-picker__title-group">' +
    '<div class="archie-picker__title">Strategy Brief</div>' +
    '<div class="archie-picker__hint">Review, edit, and confirm when ready.</div>' +
    "</div>" +
    '<div class="archie-picker__nav">' +
    '<button type="button" class="ap-icon-button stroked" data-picker-close aria-label="Close"><i class="ap-icon-close"></i></button>' +
    "</div>" +
    "</header>" +
    renderBriefRecapBody(hero.brief, hero) +
    '<div class="archie-picker__footer archie-brief-recap__footer">' +
    '<button type="button" class="ap-button primary orange" data-recap-confirm>Confirm brief</button>' +
    "</div>" +
    "</section>"
  );
}

function renderVoicePreviewBody(voice, opts) {
  const v = voice || {};
  const moreExpanded = !!opts?.moreExpanded;

  const hookItems = (v.openingHooks || [])
    .map(
      (h) =>
        '<li class="archie-voice-recap__list-item"><strong>' +
        escapeHtml(h.name) +
        ":</strong> " +
        escapeHtml(h.detail) +
        "</li>",
    )
    .join("");
  const closingItems = (v.closingPatterns || [])
    .map(
      (h) =>
        '<li class="archie-voice-recap__list-item"><strong>' +
        escapeHtml(h.name) +
        ":</strong> " +
        escapeHtml(h.detail) +
        "</li>",
    )
    .join("");

  const sectionCards =
    '<article class="archie-voice-card">' +
    '<header class="archie-voice-card__header"><i class="ap-icon-quote" aria-hidden="true"></i><span>Opening Hooks</span></header>' +
    '<ol class="archie-voice-recap__list">' +
    hookItems +
    "</ol>" +
    "</article>" +
    '<article class="archie-voice-card">' +
    '<header class="archie-voice-card__header"><i class="ap-icon-arrow-right" aria-hidden="true"></i><span>Closing Patterns</span></header>' +
    '<ol class="archie-voice-recap__list">' +
    closingItems +
    "</ol>" +
    "</article>" +
    '<article class="archie-voice-card">' +
    '<header class="archie-voice-card__header"><i class="ap-icon-numbered-list" aria-hidden="true"></i><span>Formatting Rhythm</span></header>' +
    '<p class="archie-voice-recap__para">' +
    escapeHtml(v.formattingRhythm || "") +
    "</p>" +
    "</article>" +
    '<article class="archie-voice-card">' +
    '<header class="archie-voice-card__header"><span class="archie-voice-recap__emoji">🎨</span><span>Visual Style</span></header>' +
    '<p class="archie-voice-recap__para">' +
    escapeHtml(v.visualStyle || "") +
    "</p>" +
    "</article>";

  const moreSection =
    '<button type="button" class="archie-voice-recap__more-toggle" data-voice-more-toggle aria-expanded="' +
    (moreExpanded ? "true" : "false") +
    '">' +
    '<i class="' +
    (moreExpanded ? "ap-icon-chevron-down" : "ap-icon-chevron-right") +
    '" aria-hidden="true"></i>' +
    "<span>More details (3)</span>" +
    "</button>" +
    (moreExpanded
      ? '<div class="archie-voice-recap__more">' +
        '<article class="archie-voice-card"><header class="archie-voice-card__header"><span>Soul</span></header><p class="archie-voice-recap__para">' +
        escapeHtml(v.soul || "") +
        "</p></article>" +
        '<article class="archie-voice-card"><header class="archie-voice-card__header"><span>Verbatim Examples</span></header><p class="archie-voice-recap__para">' +
        escapeHtml(v.verbatimExamples || "") +
        "</p></article>" +
        '<article class="archie-voice-card"><header class="archie-voice-card__header"><span>Metadata</span></header><p class="archie-voice-recap__para archie-voice-recap__metadata">' +
        (v.metadata
          ? "Analyzed " +
            (v.metadata.postsAnalyzed || 0) +
            " posts · " +
            escapeHtml(v.metadata.analysisDate || "") +
            " · " +
            escapeHtml((v.metadata.language || "").toUpperCase())
          : "") +
        "</p></article>" +
        "</div>"
      : "");

  return (
    '<div class="archie-voice-recap">' +
    '<div class="archie-voice-recap__source-label"><i class="ap-icon-headset" aria-hidden="true"></i><span>' +
    escapeHtml(v.sourceName || "Analysis") +
    "</span></div>" +
    sectionCards +
    moreSection +
    "</div>"
  );
}

function renderVoicePreview(hero) {
  const moreExpanded = hero._context?.voiceMoreExpanded === true;
  return (
    '<section class="archie-picker archie-picker--recap archie-voice-recap-card" data-archie-picker tabindex="-1">' +
    '<header class="archie-picker__header">' +
    '<div class="archie-picker__title-group">' +
    '<div class="archie-voice-recap__title"><i class="ap-icon-headset archie-voice-recap__title-icon" aria-hidden="true"></i>Voice</div>' +
    '<div class="archie-picker__hint">Your unique writing fingerprint. Posts generated will match this voice so they sound authentically you.</div>' +
    "</div>" +
    '<div class="archie-picker__nav">' +
    '<button type="button" class="ap-icon-button stroked" data-picker-close aria-label="Close"><i class="ap-icon-close"></i></button>' +
    "</div>" +
    "</header>" +
    renderVoicePreviewBody(hero.voice, { moreExpanded }) +
    '<div class="archie-picker__footer archie-voice-recap__save">' +
    '<button type="button" class="ap-button primary orange" data-voice-save>Save this voice</button>' +
    "</div>" +
    "</section>"
  );
}

function renderBrandRecapBody(brand) {
  const b = brand || { colors: [], imagery: [], buttons: [], traits: [] };
  const swatches = (b.colors || [])
    .map(
      (c) =>
        '<div class="archie-brand-recap__swatch" style="background-color: ' +
        escapeHtml(c) +
        '" title="' +
        escapeHtml(c) +
        '"></div>',
    )
    .join("");
  const imagery = (b.imagery || [])
    .map(() => '<div class="archie-brand-recap__image"><i class="ap-icon-image" aria-hidden="true"></i></div>')
    .join("");
  const buttons = (b.buttons || [])
    .map((btn) => {
      const cls = btn.variant === "primary" ? "ap-button primary orange" : "ap-button stroked grey";
      return '<button type="button" class="' + cls + '">' + escapeHtml(btn.label) + "</button>";
    })
    .join("");
  const traits = (b.traits || []).map((t) => '<span class="ap-tag blue">' + escapeHtml(t) + "</span>").join("");

  return (
    '<div class="archie-brand-recap">' +
    '<div class="archie-brand-recap__group">' +
    '<div class="archie-brand-recap__group-label">Colors</div>' +
    '<div class="archie-brand-recap__swatches">' +
    swatches +
    "</div>" +
    "</div>" +
    '<div class="archie-brand-recap__group">' +
    '<div class="archie-brand-recap__group-label">Imagery</div>' +
    '<div class="archie-brand-recap__imagery">' +
    imagery +
    "</div>" +
    "</div>" +
    '<div class="archie-brand-recap__group">' +
    '<div class="archie-brand-recap__group-label">Buttons</div>' +
    '<div class="archie-brand-recap__buttons">' +
    buttons +
    "</div>" +
    "</div>" +
    '<div class="archie-brand-recap__group">' +
    '<div class="archie-brand-recap__group-label">Personality</div>' +
    '<div class="archie-brand-recap__traits">' +
    traits +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

function renderBrandRecap(hero) {
  return (
    '<section class="archie-picker archie-picker--recap" data-archie-picker tabindex="-1">' +
    renderPickerHeader("Your brand theme", null) +
    renderBrandRecapBody(hero.brand) +
    '<div class="archie-picker__footer">' +
    '<button type="button" class="ap-button ghost grey" data-brand-start-over>Start over</button>' +
    '<button type="button" class="ap-button primary orange" data-brand-apply>Apply this theme</button>' +
    "</div>" +
    "</section>"
  );
}

function renderQuestion(hero, q) {
  if (!q) return "";
  switch (q.kind) {
    case "yes-no":
      return renderYesNo(q);
    case "text-input":
      return renderTextInput(hero, q, false);
    case "text-input-with-suggestions":
      return renderTextInput(hero, q, true);
    case "url-input":
      return renderUrlInput(hero, q);
    case "file-upload":
      return renderFileUpload(hero, q);
    case "social-picker":
      return renderSocialPicker(hero, q);
    case "multi-action":
      return renderMultiAction(hero, q);
    case "analysis-loading":
      return renderAnalysisLoading(hero, q);
    case "brief-recap":
      return renderBriefRecap(hero);
    case "voice-preview":
      return renderVoicePreview(hero);
    case "brand-recap":
      return renderBrandRecap(hero);
    case "terminal":
      return "";
    default:
      return "";
  }
}

const PICKER_KINDS = new Set(["yes-no", "picker", "social-picker", "multi-action", "file-upload"]);
const TYPE_OWN_KINDS = new Set(["yes-no", "picker"]);
const NATIVE_TEXT_KINDS = new Set(["text-input", "text-input-with-suggestions", "url-input"]);

function renderEditBanner() {
  return (
    '<div class="archie-edit-banner">' +
    '<span class="archie-edit-banner__text">Editing a previous answer. Changing it will reset everything after this point.</span>' +
    '<div class="archie-edit-banner__actions">' +
    '<button type="button" class="ap-button ghost grey" data-edit-cancel>Cancel edit</button>' +
    '<button type="button" class="ap-button stroked grey" data-edit-continue>Continue</button>' +
    "</div>" +
    "</div>"
  );
}

function renderTypeOwnRow() {
  return (
    '<li class="archie-picker__row archie-picker__row--type-own">' +
    '<button type="button" class="archie-picker__row-btn" data-type-own>' +
    '<span class="archie-picker__number archie-picker__number--icon">' +
    '<i class="ap-icon-pen" aria-hidden="true"></i>' +
    "</span>" +
    '<span class="archie-picker__label">Type your own answer</span>' +
    '<i class="ap-icon-arrow-right archie-picker__arrow" aria-hidden="true"></i>' +
    "</button>" +
    "</li>"
  );
}

function renderEscapeComposer(hero, q) {
  return (
    '<div class="archie-escape-composer" data-archie-picker tabindex="-1">' +
    '<button type="button" class="ap-icon-button stroked archie-composer__back" data-escape-back aria-label="Back to picker"><i class="ap-icon-chevron-left"></i></button>' +
    '<input type="text" class="archie-escape-composer__input" data-escape-input placeholder="' +
    escapeHtml(q.title) +
    '" aria-label="Type your answer" />' +
    '<button type="button" class="ap-button primary orange" data-escape-send>Send →</button>' +
    "</div>"
  );
}

function renderDock(hero, q) {
  if (!q) return "";

  if (hero.useFreeTextEscape && PICKER_KINDS.has(q.kind)) {
    return renderEscapeComposer(hero, q);
  }

  // Native text/url kinds — the question renderer itself is the dock surface.
  if (NATIVE_TEXT_KINDS.has(q.kind)) {
    return renderQuestion(hero, q);
  }

  // All remaining kinds (picker-like or recap/preview/loading): render as-is.
  // The "Type your own answer" escape is now an inline list row, added inside
  // the kinds where free-text is a sensible answer (see renderYesNo / renderPicker).
  return renderQuestion(hero, q);
}

function renderFreetext(hero) {
  const classes = ["archie-freetext"];
  if (hero.freetextShakeAt && Date.now() - hero.freetextShakeAt < 500) classes.push("is-shake");
  return (
    '<div class="' +
    classes.join(" ") +
    '">' +
    '<input type="text" class="archie-freetext__input" data-freetext-input placeholder="Message Archie…" aria-label="Message Archie" />' +
    '<button type="button" class="ap-icon-button primary orange" data-freetext-send aria-label="Send">' +
    '<i class="ap-icon-paper-plane"></i>' +
    "</button>" +
    "</div>"
  );
}

function renderHintRow() {
  return '<div class="archie-picker__footer-hint">Enter to submit · Esc to exit</div>';
}

// ============================================================
// Main renderHero
// ============================================================

export function renderHero(state, session) {
  const hero = ensureHeroState();
  const parts = [];
  const classes = ["archie-hero"];

  if (hero.stage === "elicitation" && hero.activeCard) {
    classes.push("archie-elicitation");
    const q = currentNode(hero);

    if (hero.editingQuestionId && !hero.editBannerDismissed) {
      parts.push(renderEditBanner());
    }

    parts.push('<div class="archie-elicitation__thread" data-archie-thread>' + renderThread(hero) + "</div>");

    if (q) {
      parts.push(
        '<div class="archie-elicitation__dock">' +
          renderDock(hero, q) +
          '<div class="archie-elicitation__footer-hint">Enter to submit · Esc to exit</div>' +
          "</div>",
      );
    }
  } else {
    parts.push(renderGreeting(session));
    parts.push(renderHeroComposer(hero));
    parts.push(renderOnboarding(hero));
    parts.push(renderHeroLibrary(session));
    parts.push(renderRecentSessions(state, session));
  }

  workspaceContent.innerHTML = '<section class="' + classes.join(" ") + '">' + parts.join("") + "</section>";

  if (hero.stage === "elicitation") {
    requestAnimationFrame(() => {
      const thread = workspaceContent.querySelector("[data-archie-thread]");
      if (thread) thread.scrollTop = thread.scrollHeight;
      const firstFocus = workspaceContent.querySelector(
        "[data-escape-input], [data-textarea-input], [data-url-input], [data-picker-row], [data-action-id]",
      );
      if (firstFocus) {
        firstFocus.focus({ preventScroll: true });
      }
    });

    // Schedule analysis auto-advance
    const q = currentNode(hero);
    if (q && q.kind === "analysis-loading") {
      scheduleAnalysis(q);
    }
  }
}

// Returns the focusable picker rows in DOM order (yes/no, picker, social, multi-action, type-own).
function pickerFocusables() {
  return Array.from(
    workspaceContent.querySelectorAll("[data-picker-row], [data-action-id]:not([disabled]), [data-type-own]"),
  );
}

function focusPickerOffset(offset) {
  const nodes = pickerFocusables();
  if (!nodes.length) return;
  const idx = nodes.indexOf(document.activeElement);
  const total = nodes.length;
  const next = idx < 0 ? 0 : (idx + offset + total) % total;
  nodes[next].focus({ preventScroll: true });
}

function focusPickerByNumber(n) {
  const nodes = pickerFocusables();
  const target = nodes[n - 1];
  if (target) target.focus({ preventScroll: true });
  return !!target;
}

// ============================================================
// Flow navigation + submit handlers
// ============================================================

function goToNode(nodeId) {
  const hero = ensureHeroState();
  hero.activeQuestionId = nodeId;
  hero.selectedOptions = [];
  if (hero._context) {
    hero._context.urlError = "";
    hero._context.editingField = null;
  }
  const node = currentNode(hero);
  if (node && node.kind === "terminal") {
    if (node.aiBubble) pushAI(hero, node.aiBubble);
    finalizeCard(hero.activeCard, !!node.complete);
    return;
  }
  dispatchHeroUpdate();
}

function scheduleAnalysis(q) {
  const hero = ensureHeroState();
  if (hero.analysisStartedAt && hero._context?.analysisNodeId === q.id) return;
  hero.analysisStartedAt = Date.now();
  hero._context = hero._context || {};
  hero._context.analysisNodeId = q.id;
  setTimeout(() => {
    const h = ensureHeroState();
    if (h.activeQuestionId !== q.id) return;
    if (typeof q.onComplete === "function") q.onComplete(h);
    h.analysisStartedAt = 0;
    goToNode(q.next);
  }, q.duration || 2000);
}

function openCard(cardId) {
  const hero = ensureHeroState();
  const setup = getEffectiveSetup(cardId);

  // If already defined (default) or overridden for this session, open the preview modal.
  if (setup.source !== "none" && !hero.inProgress[cardId]) {
    openSetupPreviewModal(cardId);
    return;
  }

  startSetupFlow(cardId, { origin: "default", seedData: null });
}

function startSetupFlow(cardId, opts) {
  const hero = ensureHeroState();
  const flow = getFlow(cardId);
  if (!flow) return;
  const origin = opts?.origin || "default";
  const seedData = opts?.seedData || null;

  const isResuming = hero.inProgress[cardId] && !hero.completed[cardId];
  if (isResuming && hero.partialThread[cardId]) {
    hero.thread = hero.partialThread[cardId].slice();
  } else {
    if (seedData) {
      if (cardId === "brief") hero.brief = JSON.parse(JSON.stringify(seedData));
      if (cardId === "voice") hero.voice = JSON.parse(JSON.stringify(seedData));
      if (cardId === "brand") hero.brand = JSON.parse(JSON.stringify(seedData));
    } else {
      if (cardId === "brief") hero.brief = emptyBrief();
      if (cardId === "voice") hero.voice = { sources: [], summary: "", examples: [], traits: [] };
      if (cardId === "brand") hero.brand = { colors: [], imagery: [], buttons: [], traits: [] };
    }
    hero.thread = [];
    pushEyebrow(hero, cardId);
    pushAI(hero, flow._intro);
  }

  hero.stage = "elicitation";
  hero.activeCard = cardId;
  hero.activeQuestionId =
    hero.inProgress[cardId] && hero._context?.lastQuestionId ? hero._context.lastQuestionId : flow._start;
  hero.selectedOptions = [];
  hero.useFreeTextEscape = false;
  hero.editingQuestionId = null;
  hero._preEditQuestionId = null;
  hero.editBannerDismissed = false;
  hero._context = { ...(hero._context || {}) };
  hero._context.urlError = "";
  hero._context.editingField = null;
  hero._context.setupOrigin = origin;
  dispatchHeroUpdate();
}

function customizeCardForSession(cardId) {
  const hero = ensureHeroState();
  const effective = getEffectiveSetup(cardId);
  if (effective.source === "none") {
    openCard(cardId);
    return;
  }
  startSetupFlow(cardId, { origin: "override", seedData: effective.data });
}

function revertCardToDefault(cardId) {
  const hero = ensureHeroState();
  clearOverride(cardId);
  dispatchHeroUpdate();
}

function openSetupPreviewModal(cardId) {
  const hero = ensureHeroState();
  hero._context = hero._context || {};
  hero._context.setupPreview = { cardId, open: true };
  dispatchHeroUpdate();
}

function closeSetupPreviewModal() {
  const hero = ensureHeroState();
  hero._context = hero._context || {};
  hero._context.setupPreview = { cardId: null, open: false };
  dispatchHeroUpdate();
}

function closePicker(keepProgress) {
  const hero = ensureHeroState();
  const cardId = hero.activeCard;
  if (cardId && keepProgress) {
    if (hero.thread.length > 1) {
      hero.inProgress[cardId] = true;
      hero.partialThread[cardId] = hero.thread.slice();
      hero._context = hero._context || {};
      hero._context.lastQuestionId = hero.activeQuestionId;
    }
  }
  // If the user aborted an override flow mid-way, discard any staged override state.
  // Defaults are only written on completion, so nothing to revert for origin=default.
  hero.setupChain = null;
  hero.stage = "empty";
  hero.activeCard = null;
  hero.activeQuestionId = null;
  hero.selectedOptions = [];
  hero.thread = [];
  dispatchHeroUpdate();
}

function finalizeCard(cardId, markCompleted) {
  const hero = ensureHeroState();
  if (!cardId) return;
  const origin = hero._context?.setupOrigin || "default";
  if (markCompleted) {
    hero.completed[cardId] = true;
    const snapshot =
      cardId === "brief"
        ? JSON.parse(JSON.stringify(hero.brief))
        : cardId === "voice"
          ? JSON.parse(JSON.stringify(hero.voice))
          : JSON.parse(JSON.stringify(hero.brand));
    hero.completedBriefs[cardId] = snapshot;

    if (origin === "override") {
      setOverride(cardId, snapshot);
    } else {
      setDefault(cardId, snapshot);
      clearOverride(cardId);
    }
  }
  hero.inProgress[cardId] = false;
  delete hero.partialThread[cardId];
  dispatchHeroUpdate();

  const chained = advanceSetupChain(cardId);

  setTimeout(() => {
    const h = ensureHeroState();
    if (h.activeCard !== cardId) return;
    if (chained) {
      // Let advanceSetupChain drive the next flow; just clear the current card's flow state.
      h.stage = "empty";
      h.activeCard = null;
      h.activeQuestionId = null;
      h.thread = [];
      h.selectedOptions = [];
      h._context = {};
      dispatchHeroUpdate();
      return;
    }
    h.stage = "empty";
    h.activeCard = null;
    h.activeQuestionId = null;
    h.thread = [];
    h.selectedOptions = [];
    h._context = {};
    dispatchHeroUpdate();
  }, 600);
}

function advanceSetupChain(justCompletedCardId) {
  const hero = ensureHeroState();
  const chain = hero.setupChain;
  if (!chain || !Array.isArray(chain.remaining)) return false;
  const next = chain.remaining.shift();
  if (!next) {
    hero.setupChain = null;
    // Chain finished — back to hero, announce completion on next render.
    setTimeout(() => {
      const h = ensureHeroState();
      h.stage = "empty";
      h.activeCard = null;
      h.activeQuestionId = null;
      h.thread = [];
      dispatchHeroUpdate();
    }, 600);
    return true;
  }
  const nextLabel = next === "brief" ? "your brief" : next === "voice" ? "your voice" : "your brand theme";
  const completedLabel =
    justCompletedCardId === "brief" ? "Brief" : justCompletedCardId === "voice" ? "Voice" : "Brand theme";
  setTimeout(() => {
    const h = ensureHeroState();
    startSetupFlow(next, { origin: "default", seedData: null });
    const h2 = ensureHeroState();
    // Replace the default _intro with a chained-flow intro.
    if (h2.thread.length > 0) {
      const intro = h2.thread[h2.thread.length - 1];
      if (intro && intro.type === "ai-bubble") {
        intro.text = completedLabel + " saved. Next: " + nextLabel + ".";
      }
    }
    dispatchHeroUpdate();
  }, 700);
  return true;
}

// Kind-specific submit helpers

// If the current submission happens in edit mode on a collapsed picker,
// this trims the thread to drop that collapsed item + everything after.
// Returns true if the answer changed (downstream was cleared), false otherwise.
function applyEditTruncationIfNeeded(hero, newAnswerText) {
  if (!hero.editingQuestionId) return { changed: false, wasEditing: false };
  const qid = hero.editingQuestionId;
  const idx = hero.thread.findIndex((t) => t.type === "collapsed-picker" && t.questionId === qid);
  if (idx < 0) {
    hero.editingQuestionId = null;
    hero._preEditQuestionId = null;
    hero.editBannerDismissed = false;
    return { changed: false, wasEditing: true };
  }
  const oldAnswer = hero.thread[idx].answerText;
  const changed = oldAnswer !== newAnswerText;
  if (!changed) {
    // Keep the collapsed record + downstream intact; just exit edit mode.
    hero.editingQuestionId = null;
    hero._preEditQuestionId = null;
    hero.editBannerDismissed = false;
    return { changed: false, wasEditing: true };
  }
  // Truncate to the user-bubble that produced this collapsed picker if present,
  // then remove the collapsed picker and everything after.
  let trimStart = idx;
  if (idx > 0 && hero.thread[idx - 1].type === "user-bubble") {
    trimStart = idx - 1;
  }
  hero.thread = hero.thread.slice(0, trimStart);
  hero.editingQuestionId = null;
  hero._preEditQuestionId = null;
  hero.editBannerDismissed = false;
  return { changed: true, wasEditing: true };
}

function recordPickerAnswer(hero, q, answerText) {
  applyEditTruncationIfNeeded(hero, answerText);
  pushUser(hero, answerText);
  pushCollapsedPicker(hero, q.id, q.title, answerText);
}

function submitYesNo(q, value) {
  const hero = ensureHeroState();
  const answerText = value === "yes" ? "Yes" : "No";
  recordPickerAnswer(hero, q, answerText);
  goToNode(value === "yes" ? q.onYes : q.onNo);
}

// ------------------------------------------------------------
// Brief entry helpers
// ------------------------------------------------------------

function findBriefEntry(hero, entryId) {
  for (const section of hero.brief.sections || []) {
    for (const entry of section.entries || []) {
      if (entry.id === entryId) return { section, entry };
    }
  }
  return null;
}

function setBriefEntry(hero, questionId, value) {
  const map = {
    "brief-q3-goal": { sectionId: "goals", label: "Primary objective" },
    "brief-q4-audience": { sectionId: "audience", label: "Target demographic" },
    "brief-q5-voice": { sectionId: "brand-voice", label: "Tone" },
  };
  const hint = map[questionId];
  if (!hint) return;
  const section = hero.brief.sections?.find((s) => s.id === hint.sectionId);
  if (!section) return;
  const entry = section.entries.find((e) => e.label === hint.label);
  if (entry) entry.value = value;
}

function addBriefEntry(sectionId) {
  const hero = ensureHeroState();
  const section = hero.brief.sections?.find((s) => s.id === sectionId);
  if (!section) return;
  const isUrlList = section.kind === "url-list";
  const newEntry = isUrlList
    ? { id: entryId(), label: "", url: "" }
    : { id: entryId(), label: "New field", value: "", multiline: false };
  section.entries.push(newEntry);
  hero._context = hero._context || {};
  hero._context.editingEntryId = newEntry.id;
  dispatchHeroUpdate();
}

function deleteBriefEntry(entryIdValue) {
  const hero = ensureHeroState();
  for (const section of hero.brief.sections || []) {
    const idx = section.entries.findIndex((e) => e.id === entryIdValue);
    if (idx >= 0) {
      section.entries.splice(idx, 1);
      dispatchHeroUpdate();
      return;
    }
  }
}

function addBriefSection() {
  const hero = ensureHeroState();
  const title = window.prompt("Section title?");
  if (!title || !title.trim()) return;
  hero.brief.sections.push({
    id: "custom-" + Date.now().toString(36),
    icon: "✨",
    title: title.trim(),
    entries: [],
  });
  dispatchHeroUpdate();
}

function clearBrief() {
  const hero = ensureHeroState();
  if (!window.confirm("Clear the brief? All entries will be emptied.")) return;
  hero.brief = emptyBrief();
  dispatchHeroUpdate();
}

function copyBrief() {
  const hero = ensureHeroState();
  const lines = ["# Strategy Brief", ""];
  for (const section of hero.brief.sections || []) {
    lines.push("## " + section.icon + " " + section.title);
    if (section.kind === "url-list") {
      for (const entry of section.entries) {
        lines.push("- [" + (entry.label || entry.url || "Link") + "](" + (entry.url || "") + ")");
      }
    } else {
      for (const entry of section.entries) {
        lines.push("- **" + (entry.label || "") + "**: " + (entry.value || ""));
      }
    }
    lines.push("");
  }
  const md = lines.join("\n");
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
}

function refineBriefSection(sectionId) {
  const hero = ensureHeroState();
  hero._context = hero._context || {};
  hero._context.refiningSectionId = sectionId;
  dispatchHeroUpdate();
  setTimeout(() => {
    const h = ensureHeroState();
    const refined = mockBriefRefined(h.brief);
    const targetSection = refined.sections.find((s) => s.id === sectionId);
    if (targetSection) {
      const current = h.brief.sections.find((s) => s.id === sectionId);
      if (current) current.entries = targetSection.entries;
    }
    h._context.refiningSectionId = null;
    dispatchHeroUpdate();
  }, 1200);
}

function refineBriefAll() {
  const hero = ensureHeroState();
  hero._context = hero._context || {};
  hero._context.refiningAll = true;
  dispatchHeroUpdate();
  setTimeout(() => {
    const h = ensureHeroState();
    h.brief = mockBriefRefined(h.brief);
    h._context.refiningAll = false;
    dispatchHeroUpdate();
  }, 1200);
}

function startEntryEdit(entryIdValue) {
  const hero = ensureHeroState();
  hero._context = hero._context || {};
  hero._context.editingEntryId = entryIdValue;
  dispatchHeroUpdate();
}

function commitEntryEdit(entryIdValue, patch) {
  const hero = ensureHeroState();
  const found = findBriefEntry(hero, entryIdValue);
  if (found) {
    Object.assign(found.entry, patch);
  }
  hero._context = hero._context || {};
  hero._context.editingEntryId = null;
  dispatchHeroUpdate();
}

function cancelEntryEdit() {
  const hero = ensureHeroState();
  hero._context = hero._context || {};
  hero._context.editingEntryId = null;
  dispatchHeroUpdate();
}

function submitTextInput(q, text) {
  const hero = ensureHeroState();
  const trimmed = (text || "").trim();
  if (!trimmed) return;
  applyEditTruncationIfNeeded(hero, trimmed);
  pushUser(hero, trimmed);

  // Record into brief fields based on question id
  setBriefEntry(hero, q.id, trimmed);

  goToNode(q.next);
}

function submitUrl(q, url) {
  const hero = ensureHeroState();
  const trimmed = (url || "").trim();
  const valid = /^https?:\/\/.+\..+/.test(trimmed);
  if (!valid) {
    hero._context = hero._context || {};
    hero._context.urlError = "Please enter a valid URL (starting with https://)";
    hero._context.urlDraft = trimmed;
    dispatchHeroUpdate();
    return;
  }
  hero._context = hero._context || {};
  hero._context.url = trimmed;
  hero._context.urlError = "";
  hero._context.urlDraft = "";
  applyEditTruncationIfNeeded(hero, trimmed);
  pushUser(hero, trimmed);
  goToNode(q.next);
}

function submitFileUpload(q) {
  const hero = ensureHeroState();
  const mockFile = { name: "mock-document.pdf", size: 248000 };
  hero.voice.sources.push({ type: "doc", value: mockFile.name, label: mockFile.name });
  recordPickerAnswer(hero, q, "📄 " + mockFile.name);
  pushAI(hero, "Got it, I'll include " + mockFile.name + ". Add another source or say you're done.");
  goToNode(q.next);
}

function submitSocialPicker(q) {
  const hero = ensureHeroState();
  const selected = hero.selectedOptions || [];
  if (!selected.length) return;
  const profiles = SOCIAL_PROFILES.filter((p) => selected.includes(p.id));
  for (const p of profiles) {
    if (!hero.voice.sources.find((s) => s.value === p.id)) {
      hero.voice.sources.push({
        type: "profile",
        value: p.id,
        label: p.platform + " " + p.handle,
      });
    }
  }
  const text = profiles.map((p) => p.platform + " " + p.handle).join(", ");
  recordPickerAnswer(hero, q, text);
  pushAI(hero, "Got it, I'll include " + text + ". Add another source or say you're done.");
  hero.selectedOptions = [];
  goToNode(q.next);
}

function submitMultiAction(q, actionId) {
  const hero = ensureHeroState();
  const option = q.options.find((o) => o.id === actionId);
  if (!option) return;
  if (option.requiresSource && !hero.voice.sources.length) return;
  if (actionId === "done") pushUser(hero, "I'm done, analyze my voice");
  goToNode(option.next);
}

function toggleSocialSelect(profileId) {
  const hero = ensureHeroState();
  const cur = hero.selectedOptions || [];
  hero.selectedOptions = cur.includes(profileId) ? cur.filter((v) => v !== profileId) : [...cur, profileId];
  dispatchHeroUpdate();
}

function confirmBriefRecap() {
  const hero = ensureHeroState();
  pushUser(hero, "Confirm brief");
  pushAI(hero, "Brief locked in. You can edit it from the Brief tab any time.");
  finalizeCard("brief", true);
}

function startOverBrief() {
  const hero = ensureHeroState();
  hero.brief = emptyBrief();
  hero.thread = [];
  pushEyebrow(hero, "brief");
  pushAI(hero, BRIEF_FLOW._intro);
  hero.activeQuestionId = BRIEF_FLOW._start;
  hero._context = {};
  hero.editingQuestionId = null;
  hero._preEditQuestionId = null;
  dispatchHeroUpdate();
}

function saveVoicePreview() {
  const hero = ensureHeroState();
  pushUser(hero, "Save this voice");
  pushAI(hero, "Voice saved. I'll use it on your next drafts.");
  finalizeCard("voice", true);
}

function applyBrand() {
  const hero = ensureHeroState();
  pushUser(hero, "Apply this theme");
  pushAI(hero, "Theme applied. You can edit it from the Brand tab any time.");
  finalizeCard("brand", true);
}

function startOverBrand() {
  const hero = ensureHeroState();
  hero.brand = { colors: [], imagery: [], buttons: [], traits: [] };
  hero.thread = [];
  pushEyebrow(hero, "brand");
  pushAI(hero, BRAND_FLOW._intro);
  hero.activeQuestionId = BRAND_FLOW._start;
  hero._context = {};
  hero.editingQuestionId = null;
  hero._preEditQuestionId = null;
  dispatchHeroUpdate();
}

// ============================================================
// Edit-mode + free-text escape
// ============================================================

function openCollapsedEdit(questionId) {
  const hero = ensureHeroState();
  hero._preEditQuestionId = hero.activeQuestionId;
  hero.editingQuestionId = questionId;
  hero.activeQuestionId = questionId;
  hero.selectedOptions = [];
  hero.useFreeTextEscape = false;
  hero.editBannerDismissed = false;
  dispatchHeroUpdate();
}

function cancelEdit() {
  const hero = ensureHeroState();
  if (!hero.editingQuestionId) return;
  hero.activeQuestionId = hero._preEditQuestionId || hero.activeQuestionId;
  hero.editingQuestionId = null;
  hero._preEditQuestionId = null;
  hero.editBannerDismissed = false;
  hero.useFreeTextEscape = false;
  dispatchHeroUpdate();
}

function dismissEditBanner() {
  const hero = ensureHeroState();
  hero.editBannerDismissed = true;
  dispatchHeroUpdate();
}

function toggleFreeTextEscape(value) {
  const hero = ensureHeroState();
  hero.useFreeTextEscape = !!value;
  dispatchHeroUpdate();
}

// ============================================================
// Init + event delegation
// ============================================================

function normalizePatch(patch) {
  const next = { ...patch };
  if ("activeChip" in next && !("activeCard" in next)) {
    next.activeCard = next.activeChip;
    delete next.activeChip;
  }
  return next;
}

function transitionToWorkspace() {
  const hero = ensureHeroState();
  hero.phase = "workspace";
  dispatchHeroUpdate();
}

function submitComposer() {
  const hero = ensureHeroState();
  const text = (hero.draft || "").trim();
  if (!text) return;
  hero.draft = "";

  const firstMessage = hero.thread.length === 0;
  if (firstMessage && allSetupsNone() && !hero.proposalDismissed) {
    hero.stage = "elicitation";
    hero.activeCard = "proposal";
    hero.activeQuestionId = null;
    hero.thread = [];
    pushUser(hero, text);
    hero.thread.push({
      id: nextThreadId(),
      type: "ai-proposal",
      text:
        "Before we dive in, let's quickly define your brief, voice, and brand theme. " +
        "It'll take a couple of minutes and I'll remember it for all future sessions.",
    });
    dispatchHeroUpdate();
    return;
  }

  dispatchHeroUpdate();
}

function acceptSetupProposal() {
  const hero = ensureHeroState();
  hero.setupChain = { remaining: ["voice", "brand"] };
  hero.proposalDismissed = false;
  startSetupFlow("brief", { origin: "default", seedData: null });
}

function dismissSetupProposal() {
  const hero = ensureHeroState();
  hero.proposalDismissed = true;
  hero.setupChain = null;
  hero.thread.push({
    id: nextThreadId(),
    type: "ai-bubble",
    text: "No problem — I'll work with what you give me. You can define these anytime from the setup cards.",
  });
  hero.stage = "empty";
  hero.activeCard = null;
  hero.activeQuestionId = null;
  dispatchHeroUpdate();
}

function handleFreetext(text) {
  const hero = ensureHeroState();
  const q = currentNode(hero);
  if (!q) return;
  const trimmed = (text || "").trim();
  if (!trimmed) return;

  if (q.kind === "text-input" || q.kind === "text-input-with-suggestions") {
    submitTextInput(q, trimmed);
    return;
  }
  if (q.kind === "url-input") {
    submitUrl(q, trimmed);
    return;
  }
  // For other kinds, free-text isn't a valid answer — shake.
  triggerFreetextShake();
}

export function initHero() {
  ensureHeroState();
  applyAdminMockOnInit();
  renderAdminChip();

  window.__archieSetHero = function (patch) {
    Object.assign(ensureHeroState(), normalizePatch(patch));
    dispatchHeroUpdate();
  };

  const productMark = document.querySelector(".product-mark");
  if (productMark) {
    productMark.setAttribute("role", "button");
    productMark.setAttribute("tabindex", "0");
    productMark.setAttribute("aria-label", "Back to Archie start");
    productMark.addEventListener("click", (event) => {
      event.preventDefault();
      resetToHero();
    });
    productMark.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        resetToHero();
      }
    });
  }

  workspaceContent.addEventListener("click", (event) => {
    const hero = ensureHeroState();
    if (hero.phase !== "hero") return;

    // ---------- Elicitation ----------
    if (hero.stage === "elicitation") {
      if (event.target.closest("[data-setup-proposal-accept]")) {
        acceptSetupProposal();
        return;
      }
      if (event.target.closest("[data-setup-proposal-dismiss]")) {
        dismissSetupProposal();
        return;
      }

      if (event.target.closest("[data-picker-close]")) {
        closePicker(true);
        return;
      }

      // Edit banner actions
      if (event.target.closest("[data-edit-cancel]")) {
        cancelEdit();
        return;
      }
      if (event.target.closest("[data-edit-continue]")) {
        dismissEditBanner();
        return;
      }

      // Collapsed picker → open edit mode
      const collapsed = event.target.closest("[data-collapsed-picker]");
      if (collapsed) {
        openCollapsedEdit(collapsed.dataset.collapsedPicker);
        return;
      }

      // Escape-hatch composer (used when useFreeTextEscape is on)
      if (event.target.closest("[data-escape-back]")) {
        toggleFreeTextEscape(false);
        return;
      }
      if (event.target.closest("[data-escape-send]")) {
        const input = workspaceContent.querySelector("[data-escape-input]");
        if (input) {
          const q2 = currentNode(hero);
          if (q2) {
            const text = input.value.trim();
            if (text) {
              applyEditTruncationIfNeeded(hero, text);
              pushUser(hero, text);
              pushCollapsedPicker(hero, q2.id, q2.title, text);
              hero.useFreeTextEscape = false;
              // Advance using the picker's "next" (yes-no uses onYes for free-text fallback)
              let next = q2.next;
              if (!next && q2.kind === "yes-no") next = q2.onYes;
              if (next) goToNode(next);
              else dispatchHeroUpdate();
            }
          }
        }
        return;
      }

      // "Type your own answer" → swap picker for escape composer
      if (event.target.closest("[data-type-own]")) {
        toggleFreeTextEscape(true);
        return;
      }

      const q = currentNode(hero);
      if (!q) return;

      // Yes/No
      if (q.kind === "yes-no") {
        const row = event.target.closest("[data-yesno]");
        if (row) submitYesNo(q, row.dataset.yesno);
        return;
      }

      // Text input
      if (q.kind === "text-input" || q.kind === "text-input-with-suggestions") {
        if (event.target.closest("[data-textarea-send]")) {
          const input = workspaceContent.querySelector("[data-textarea-input]");
          if (input) submitTextInput(q, input.value);
          return;
        }
        const suggestion = event.target.closest("[data-suggestion]");
        if (suggestion) {
          submitTextInput(q, suggestion.dataset.suggestion);
          return;
        }
        return;
      }

      // URL input
      if (q.kind === "url-input") {
        if (event.target.closest("[data-url-send]")) {
          const input = workspaceContent.querySelector("[data-url-input]");
          if (input) submitUrl(q, input.value);
          return;
        }
        return;
      }

      // File upload (mock)
      if (q.kind === "file-upload") {
        if (event.target.closest("[data-file-pick], [data-file-drop]")) {
          submitFileUpload(q);
          return;
        }
        return;
      }

      // Social picker
      if (q.kind === "social-picker") {
        const row = event.target.closest("[data-social-id]");
        if (row) {
          toggleSocialSelect(row.dataset.socialId);
          return;
        }
        if (event.target.closest("[data-social-continue]")) {
          submitSocialPicker(q);
          return;
        }
        return;
      }

      // Multi-action
      if (q.kind === "multi-action") {
        const btn = event.target.closest("[data-action-id]");
        if (btn && !btn.disabled) {
          submitMultiAction(q, btn.dataset.actionId);
          return;
        }
        return;
      }

      // Brief recap
      if (q.kind === "brief-recap") {
        if (event.target.closest("[data-recap-confirm]")) {
          confirmBriefRecap();
          return;
        }
        const openEntry = event.target.closest("[data-entry-open]");
        if (openEntry) {
          startEntryEdit(openEntry.dataset.entryId || openEntry.closest("[data-entry-id]").dataset.entryId);
          return;
        }
        const saveEntry = event.target.closest("[data-entry-save]");
        if (saveEntry) {
          const row = saveEntry.closest("[data-entry-id]");
          if (row) {
            const id = row.dataset.entryId;
            const labelInput = row.querySelector("[data-entry-label]");
            const urlInput = row.querySelector("[data-entry-url]");
            const valueInput = row.querySelector("[data-entry-value]");
            const patch = {};
            if (labelInput) patch.label = labelInput.value.trim();
            if (urlInput) patch.url = urlInput.value.trim();
            if (valueInput) patch.value = valueInput.value;
            commitEntryEdit(id, patch);
          }
          return;
        }
        if (event.target.closest("[data-entry-cancel]")) {
          cancelEntryEdit();
          return;
        }
        return;
      }

      // Voice preview
      if (q.kind === "voice-preview") {
        if (event.target.closest("[data-voice-save]")) {
          saveVoicePreview();
          return;
        }
        if (event.target.closest("[data-voice-more-toggle]")) {
          const hero2 = ensureHeroState();
          hero2._context = hero2._context || {};
          hero2._context.voiceMoreExpanded = !hero2._context.voiceMoreExpanded;
          dispatchHeroUpdate();
          return;
        }
        return;
      }

      // Brand recap
      if (q.kind === "brand-recap") {
        if (event.target.closest("[data-brand-apply]")) {
          applyBrand();
          return;
        }
        if (event.target.closest("[data-brand-start-over]")) {
          startOverBrand();
          return;
        }
        return;
      }

      // Free-text composer
      if (event.target.closest("[data-freetext-send]")) {
        const input = workspaceContent.querySelector("[data-freetext-input]");
        if (input) {
          handleFreetext(input.value);
          input.value = "";
        }
        return;
      }
      return;
    }

    // ---------- State A (empty hero) ----------
    if (event.target.closest("[data-archie-skip-onboarding]")) {
      hero.onboardingDismissed = true;
      dispatchHeroUpdate();
      return;
    }

    if (event.target.closest("[data-archie-resuggest]")) return;

    if (event.target.closest("[data-archie-view-all]")) {
      event.preventDefault();
      store.getState().toggleSessionSwitcher();
      return;
    }

    // Hero Sources/Ideas blocks
    const heroSource = event.target.closest("[data-hero-source-id]");
    if (heroSource) {
      event.preventDefault();
      store.getState().setCurrentTab("library");
      const sourceId = heroSource.dataset.heroSourceId;
      if (sourceId && typeof store.getState().toggleSource === "function") {
        store.getState().toggleSource(sourceId);
      }
      hero.phase = "workspace";
      dispatchHeroUpdate();
      return;
    }

    const heroIdea = event.target.closest("[data-hero-idea-id]");
    if (heroIdea) {
      event.preventDefault();
      const ideaId = heroIdea.dataset.heroIdeaId;
      store.getState().setCurrentTab("library");
      if (ideaId && typeof store.getState().openIdea === "function") {
        store.getState().openIdea(ideaId);
      }
      hero.phase = "workspace";
      dispatchHeroUpdate();
      return;
    }

    if (event.target.closest("[data-hero-add-source]")) {
      event.preventDefault();
      // No dedicated openSourceModal exists; fall back to transitioning to the
      // workspace library so the user can use the sidebar composer's attach button.
      store.getState().setCurrentTab("library");
      hero.phase = "workspace";
      dispatchHeroUpdate();
      return;
    }

    if (event.target.closest("[data-hero-view-all-sources]") || event.target.closest("[data-hero-view-all-ideas]")) {
      event.preventDefault();
      store.getState().setCurrentTab("library");
      hero.phase = "workspace";
      dispatchHeroUpdate();
      return;
    }

    const sessionBtn = event.target.closest("[data-archie-session]");
    if (sessionBtn) {
      store.getState().switchSession(sessionBtn.dataset.archieSession);
      hero.phase = "workspace";
      dispatchHeroUpdate();
      return;
    }

    const customizeBtn = event.target.closest("[data-archie-customize]");
    if (customizeBtn && workspaceContent.contains(customizeBtn)) {
      event.stopPropagation();
      customizeCardForSession(customizeBtn.dataset.archieCustomize);
      return;
    }

    const revertBtn = event.target.closest("[data-archie-revert]");
    if (revertBtn && workspaceContent.contains(revertBtn)) {
      event.stopPropagation();
      revertCardToDefault(revertBtn.dataset.archieRevert);
      return;
    }

    const cardBtn = event.target.closest("[data-archie-card]");
    if (cardBtn && workspaceContent.contains(cardBtn)) {
      openCard(cardBtn.dataset.archieCard);
      return;
    }

    const sourceKindBtn = event.target.closest("[data-archie-source-kind]");
    if (sourceKindBtn) {
      hero.sourceKind = sourceKindBtn.dataset.archieSourceKind;
      dispatchHeroUpdate();
      return;
    }

    if (event.target.closest("[data-archie-attach]")) {
      transitionToWorkspace();
      return;
    }

    if (event.target.closest("[data-archie-send]")) {
      submitComposer();
      return;
    }
  });

  workspaceContent.addEventListener("input", (event) => {
    const hero = ensureHeroState();
    if (hero.phase !== "hero") return;

    if (event.target.matches("[data-textarea-input]")) {
      const sendBtn = workspaceContent.querySelector("[data-textarea-send]");
      if (sendBtn) sendBtn.disabled = !event.target.value.trim();
      return;
    }

    if (event.target.matches("[data-url-input]")) {
      hero._context = hero._context || {};
      hero._context.urlDraft = event.target.value;
      return;
    }

    if (event.target.matches("[data-recap-edit]")) {
      const key = event.target.dataset.recapEdit;
      hero.brief[key] = event.target.value;
      return;
    }

    if (event.target.matches("[data-archie-input]")) {
      hero.draft = event.target.value;
      const sendBtn = workspaceContent.querySelector("[data-archie-send]");
      if (sendBtn) sendBtn.disabled = !hero.draft.trim();
    }
  });

  workspaceContent.addEventListener("keydown", (event) => {
    const hero = ensureHeroState();
    if (hero.phase !== "hero") return;

    if (event.key === "Escape") {
      if (hero.stage === "elicitation" && !event.target.matches("[data-freetext-input]")) {
        event.preventDefault();
        closePicker(true);
        return;
      }
      if (event.target.matches("[data-freetext-input]")) {
        event.target.blur();
        return;
      }
    }

    if (hero.stage === "elicitation") {
      // Don't hijack keys when a text input has focus
      const inText = event.target.matches(
        "[data-textarea-input], [data-url-input], [data-escape-input], [data-recap-edit], [data-entry-value], [data-entry-label], [data-entry-url]",
      );

      if (!inText) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          focusPickerOffset(1);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          focusPickerOffset(-1);
          return;
        }
        if (/^[1-9]$/.test(event.key)) {
          if (focusPickerByNumber(Number(event.key))) {
            event.preventDefault();
            // Single-select kinds submit on focus+Enter; for multi-action and yes-no,
            // also auto-click so the number shortcut behaves as "submit option N".
            const q = currentNode(hero);
            if (q && (q.kind === "yes-no" || q.kind === "multi-action")) {
              document.activeElement?.click();
            } else if (q && q.kind === "social-picker") {
              // Multi-select: toggle, don't submit.
              document.activeElement?.click();
            }
          }
          return;
        }
      }

      if (event.key === "Enter") {
        if (event.target.matches("[data-textarea-input]")) {
          if (!event.shiftKey) {
            event.preventDefault();
            const q = currentNode(hero);
            if (q) submitTextInput(q, event.target.value);
          }
          return;
        }
        if (event.target.matches("[data-url-input]")) {
          event.preventDefault();
          const q = currentNode(hero);
          if (q) submitUrl(q, event.target.value);
          return;
        }
        if (event.target.matches("[data-entry-value]:not(textarea), [data-entry-label], [data-entry-url]")) {
          event.preventDefault();
          const row = event.target.closest("[data-entry-id]");
          if (row) {
            const id = row.dataset.entryId;
            const labelInput = row.querySelector("[data-entry-label]");
            const urlInput = row.querySelector("[data-entry-url]");
            const valueInput = row.querySelector("[data-entry-value]");
            const patch = {};
            if (labelInput) patch.label = labelInput.value.trim();
            if (urlInput) patch.url = urlInput.value.trim();
            if (valueInput) patch.value = valueInput.value;
            commitEntryEdit(id, patch);
          }
          return;
        }
        if (event.target.matches("[data-escape-input]")) {
          event.preventDefault();
          const input = event.target;
          const q = currentNode(hero);
          if (q) {
            const text = input.value.trim();
            if (text) {
              applyEditTruncationIfNeeded(hero, text);
              pushUser(hero, text);
              pushCollapsedPicker(hero, q.id, q.title, text);
              hero.useFreeTextEscape = false;
              let next = q.next;
              if (!next && q.kind === "yes-no") next = q.onYes;
              if (next) goToNode(next);
              else dispatchHeroUpdate();
            }
          }
          return;
        }
      }
      return;
    }

    if (event.target.matches("[data-archie-input]") && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      hero.draft = event.target.value;
      submitComposer();
    }
  });

  workspaceContent.addEventListener(
    "blur",
    (event) => {
      const hero = ensureHeroState();
      if (!event.target.matches("[data-recap-edit]")) return;
      hero._context = hero._context || {};
      hero._context.editingField = null;
      dispatchHeroUpdate();
    },
    true,
  );
}

export { CARD_ORDER, BRIEF_FLOW, VOICE_FLOW, BRAND_FLOW };
