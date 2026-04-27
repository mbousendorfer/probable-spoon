import { route, setAfterRender, start } from "./router.js?v=20";
import { initTopbar, renderTopbar } from "./components/topbar.js?v=23";
import { initUserModeChip } from "./components/user-mode-chip.js?v=20";
import { init as initBugReportModal } from "./components/bug-report-modal.js?v=21";
import { init as initFeedbackModal } from "./components/feedback-modal.js?v=24";
import { init as initGenerateImageModal } from "./components/generate-image-modal.js?v=20";
import { init as initSettingsDrawer } from "./components/settings-drawer.js?v=21";
import { init as initChatPickerModal } from "./components/chat-picker-modal.js?v=20";
import { init as initAddSourceModal } from "./components/add-source-modal.js?v=20";
import { renderDashboard } from "./screens/dashboard.js?v=39";
import { renderSession } from "./screens/session.js?v=44";
import { renderAnalyseHub } from "./screens/analyse-hub.js?v=20";
import { renderAnalyseVoice } from "./screens/analyse-voice.js?v=20";
import { renderAnalyseBrief } from "./screens/analyse-brief.js?v=20";
import { renderAnalyseBrand } from "./screens/analyse-brand.js?v=20";
import { renderAnalyseSummary } from "./screens/analyse-summary.js?v=20";
import { unbindWizardKeyboard } from "./screens/_analyse-common.js?v=24";

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
// Inject modal DOM once so the topbar buttons can just toggle open/close
// without worrying about init ordering.
initBugReportModal();
initFeedbackModal();
initGenerateImageModal();
initSettingsDrawer();
initChatPickerModal();
initAddSourceModal();
start();
