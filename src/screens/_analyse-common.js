import { html, raw } from "../utils.js?v=17";

// Shared pieces for all three Analyse wizards.
//
// Visual model: conversational flow — AI Copilot + You bubbles in a
// scrollable chat area, with a sticky picker bar at the bottom of the screen.
// The sticky bar holds option rows and an always-visible "Something else"
// text input so the user can type a custom answer at any time.
//
// A step renderer returns:
//   {
//     body:          HTML string (chat turns + any content inside the AI bubble)
//     picker?:       { items, handler, customPlaceholder?, customHandler? } | null
//     stickyFooter?: raw HTML to render inside the sticky bar INSTEAD of a
//                    picker (used by Brand preview step for Start over / Apply)
//   }

// -- Stage orchestration ---------------------------------------------------
//
// The context wizard is a linear walk through any subset of {voice, brief,
// brand}. The selected stage list + current context name/id are carried as
// URL query params so each stage wizard knows where to go on completion.
//
//   ?stages=voice,brief,brand&name=Acme&contextId=ctx-acme
//
// advanceContextStage(currentStage) navigates to the next selected stage, or
// to the context summary if this was the last.

export function advanceContextStage(currentStage) {
  const rawQs = window.location.hash.split("?")[1] || "";
  const params = new URLSearchParams(rawQs);
  const stages = (params.get("stages") || "").split(",").filter(Boolean);
  const idx = stages.indexOf(currentStage);
  const nextStage = idx >= 0 ? stages[idx + 1] : null;

  // Reset any step state but keep the stages/name/contextId in the URL.
  params.delete("step");

  if (nextStage) {
    window.location.hash = `#/analyse/${nextStage}?${params.toString()}`;
  } else {
    window.location.hash = `#/analyse/summary?${params.toString()}`;
  }
}

// -- Step param in the URL --------------------------------------------------

export function getStep(defaultStep) {
  const raw = window.location.hash.split("?")[1] || "";
  const params = new URLSearchParams(raw);
  return params.get("step") || defaultStep;
}

export function setStep(step) {
  const path = window.location.hash.split("?")[0];
  const raw = window.location.hash.split("?")[1] || "";
  const params = new URLSearchParams(raw);
  params.set("step", step);
  window.location.hash = `${path}?${params.toString()}`;
}

// -- Wizard shell (conversational layout) -----------------------------------

export function wizardChrome({ body, picker = null, stickyFooter = null }) {
  return html`
    <section class="screen analyse analyse--wizard">
      <div class="analyse__chat" id="analyseChat">
        <div class="analyse__chat-inner">${raw(body)}</div>
      </div>
      <div class="analyse__sticky-bar" role="group" aria-label="Answer">
        <div class="analyse__sticky-bar-inner">
          ${raw(stickyFooter != null ? stickyFooter : renderPicker(picker))}
          <p class="analyse__hints muted">
            <kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>1</kbd>–<kbd>9</kbd> pick · <kbd>Enter</kbd> submit ·
            <kbd>Esc</kbd> exit
          </p>
        </div>
      </div>
    </section>
  `;
}

// -- Chat turns -------------------------------------------------------------

export function chatTurn({ role, text, contentHtml = "" }) {
  // role = "ai" | "user"
  // Layout: header row (icon + role label) stacked above the bubble body.
  const iconClass = role === "ai" ? "ap-icon-sparkles-mermaid" : "ap-icon-question";
  const label = role === "ai" ? "Archie" : "You";

  return `
    <div class="chat-turn chat-turn--${role === "ai" ? "ai" : "user"}">
      <div class="chat-turn-header">
        <i class="${iconClass} chat-turn-avatar" aria-hidden="true"></i>
        <span class="chat-turn-role">${label}</span>
      </div>
      <div class="chat-bubble chat-bubble--${role === "ai" ? "ai" : "user"}">
        ${text ? `<p class="chat-bubble-text">${text}</p>` : ""}
        ${contentHtml || ""}
      </div>
    </div>
  `;
}

// -- Content blocks rendered INSIDE an AI bubble ----------------------------

export function bulletsBlock(bulletsList) {
  if (!bulletsList || !bulletsList.length) return "";
  return `
    <ul class="chat-bubble-list">
      ${bulletsList.map((b) => `<li>${b}</li>`).join("")}
    </ul>
  `;
}

export function fieldsBlock(fields) {
  if (!fields || !fields.length) return "";
  return `
    <dl class="chat-bubble-fields">
      ${fields
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
  `;
}

export function summarySections(sections, headerExtra = "") {
  const extraMarkup = headerExtra ? `<div class="chat-bubble-header-extra">${headerExtra}</div>` : "";

  const sectionsMarkup = sections
    .map(
      (s) => `
        <section class="chat-bubble-section">
          <h4>${s.title}</h4>
          <ul>${s.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
        </section>
      `,
    )
    .join("");

  return `${extraMarkup}<div class="chat-bubble-summary">${sectionsMarkup}</div>`;
}

