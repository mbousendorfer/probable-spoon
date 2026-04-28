import { html } from "../utils.js?v=20";
import { renderTopbar } from "../components/topbar.js?v=24";

// Contexts view — placeholder. The full page (ContextCard grid + multi-context
// drawer with rail + AI-assisted wizard) ships in Lot 8.

export function renderContexts(_params, target) {
  renderTopbar();
  target.innerHTML = html`
    <section class="screen screen--placeholder">
      <div class="screen__placeholder">
        <div class="screen__placeholder-eyebrow">Library</div>
        <h1 class="screen__placeholder-title">Contexts</h1>
        <p class="screen__placeholder-sub">
          The standalone Contexts view — color-coded ContextCards, multi-context drawer, AI-assisted wizard — lands in
          Lot 8.
        </p>
      </div>
    </section>
  `;
}
