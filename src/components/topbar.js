import { html } from "../utils.js?v=17";
import { navigate } from "../router.js?v=17";

// Persistent top bar. The wireframe shows it on every screen (dashboard, session,
// wizards), so it lives in index.html and is re-rendered on each route change.
//
// Accepts an options object for forward-compat (e.g. callers still pass a
// `crumb` field). Anything passed in is ignored — the topbar only renders the
// brand + action cluster.

export function renderTopbar(_options = {}) {
  const el = document.getElementById("topbar");
  if (!el) return;
  el.innerHTML = html`
    <div class="app-topbar__left">
      <button type="button" class="app-brand" data-topbar-home aria-label="Go to Archie home">
        Archie
        <span class="ap-badge blue">BETA</span>
      </button>
      <button type="button" class="app-topbar__feedback" data-topbar-feedback>
        <i class="ap-icon-single-chat-bubble"></i>
        Give feedback
      </button>
    </div>
    <div class="app-topbar__right">
      <button type="button" class="ap-button stroked grey" data-topbar-bug>
        <i class="ap-icon-bug"></i>
        <span>Report a bug</span>
      </button>
      <button type="button" class="ap-icon-button stroked" aria-label="Settings">
        <i class="ap-icon-cog"></i>
      </button>
    </div>
  `;
}

// Bind once at startup — the topbar DOM node is persistent.
export function initTopbar() {
  const el = document.getElementById("topbar");
  if (!el) return;
  el.addEventListener("click", (event) => {
    if (event.target.closest("[data-topbar-home]")) {
      navigate("/");
      return;
    }
    if (event.target.closest("[data-topbar-feedback]")) {
      window.alert("Feedback — not implemented in the prototype.");
      return;
    }
    if (event.target.closest("[data-topbar-bug]")) {
      window.alert("Bug report — not implemented in the prototype.");
    }
  });
}
