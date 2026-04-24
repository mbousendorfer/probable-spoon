import { navigate } from "../router.js?v=17";
import { renderTopbar } from "../components/topbar.js?v=17";
import { strategyBrief } from "../mocks.js?v=17";
import {
  wizardChrome,
  chatTurn,
  fieldsBlock,
  summarySections,
  getStep,
  setStep,
  advanceContextStage,
  bindWizardKeyboard,
  unbindWizardKeyboard,
} from "./_analyse-common.js?v=17";

// Strategy brief wizard — one step per section + summary.

const SECTIONS = strategyBrief.sections;

const SECTION_PICKER = {
  items: [
    { value: "good", label: "Looks good, continue", icon: "ap-icon-rounded-check" },
    { value: "rework", label: "Needs work — regenerate this part", icon: "ap-icon-refresh" },
  ],
  handler: "brief-answer",
  customPlaceholder: "Something else — type your answer…",
};

const SUMMARY_PICKER = {
  items: [
    { value: "yes", label: "Yes, looks great", icon: "ap-icon-rounded-check" },
    { value: "no", label: "No — start over", icon: "ap-icon-refresh" },
  ],
  handler: "brief-answer",
  customPlaceholder: "Something else — type your answer…",
};

export function renderAnalyseBrief(_params, target) {
  renderTopbar({ crumb: "Build the brief" });

  const step = getStep("0");
  const { body, picker } = renderStep(step);

  target.innerHTML = wizardChrome({ body, picker });

  target.addEventListener("click", (event) => {
    const answer = event.target.closest("[data-brief-answer]");
    if (answer) {
      handleAnswer(step, answer.dataset.briefAnswer);
      return;
    }
    if (event.target.closest("[data-analyse-exit]")) {
      unbindWizardKeyboard();
      navigate("/");
    }
  });

  bindWizardKeyboard(target, {
    handler: "brief-answer",
    onExit: () => {
      unbindWizardKeyboard();
      navigate("/");
    },
    onCustomSubmit: () => {
      handleAnswer(step, "other");
    },
  });
}

function renderStep(step) {
  if (step === "summary") {
    return {
      body:
        chatTurn({ role: "user", text: "Looks good, continue." }) +
        chatTurn({
          role: "ai",
          text: "Here's your full strategy brief. Keep it, or start over.",
          contentHtml: summarySections(
            SECTIONS.map((s) => ({
              title: s.title,
              bullets: s.fields.map((f) => `${f.label}: ${f.value}`),
            })),
            `
              <label class="ap-toggle-container">
                <input type="checkbox" checked />
                <i></i>
                <span>Use this brief as default for future sessions</span>
              </label>
            `,
          ),
        }),
      picker: SUMMARY_PICKER,
    };
  }

  const idx = Number(step);
  const section = SECTIONS[idx] || SECTIONS[0];
  const currentIdx = Number.isNaN(idx) ? 0 : idx;

  const aiText =
    currentIdx === 0
      ? `Let's shape the ${section.title.toLowerCase()}. Section 1 of ${SECTIONS.length}. Does this fit?`
      : `Next up — ${section.title.toLowerCase()} (${currentIdx + 1} of ${SECTIONS.length}). Does this fit?`;

  const lastUser = currentIdx === 0 ? "" : chatTurn({ role: "user", text: "Looks good, continue." });

  return {
    body:
      lastUser +
      chatTurn({
        role: "ai",
        text: aiText,
        contentHtml: fieldsBlock(section.fields),
      }),
    picker: SECTION_PICKER,
  };
}

function handleAnswer(step, value) {
  if (step === "summary") {
    if (value === "yes") {
      unbindWizardKeyboard();
      advanceContextStage("brief");
    } else if (value === "no") {
      setStep("0");
    } else {
      unbindWizardKeyboard();
      advanceContextStage("brief");
    }
    return;
  }

  const idx = Number(step);
  const nextIdx = idx + 1;
  if (nextIdx >= SECTIONS.length) {
    setStep("summary");
  } else {
    setStep(String(nextIdx));
  }
}
