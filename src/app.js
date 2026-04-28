import { route, start } from "./router.js?v=20";
import { initTopbar, renderTopbar } from "./components/topbar.js?v=23";
import { initUserModeChip } from "./components/user-mode-chip.js?v=20";
import { init as initBugReportModal } from "./components/bug-report-modal.js?v=21";
import { init as initFeedbackModal } from "./components/feedback-modal.js?v=24";
import { init as initGenerateImageModal } from "./components/generate-image-modal.js?v=20";
import { init as initSettingsDrawer } from "./components/settings-drawer.js?v=21";
import { init as initChatPickerModal } from "./components/chat-picker-modal.js?v=20";
import { init as initAddSourceModal } from "./components/add-source-modal.js?v=20";
import { init as initConfirmModal } from "./components/confirm-modal.js?v=20";
import { renderDashboard } from "./screens/dashboard.js?v=39";
import { renderSession } from "./screens/session.js?v=46";
// Route table.
// Every screen is responsible for calling renderTopbar() itself so the crumb
// stays in sync with the active context.
route("/", renderDashboard);
route("/session/:id", renderSession);

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
initConfirmModal();
start();
