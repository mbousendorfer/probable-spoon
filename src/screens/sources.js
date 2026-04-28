import { html } from "../utils.js?v=20";
import { renderTopbar } from "../components/topbar.js?v=23";

// Sources view — placeholder. Promoted to a top-level route in Lot 2.3 so the
// sidebar nav has a target. The actual page (header + filter rail + drop zone +
// SourceCard grid + async ticker enrichment) ships in Lot 6.

export function renderSources(_params, target) {
  renderTopbar();
  target.innerHTML = html`
    <section class="screen screen--placeholder">
      <div class="screen__placeholder">
        <div class="screen__placeholder-eyebrow">Library</div>
        <h1 class="screen__placeholder-title">Sources</h1>
        <p class="screen__placeholder-sub">
          The standalone Sources view — drop zone, filter rail by kind, async analysis ticker — lands in Lot 6.
        </p>
      </div>
    </section>
  `;
}