// -- Sticky picker (option rows + optional text input) ----------------------

function renderPicker(picker) {
  if (!picker) return "";
  const { items = [], handler, customPlaceholder = null, customHandler = null } = picker;

  const rows = items
    .map(
      (it, i) => `
        <button
          type="button"
          class="analyse__option"
          data-${handler}="${it.value}"
        >
          <span class="analyse__option-shortcut" aria-hidden="true">${i + 1}</span>
          <span class="analyse__option-icon">
            <i class="${it.icon}"></i>
          </span>
          <span class="analyse__option-text">
            <span class="analyse__option-label">${it.label}</span>
            ${it.caption ? `<span class="muted">${it.caption}</span>` : ""}
          </span>
          <i class="ap-icon-chevron-right analyse__option-chevron"></i>
        </button>
      `,
    )
    .join("");

  const customRow = customPlaceholder
    ? `
      <label class="analyse__option analyse__option--input" data-custom-row>
        <span class="analyse__option-shortcut" aria-hidden="true">${items.length + 1}</span>
        <span class="analyse__option-icon">
          <i class="ap-icon-pen"></i>
        </span>
        <input
          type="text"
          class="analyse__option-input"
          placeholder="${customPlaceholder}"
          data-${customHandler || handler}-custom
          aria-label="${customPlaceholder}"
        />
        <button
          type="button"
          class="ap-icon-button stroked analyse__option-send"
          data-${customHandler || handler}-custom-submit
          aria-label="Submit typed answer"
          tabindex="-1"
        >
          <i class="ap-icon-paper-plane"></i>
        </button>
      </label>
    `
    : "";

  return `<div class="analyse__options">${rows}${customRow}</div>`;
}

// -- Keyboard wiring --------------------------------------------------------
//
//   - Digits 1..9      → click the Nth option (text inputs with data-custom-row
//                        are skipped — the digit that matches the input row
//                        focuses the input instead)
//   - ArrowDown / Up   → move focus between options (including the input row)
//   - Enter (on input) → submit the typed text via onCustomSubmit
//   - Enter (outside)  → activate focused option; else activate the first
//   - Escape           → onExit
//
// Focus behavior on render: the first option gets focus so keyboard users
// always see where they are.

let currentKeyListener = null;

export function bindWizardKeyboard(target, { handler, onExit, onCustomSubmit = null }) {
  unbindWizardKeyboard();

  const listener = (event) => {
    const activeIsInput =
      event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA" || event.target.isContentEditable;

    if (event.key === "Escape") {
      event.preventDefault();
      onExit();
      return;
    }

    const focusables = Array.from(target.querySelectorAll(`[data-${handler}], [data-${handler}-custom]`));
    if (!focusables.length) return;

    // ArrowDown/Up cycles through option rows + the input row.
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const current = document.activeElement;
      const currentIdx = focusables.indexOf(current);
      let nextIdx;
      if (event.key === "ArrowDown") {
        nextIdx = currentIdx < 0 ? 0 : Math.min(currentIdx + 1, focusables.length - 1);
      } else {
        nextIdx = currentIdx <= 0 ? 0 : currentIdx - 1;
      }
      focusables[nextIdx]?.focus();
      return;
    }

    // Digits — only when the user isn't typing into the input.
    if (/^[1-9]$/.test(event.key) && !activeIsInput) {
      const idx = Number(event.key) - 1;
      const target = focusables[idx];
      if (target) {
        event.preventDefault();
        if (target.tagName === "INPUT") target.focus();
        else target.click();
      }
      return;
    }

    // Enter — submit typed input, or activate first option.
    if (event.key === "Enter") {
      if (activeIsInput && onCustomSubmit) {
        event.preventDefault();
        const value = event.target.value.trim();
        if (value) onCustomSubmit(value);
        return;
      }
      if (!activeIsInput) {
        const focused = document.activeElement;
        const inPicker = focusables.includes(focused);
        if (!inPicker) {
          event.preventDefault();
          const firstButton = focusables.find((el) => el.tagName !== "INPUT");
          if (firstButton) firstButton.click();
        }
      }
    }
  };

  currentKeyListener = listener;
  document.addEventListener("keydown", listener);

  // Click on the send-icon submits the typed value too.
  target.addEventListener("click", (event) => {
    const btn = event.target.closest(`[data-${handler}-custom-submit]`);
    if (btn && onCustomSubmit) {
      const input = target.querySelector(`[data-${handler}-custom]`);
      const value = (input?.value || "").trim();
      if (value) onCustomSubmit(value);
    }
  });

  // Focus first option on render.
  queueMicrotask(() => {
    const first = target.querySelector(`[data-${handler}]`);
    if (first) first.focus();
    // And always scroll the chat to the bottom on new step.
    const chat = target.querySelector("#analyseChat");
    if (chat) chat.scrollTop = chat.scrollHeight;
  });
}

export function unbindWizardKeyboard() {
  if (currentKeyListener) {
    document.removeEventListener("keydown", currentKeyListener);
    currentKeyListener = null;
  }
}
