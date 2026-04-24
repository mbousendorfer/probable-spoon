import { route, setAfterRender, start } from "./router.js?v=17";
import { initTopbar, renderTopbar } from "./components/topbar.js?v=17";
import { initUserModeChip } from "./components/user-mode-chip.js?v=17";
import { renderDashboard } from "./screens/dashboard.js?v=17";
import { renderSession } from "./screens/session.js?v=17";
import { renderAnalyseHub } from "./screens/analyse-hub.js?v=17";
import { renderAnalyseVoice } from "./screens/analyse-voice.js?v=17";
import { renderAnalyseBrief } from "./screens/analyse-brief.js?v=17";
import { renderAnalyseBrand } from "./screens/analyse-brand.js?v=17";
import { renderAnalyseSummary } from "./screens/analyse-summary.js?v=17";
import { unbindWizardKeyboard } from "./screens/_analyse-common.js?v=17";

// Route table.
// Every screen is responsible for calling renderTopbar() itself so the crumb
// stays in sync with the active context.
route("/", renderDashboard);
route("/session/:id", renderSession);
route("/analyse", renderAnalyseHub);
route("/analyse/voice", renderAnalyseVoice);
route("/analyse/brief", renderAnalyseBrief);
route("/analyse/brand", renderAnalyseBrand);
route("/analyse/summary", renderAnalyseSummary);

// Drop the wizard's global keyboard listener whenever we navigate away from
// a wizard route. (Wizard→wizard transitions are handled inside
// bindWizardKeyboard itself, which unbinds the prior listener on each render.)
setAfterRender((path) => {
  if (!/^\/analyse\/(voice|brief|brand)($|\?)/.test(path)) {
    unbindWizardKeyboard();
  }
});

// Boot.
initTopbar();
renderTopbar();
initUserModeChip();
start();
