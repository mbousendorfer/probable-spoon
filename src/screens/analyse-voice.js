import { navigate } from "../router.js?v=17";
import { renderTopbar } from "../components/topbar.js?v=17";
import { voiceAnalysis } from "../mocks.js?v=17";
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
} from "./_analyse-common.js?v=17";

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

function renderStep(step) {
  if (step === "0") {
    return {
      body: chatTurn({
        role: "ai",
        text: "Want me to learn how you write? I'll analyze a profile or a document to match your voice.",
      }),
      picker: INTAKE_PICKER,
    };
  }

  if (step === "1") {
    return {
      body:
        chatTurn({
          role: "ai",
          text: "Want me to learn how you write? I'll analyze a profile or a document to match your voice.",
        }) +
        chatTurn({ role: "user", text: "Yes, analyze my writing." }) +
        chatTurn({
          role: "ai",
          text: "Which profile should I analyze?",
        }),
      picker: SOURCE_PICKER,
    };
  }

  if (step === "summary") {
    return {
      body:
        chatTurn({ role: "user", text: "Looks good, continue." }) +
        chatTurn({
          role: "ai",
          text: "Here's your full voice profile. Keep it or start over.",
          contentHtml: summarySections(SECTIONS),
        }),
      picker: SUMMARY_PICKER,
    };
  }

  const idx = Number(step);
  const sectionIndex = idx - 2;
  const section = SECTIONS[sectionIndex];
  if (!section) {
    return renderStep("0");
  }

  const lastUser =
    sectionIndex === 0
      ? chatTurn({ role: "user", text: "Use the sources I already attached." })
      : chatTurn({ role: "user", text: "Looks good, continue." });

  return {
    body:
      lastUser +
      chatTurn({
        role: "ai",
        text: `Here's what I'm hearing in the ${section.title.toLowerCase()} (${sectionIndex + 1} of ${SECTIONS.length}). Does it fit?`,
        contentHtml: bulletsBlock(section.bullets),
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
