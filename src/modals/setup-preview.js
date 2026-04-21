/**
 * setup-preview.js — "Preview: Brief / Voice / Brand" dialog.
 * Opened when the user clicks a setup card that already has a default or override.
 * Body renders the recap via the body-renderers exported from hero.js.
 * Footer: "Re-run setup" (relaunches the elicitation flow pre-filled) + "Close".
 */
import {
  ensureHeroState,
  getEffectiveSetup,
  closeSetupPreviewModal,
  customizeCardForSession,
  renderBriefRecapBody,
  renderVoicePreviewBody,
  renderBrandRecapBody,
} from "../views/hero.js?v=1";

const CARD_TITLES = {
  brief: "Strategy brief",
  voice: "Voice",
  brand: "Brand theme",
};

let backdrop, modal, titleEl, bodyEl, reRunBtn, originLabel;
let lastCardId = null;
let lastOpen = false;

const HTML = `
<div class="modal-backdrop" id="setupPreviewBackdrop"></div>
<aside
  class="ap-dialog setup-preview-modal"
  id="setupPreviewModal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="setupPreviewTitle"
  aria-hidden="true"
>
  <div class="ap-dialog-header">
    <h3 class="ap-dialog-title" id="setupPreviewTitle">Preview</h3>
    <p class="ap-dialog-description" id="setupPreviewOrigin"></p>
  </div>
  <button class="ap-dialog-close" type="button" id="closeSetupPreview" aria-label="Close preview">
    <i class="ap-icon-close"></i>
  </button>
  <div class="ap-dialog-content setup-preview-modal__content" id="setupPreviewBody"></div>
  <div class="ap-dialog-footer">
    <div class="ap-dialog-footer-right">
      <button type="button" class="ap-button stroked grey" id="setupPreviewReRun">Re-run setup</button>
      <button type="button" class="ap-button primary orange" id="setupPreviewDone">Done</button>
    </div>
  </div>
</aside>`;

function close() {
  closeSetupPreviewModal();
}

function reRun() {
  if (!lastCardId) return;
  closeSetupPreviewModal();
  customizeCardForSession(lastCardId);
}

export function init() {
  document.body.insertAdjacentHTML("beforeend", HTML);
  backdrop = document.getElementById("setupPreviewBackdrop");
  modal = document.getElementById("setupPreviewModal");
  titleEl = document.getElementById("setupPreviewTitle");
  originLabel = document.getElementById("setupPreviewOrigin");
  bodyEl = document.getElementById("setupPreviewBody");
  reRunBtn = document.getElementById("setupPreviewReRun");

  document.getElementById("closeSetupPreview").addEventListener("click", close);
  document.getElementById("setupPreviewDone").addEventListener("click", close);
  reRunBtn.addEventListener("click", reRun);
  backdrop.addEventListener("click", close);
}

export function render() {
  const hero = ensureHeroState();
  const state = hero._context?.setupPreview || { cardId: null, open: false };
  const open = !!state.open && !!state.cardId;
  backdrop.classList.toggle("open", open);
  modal.classList.toggle("open", open);
  backdrop.style.display = open ? "block" : "none";
  modal.style.display = open ? "flex" : "none";
  modal.setAttribute("aria-hidden", open ? "false" : "true");

  if (!open) {
    lastCardId = null;
    lastOpen = false;
    return;
  }

  if (state.cardId !== lastCardId || !lastOpen) {
    lastCardId = state.cardId;
    lastOpen = true;
    const effective = getEffectiveSetup(state.cardId);
    titleEl.textContent = "Preview: " + (CARD_TITLES[state.cardId] || state.cardId);
    const originText = effective.source === "override" ? "Customized for this session." : "Using your saved default.";
    originLabel.textContent = originText;

    let html = "";
    if (state.cardId === "brief") {
      html = renderBriefRecapBody(effective.data, { _context: {} });
    } else if (state.cardId === "voice") {
      html = renderVoicePreviewBody(effective.data, { moreExpanded: false });
    } else if (state.cardId === "brand") {
      html = renderBrandRecapBody(effective.data);
    }
    bodyEl.innerHTML = html;
  }
}
