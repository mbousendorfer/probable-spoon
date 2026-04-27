import { navigate } from "../router.js?v=20";
import { renderTopbar } from "../components/topbar.js?v=21";
import { voiceAnalysis } from "../mocks.js?v=22";
import {
  wizardChrome,
  chatTurn,
  bulletsBlock,
  summarySections,
  getStep,
  setStep,
  advanceContextStage,
  bindWizardKeyboard,
  unbindWizardKeyboard,
  scrollChatToLatest,
} from "./_analyse-common.js?v=24";

// Voice wizard — conversational flow.
// Step 0        → "Want me to learn how you write?"
// Step 1        → source picker
// Step 2..N+1   → one step per Voice section, reviewing the extracted analysis
// Step summary  → stacked summary + "All good?"

const SECTIONS = voiceAnalysis.sections;

const INTAKE_PICKER = {
  items: [
    { value: "yes", label: "Yes, analyze my writing", icon: "ap-icon-check" },
    { value: "no", label: "Not yet — skip for now", icon: "ap-icon-arrow-right" },
  ],
  handler: "voice-answer",
  customPlaceholder: "Something else — type your answer…",
};

const SOURCE_PICKER = {
  items: [
    { value: "linkedin", label: "Select a social profile", icon: "ap-icon-linkedin", caption: "LinkedIn, X, Threads…" },
    { value: "document", label: "Upload a document", icon: "ap-icon-file--text", caption: "PDF, DOCX, Markdown" },
    { value: "done", label: "Use the sources already attached", icon: "ap-icon-sparkles" },
  ],
  handler: "voice-answer",
  customPlaceholder: "Something else — type your answer…",
};

const SECTION_PICKER = {
  items: [
    { value: "good", label: "Looks good, continue", icon: "ap-icon-rounded-check" },
    { value: "rework", label: "Needs work — regenerate this part", icon: "ap-icon-refresh" },
  ],
  handler: "voice-answer",
  customPlaceholder: "Something else — type your answer…",
};

const SUMMARY_PICKER = {
  items: [
    { value: "yes", label: "Yes, looks great", icon: "ap-icon-rounded-check" },
    { value: "no", label: "No — start over", icon: "ap-icon-refresh" },
  ],
  handler: "voice-answer",
  customPlaceholder: "Something else — type your answer…",
};

export function renderAnalyseVoice(_params, target) {
  renderTopbar({ crumb: "Analyze my voice" });

  const step = getStep("0");
  const { body, picker } = renderStep(step);

  target.innerHTML = wizardChrome({ body, picker });
  scrollChatToLatest(target);

  target.addEventListener("click", (event) => {
    const answer = event.target.closest("[data-voice-answer]");
    if (answer) {
      handleAnswer(step, answer.dataset.voiceAnswer);
      return;
    }
    if (event.target.closest("[data-analyse-exit]")) {
      unbindWizardKeyboard();
      navigate("/");
    }
  });

  bindWizardKeyboard(target, {
    handler: "voice-answer",
    onExit: () => {
      unbindWizardKeyboard();
      navigate("/");
    },
    onCustomSubmit: () => {
      // Any typed answer moves the conversation forward just like picking an option.
      handleAnswer(step, "other");
    },
  });
}

// Each step returns the FULL accumulated conversation so prior answers stay
// visible as the user advances. Because the prototype doesn't persist the
// user's typed-or-picked answers, past user turns use canonical text for each
// step ("Yes, analyze my writing.", "Looks good, continue.", etc.) — the only
// way to reach step N is to have taken the advancing branch, so these labels
// are accurate for any thread that actually renders.
function renderStep(step) {
  const intakeQ = chatTurn({
    role: "ai",
    text: "Want me to learn how you write? I'll analyze a profile or a document to match your voice.",
  });

  if (step === "0") {
    return { body: intakeQ, picker: INTAKE_PICKER };
  }

  const intakeA = chatTurn({ role: "user", text: "Yes, analyze my writing." });
  const sourceQ = chatTurn({ role: "ai", text: "Which profile should I analyze?" });

  if (step === "1") {
    return { body: intakeQ + intakeA + sourceQ, picker: SOURCE_PICKER };
  }

  const sourceA = chatTurn({ role: "user", text: "Use the sources I already attached." });

  const isSummary = step === "summary";
  const idx = Number(step);
  const currentSectionIdx = isSummary ? SECTIONS.length : idx - 2;

  // Replay every section Q + "Looks good, continue." answer the user has
  // already taken to reach the current step.
  let sectionHistory = "";
  for (let i = 0; i < currentSectionIdx; i++) {
    const section = SECTIONS[i];
    sectionHistory += chatTurn({
      role: "ai",
      text: `Here's what I'm hearing in the ${section.title.toLowerCase()} (${i + 1} of ${SECTIONS.length}). Does it fit?`,
      contentHtml: bulletsBlock(section.bullets),
    });
    sectionHistory += chatTurn({ role: "user", text: "Looks good, continue." });
  }

  const priorTurns = intakeQ + intakeA + sourceQ + sourceA + sectionHistory;

  if (isSummary) {
    return {
      body:
        priorTurns +
        chatTurn({
          role: "ai",
          text: "Here's your full voice profile. Keep it or start over.",
          contentHtml: summarySections(SECTIONS),
        }),
      picker: SUMMARY_PICKER,
    };
  }

  const currentSection = SECTIONS[currentSectionIdx];
  if (!currentSection) {
    return renderStep("0");
  }

  return {
    body:
      priorTurns +
      chatTurn({
        role: "ai",
        text: `Here's what I'm hearing in the ${currentSection.title.toLowerCase()} (${currentSectionIdx + 1} of ${SECTIONS.length}). Does it fit?`,
        contentHtml: bulletsBlock(currentSection.bullets),
      }),
    picker: SECTION_PICKER,
  };
}

function handleAnswer(step, value) {
  if (step === "0") {
    if (value === "no") {
      unbindWizardKeyboard();
      navigate("/");
      return;
    }
    setStep("1");
    return;
  }

  if (step === "1") {
    setStep("2");
    return;
  }

  if (step === "summary") {
    if (value === "yes") {
      unbindWizardKeyboard();
      advanceContextStage("voice");
    } else if (value === "no") {
      setStep("2");
    } else {
      unbindWizardKeyboard();
      advanceContextStage("voice");
    }
    return;
  }

  // Per-section answer → advance.
  const idx = Number(step);
  const nextIdx = idx + 1;
  if (nextIdx - 2 >= SECTIONS.length) {
    setStep("summary");
  } else {
    setStep(String(nextIdx));
  }
}
