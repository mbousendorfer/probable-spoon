import { navigate } from "../router.js?v=20";
import { renderTopbar } from "../components/topbar.js?v=21";
import { strategyBrief } from "../mocks.js?v=22";
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
  scrollChatToLatest,
} from "./_analyse-common.js?v=24";

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
  scrollChatToLatest(target);

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

function sectionTurn(i) {
  const section = SECTIONS[i];
  const aiText =
    i === 0
      ? `Let's shape the ${section.title.toLowerCase()}. Section 1 of ${SECTIONS.length}. Does this fit?`
      : `Next up — ${section.title.toLowerCase()} (${i + 1} of ${SECTIONS.length}). Does this fit?`;
  return chatTurn({ role: "ai", text: aiText, contentHtml: fieldsBlock(section.fields) });
}

// Each step returns the FULL accumulated conversation so prior answers stay
// visible as the user advances. Past user turns use the canonical "Looks
// good, continue." label because that's the only value that advances.
function renderStep(step) {
  const isSummary = step === "summary";
  const idx = Number(step);
  const currentIdx = isSummary ? SECTIONS.length : Number.isNaN(idx) ? 0 : idx;

  // Replay every prior section Q + answer the user has already cleared.
  let history = "";
  for (let i = 0; i < currentIdx; i++) {
    history += sectionTurn(i);
    history += chatTurn({ role: "user", text: "Looks good, continue." });
  }

  if (isSummary) {
    return {
      body:
        history +
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

  return {
    body: history + sectionTurn(currentIdx),
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
