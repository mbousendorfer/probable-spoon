import { html, raw } from "../utils.js?v=20";
import { navigate } from "../router.js?v=20";
import { renderTopbar } from "../components/topbar.js?v=23";
import { getContextById } from "../mocks.js?v=22";
import { parseHashParams } from "../url-state.js?v=20";

// Context intake — step 1 of the context wizard, chromeless.
// The user names the context and picks which components to include (Voice,
// Brief, Brand). "Continue" advances to the first selected stage carrying
// the full stages list as a URL query so each stage wizard knows where to
// go next on completion.

const COMPONENTS = [
  {
    key: "voice",
    icon: "ap-icon-headset",
    title: "Voice",
    description: "Analyze your past writing so Archie matches your voice.",
  },
  {
    key: "brief",
    icon: "ap-icon-file--text",
    title: "Strategy brief",
    description: "Capture goals, audience, and brand voice for the session.",
  },
  {
    key: "brand",
    icon: "ap-icon-star",
    title: "Brand theme",
    description: "Pull colors, imagery, and personality from your website.",
  },
];

export function renderAnalyseHub(_params, target) {
  const params = parseHashParams();
  const editingId = params.get("contextId");
  const editingContext = editingId ? getContextById(editingId) : null;
  const crumb = editingId ? "Edit context" : "Create context";
  renderTopbar({ crumb });

  // Default selection: all three components checked.
  target.innerHTML = html`
    <section class="screen screen--centered analyse analyse--hub">
      <div class="analyse__hub-inner stack">
        <header class="stack-sm analyse__hub-header">
          <h1 class="text-title">${crumb}</h1>
          <p class="muted">
            A context bundles Voice, Strategy brief, and Brand theme. Pick which ones to include — you can always add
            the others later.
          </p>
        </header>

        <div class="ap-form-field">
          <label>Context name</label>
          <div class="ap-input-group">
            <input
              type="text"
              placeholder="e.g. Acme · Q2 marketing"
              data-context-name
              value="${editingContext?.name || ""}"
            />
          </div>
        </div>

        <div class="stack-sm">
          ${raw(
            COMPONENTS.map(
              (c) => `
                <label class="ap-card analyse__hub-card analyse__hub-card--check">
                  <span class="ap-checkbox-container">
                    <input type="checkbox" data-component="${c.key}" ${isComponentChecked(editingContext, c.key)} />
                    <i></i>
                  </span>
                  <div class="analyse__hub-card-icon">
                    <i class="${c.icon} md"></i>
                  </div>
                  <div class="grow stack-sm analyse__hub-card-text">
                    <h2 class="text-subtitle">${c.title}</h2>
                    <p class="muted">${c.description}</p>
                  </div>
                </label>
              `,
            ).join(""),
          )}
        </div>

        <div class="row-between">
          <button type="button" class="ap-button transparent grey" data-analyse-back>
            <i class="ap-icon-arrow-left"></i>
            <span>Back</span>
          </button>
          <button type="button" class="ap-button primary orange" data-analyse-continue>
            <span>Continue</span>
            <i class="ap-icon-arrow-right"></i>
          </button>
        </div>
      </div>
    </section>
  `;

  target.addEventListener("click", (event) => {
    if (event.target.closest("[data-analyse-back]")) {
      navigate("/");
      return;
    }
    if (event.target.closest("[data-analyse-continue]")) {
      const stages = COMPONENTS.filter((c) => target.querySelector(`[data-component="${c.key}"]`).checked).map(
        (c) => c.key,
      );
      if (!stages.length) {
        window.alert("Pick at least one component.");
        return;
      }
      const name = target.querySelector("[data-context-name]")?.value.trim() || "New context";
      const qs = new URLSearchParams({
        stages: stages.join(","),
        name,
      });
      if (editingId) qs.set("contextId", editingId);
      // Navigate into the first selected stage.
      navigate(`/analyse/${stages[0]}?${qs.toString()}`);
    }
  });
}

function isComponentChecked(context, key) {
  if (!context) return "checked";
  return context[key] ? "checked" : "";
}
