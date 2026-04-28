import { html } from "../utils.js?v=20";
import { renderTopbar } from "../components/topbar.js?v=26";

// Ideas library view — placeholder. The full page (kind filter rail, search,
// sort, masonry IdeaCard grid) ships in Lot 7.

export function renderIdeas(_params, target) {
  renderTopbar();
  target.innerHTML = html`
    <section class="screen screen--placeholder">
      <div class="screen__placeholder">
        <div class="screen__placeholder-eyebrow">Library</div>
        <h1 class="screen__placeholder-title">Ideas</h1>
        <p class="screen__placeholder-sub">
          The standalone Ideas library — kind filters (stat / quote / hook / story / insight), search, sort — lands in
          Lot 7.
        </p>
      </div>
    </section>
  `;
}
