// Social profile picker — small modal shown before drafting a post, so the
// user can choose which social account Archie should draft for. Same
// init/open/close pattern as the other modals.
//
// Usage:
//   openSocialPickerModal({ onPick: (account) => doSomething(account) });
// Lists connected social accounts only — disconnected ones are managed in
// Settings → Social accounts.

import { escapeHtml } from "../utils.js?v=20";
import { socialAccounts } from "../mocks.js?v=22";
import { open as openSettingsDrawer } from "./settings-drawer.js?v=21";

let backdrop, modal, listEl;
let initialized = false;
let pendingPick = null; // (account) => void

const HTML = `
<div class="app-modal-backdrop social-picker-modal__backdrop" id="socialPickerBackdrop" hidden></div>
<aside
  class="ap-dialog social-picker-modal"
  id="socialPickerModal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="socialPickerTitle"
  aria-hidden="true"
>
  <div class="ap-dialog-header">
    <h2 class="ap-dialog-title" id="socialPickerTitle">Which profile?</h2>
    <p class="ap-dialog-subtitle">Pick the social profile Archie should draft for.</p>
  </div>
  <button class="ap-dialog-close" type="button" id="socialPickerClose" aria-label="Close">
    <i class="ap-icon-close"></i>
  </button>
  <div class="ap-dialog-content">
    <ul class="social-picker-modal__list" id="socialPickerList"></ul>
  </div>
  <div class="ap-dialog-footer">
    <div class="ap-dialog-footer-right">
      <button type="button" class="ap-button transparent grey" id="socialPickerCancel">Cancel</button>
    </div>
  </div>
</aside>
`;

function renderList() {
  const connected = socialAccounts.filter((a) => a.status === "connected");
  if (connected.length === 0) {
    listEl.innerHTML = `
      <li class="social-picker-modal__empty">
        <p>No connected social profiles yet.</p>
        <button type="button" class="ap-button stroked grey" data-open-social-settings>
          <i class="ap-icon-cog"></i>
          <span>Manage social accounts</span>
        </button>
      </li>
    `;
    return;
  }
  listEl.innerHTML = connected
    .map(
      (a) => `
        <li>
          <button type="button" class="ap-card social-picker-modal__option" data-pick-social="${escapeHtml(a.id)}">
            <img class="social-picker-modal__logo" src="${escapeHtml(a.logo)}" alt="" width="32" height="32" />
            <span class="social-picker-modal__body">
              <span class="social-picker-modal__title-line">
                <span class="social-picker-modal__title">${escapeHtml(a.platformLabel)}</span>
                ${a.kind ? `<span class="ap-tag grey">${escapeHtml(a.kind)}</span>` : ""}
              </span>
              <span class="social-picker-modal__sub">${escapeHtml(a.handle || "")}</span>
            </span>
            <i class="ap-icon-arrow-right social-picker-modal__arrow" aria-hidden="true"></i>
          </button>
        </li>
      `,
    )
    .join("");
}

function onKeydown(event) {
  if (event.key === "Escape" && modal.classList.contains("open")) close();
}

export function open(opts = {}) {
  if (!initialized) init();
  pendingPick = typeof opts.onPick === "function" ? opts.onPick : null;
  renderList();
  backdrop.hidden = false;
  backdrop.classList.add("open");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-modal");
}

export function close() {
  if (!initialized) return;
  modal.classList.remove("open");
  backdrop.classList.remove("open");
  backdrop.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-modal");
  pendingPick = null;
}

export function init() {
  if (initialized) return;
  initialized = true;
  document.body.insertAdjacentHTML("beforeend", HTML);

  backdrop = document.getElementById("socialPickerBackdrop");
  modal = document.getElementById("socialPickerModal");
  listEl = document.getElementById("socialPickerList");

  modal.addEventListener("click", (event) => {
    const pick = event.target.closest("[data-pick-social]");
    if (pick) {
      const id = pick.dataset.pickSocial;
      const account = socialAccounts.find((a) => a.id === id);
      const cb = pendingPick;
      close();
      if (cb && account) cb(account);
      return;
    }
    if (event.target.closest("[data-open-social-settings]")) {
      close();
      openSettingsDrawer({ section: "social" });
      return;
    }
    if (event.target.closest("#socialPickerClose") || event.target.closest("#socialPickerCancel")) {
      close();
    }
  });

  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", onKeydown);
}
