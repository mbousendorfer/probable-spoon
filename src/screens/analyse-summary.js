import { html, raw } from "../utils.js?v=20";
import { navigate } from "../router.js?v=20";
import { renderTopbar } from "../components/topbar.js?v=21";

// Context summary — last screen of the context wizard.
// Reads ?stages=voice,brief,brand&name=… to show which components were built.

function readQuery() {
  const raw = window.location.hash.split("?")[1] || "";
  return new URLSearchParams(raw);
}

export function renderAnalyseSummary(_params, target) {
  renderTopbar({ crumb: "Context ready" });
  const q = readQuery();
  const name = q.get("name") || "New context";
  const stages = (q.get("stages") || "").split(",").filter(Boolean);

  const components = {
    voice: "Voice",
    brief: "Strategy brief",
    brand: "Brand theme",
  };

  target.innerHTML = html`
    <section class="screen screen--centered analyse analyse--hub">
      <div class="analyse__hub-inner stack">
        <header class="stack-sm analyse__hub-header">
          <div class="analyse__summary-badge">
            <i class="ap-icon-rounded-check"></i>
          </div>
          <h1 class="text-title">${name} is ready</h1>
          <p class="muted">Attach it to a session so Archie's drafts stay on-message.</p>
        </header>

        <div class="ap-card analyse__summary-list-card">
          <h3 class="ap-card-title">Components built</h3>
          <ul class="analyse__summary-bullets">
            ${raw(
              stages
                .map(
                  (s) => `
                    <li>
                      <i class="ap-icon-rounded-check"></i>
                      <span>${components[s] || s}</span>
                    </li>
                  `,
                )
                .join(""),
            )}
          </ul>
        </div>

        <div class="row-between">
          <button type="button" class="ap-button transparent grey" data-analyse-home>
            <i class="ap-icon-arrow-left"></i>
            <span>Back to home</span>
          </button>
          <button type="button" class="ap-button primary orange" data-analyse-open-session>
            <span>Open a session with this context</span>
            <i class="ap-icon-arrow-right"></i>
          </button>
        </div>
      </div>
    </section>
  `;

  target.addEventListener("click", (event) => {
    if (event.target.closest("[data-analyse-home]")) {
      navigate("/");
      return;
    }
    if (event.target.closest("[data-analyse-open-session]")) {
      const qs = new URLSearchParams({
        tab: "context",
        title: `${name} session`,
        contextId: q.get("contextId") || "ctx-acme",
      });
      navigate(`/session/new?${qs.toString()}`);
    }
  });
}
