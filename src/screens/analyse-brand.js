import { navigate } from "../router.js?v=17";
import { renderTopbar } from "../components/topbar.js?v=17";
import { brandTheme } from "../mocks.js?v=17";
import {
  wizardChrome,
  chatTurn,
  getStep,
  setStep,
  advanceContextStage,
  bindWizardKeyboard,
  unbindWizardKeyboard,
} from "./_analyse-common.js?v=17";

// Brand theme wizard.
// Step 0        → URL input (custom sticky footer instead of a picker)
// Step 1        → theme preview (sticky footer = Start over / Apply)
// Step summary  → theme preview + "All good?" picker

const SUMMARY_PICKER = {
  items: [
    { value: "yes", label: "All good, apply this theme", icon: "ap-icon-rounded-check" },
    { value: "no", label: "No — let me try another URL", icon: "ap-icon-refresh" },
  ],
  handler: "brand-answer",
  customPlaceholder: "Something else — type your answer…",
};

export function renderAnalyseBrand(_params, target) {
  renderTopbar({ crumb: "Set brand theme" });

  const step = getStep("0");
  const descriptor = renderStep(step);

  target.innerHTML = wizardChrome(descriptor);

  target.addEventListener("click", (event) => {
    if (event.target.closest("[data-brand-analyze]")) {
      setStep("1");
      return;
    }
    if (event.target.closest("[data-brand-apply]")) {
      setStep("summary");
      return;
    }
    if (event.target.closest("[data-brand-restart]")) {
      setStep("0");
      return;
    }
    const answer = event.target.closest("[data-brand-answer]");
    if (answer) {
      if (answer.dataset.brandAnswer === "yes") {
        unbindWizardKeyboard();
        advanceContextStage("brand");
      } else {
        setStep("0");
      }
      return;
    }
    if (event.target.closest("[data-analyse-exit]")) {
      unbindWizardKeyboard();
      navigate("/");
    }
  });

  // URL step: submit on Enter inside the input.
  if (step === "0") {
    const input = target.querySelector("[data-brand-url]");
    if (input) {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          setStep("1");
        }
      });
      queueMicrotask(() => input.focus());
    }
    bindWizardKeyboard(target, {
      handler: "brand-answer",
      onExit: () => {
        unbindWizardKeyboard();
        navigate("/");
      },
    });
    return;
  }

  bindWizardKeyboard(target, {
    handler: "brand-answer",
    onExit: () => {
      unbindWizardKeyboard();
      navigate("/");
    },
    onCustomSubmit: () => {
      unbindWizardKeyboard();
      advanceContextStage("brand");
    },
  });
}

function renderStep(step) {
  if (step === "1") {
    return {
      body:
        chatTurn({ role: "user", text: brandTheme.url }) +
        chatTurn({
          role: "ai",
          text: "Here's your brand theme.",
          contentHtml: renderThemePreview(),
        }),
      stickyFooter: `
        <div class="analyse__footer-actions">
          <button type="button" class="ap-button transparent grey" data-brand-restart>
            <i class="ap-icon-refresh"></i>
            <span>Start over</span>
          </button>
          <button type="button" class="ap-button primary orange" data-brand-apply>
            <span>Apply this theme</span>
            <i class="ap-icon-arrow-right"></i>
          </button>
        </div>
      `,
    };
  }

  if (step === "summary") {
    return {
      body:
        chatTurn({ role: "user", text: "Apply this theme." }) +
        chatTurn({
          role: "ai",
          text: "All good? I'll pin this brand theme to the session.",
          contentHtml: renderThemePreview(),
        }),
      picker: SUMMARY_PICKER,
    };
  }

  // Step 0 — URL intake.
  return {
    body: chatTurn({
      role: "ai",
      text: "Where's your brand? I'll pull colors, imagery, buttons, and personality straight from your site.",
      contentHtml: `
          <div class="analyse__url-card">
            <div class="ap-form-field analyse__url-field">
              <label>Brand URL</label>
              <div class="ap-input-group">
                <i class="ap-icon-web"></i>
                <input type="url" placeholder="https://yourbrand.com" value="${brandTheme.url}" data-brand-url />
              </div>
            </div>
            <button type="button" class="ap-button primary orange" data-brand-analyze>
              <i class="ap-icon-sparkles"></i>
              <span>Analyze brand</span>
            </button>
          </div>
        `,
    }),
    stickyFooter: `
      <p class="analyse__footer-hint muted">
        Type your URL above and press <kbd>Enter</kbd>, or click <b>Analyze brand</b>.
      </p>
    `,
  };
}

function renderThemePreview() {
  const colorTiles = brandTheme.colors
    .map(
      (c) => `
        <div class="analyse__color">
          <span class="analyse__color-swatch" style="background: ${c.hex}"></span>
          <span class="stack-sm">
            <span class="analyse__color-name">${c.name}</span>
            <span class="muted">${c.hex}</span>
          </span>
        </div>
      `,
    )
    .join("");

  const imageryTiles = brandTheme.imageryNotes
    .map(
      (note) => `
        <div class="analyse__imagery-tile">
          <i class="ap-icon-image md"></i>
          <p class="muted">${note}</p>
        </div>
      `,
    )
    .join("");

  const sampleButtons = brandTheme.buttons
    .map(
      (b) =>
        `<button type="button" class="ap-button ${b.variant === "primary" ? "primary orange" : "stroked grey"}">${b.label}</button>`,
    )
    .join("");

  const personalityTags = brandTheme.personality.map((p) => `<span class="ap-tag blue">${p}</span>`).join("");

  return `
    <div class="analyse__theme-preview">
      <section class="analyse__theme-section">
        <h4>Colors</h4>
        <div class="analyse__color-row">${colorTiles}</div>
      </section>
      <section class="analyse__theme-section">
        <h4>Imagery</h4>
        <div class="analyse__imagery-row">${imageryTiles}</div>
      </section>
      <section class="analyse__theme-section">
        <h4>Buttons</h4>
        <div class="row">${sampleButtons}</div>
      </section>
      <section class="analyse__theme-section">
        <h4>Personality</h4>
        <div class="row analyse__personality-row">${personalityTags}</div>
      </section>
    </div>
  `;
}
