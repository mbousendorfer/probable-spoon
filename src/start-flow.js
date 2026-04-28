// Conversational onboarding flows that play inside the assistant sidebar.
//
// Two entry points dispatched from session.js when a `pendingStartFlow` flag
// is set via handoff.js by the dashboard's New chat handler:
//
//   startContextBuildFlow(sessionId, { onPersist })
//     Flow A — no context attached. Hands off to sidebar-wizard.js which
//     renders the numbered-option-row picker UX inside the assistant panel.
//     The wizard walks the user through Voice/Brief/Brand, then asks
//     "save globally vs just this session", then (if save) prompts for a
//     name. `onPersist({ savedAsContext, name })` is called by the session
//     (which owns setQuery + the contexts-store) to actually persist the
//     choice — start-flow only orchestrates the chat side of the flow.
//
//   startActionPickerFlow(sessionId, { contextName })
//     Flow B — context already attached. Skips the wizard and asks
//     "what do you want to do?" with one chip per quick action.

import { postAssistantMessage, postUserTurn, postAssistantChoice } from "./assistant.js?v=21";
import * as sidebarWizard from "./sidebar-wizard.js?v=29";

// ---- Flow A — Context-build sequence ------------------------------------

export function startContextBuildFlow(sessionId, { onPersist } = {}) {
  // Launch the full sidebar wizard — same numbered-option-row UX as the
  // standalone /analyse routes, but rendered inside the assistant panel.
  // On completion, the wizard fires onComplete with { savedAsContext, name? }
  // and we post the closing chat turns into the regular thread.
  sidebarWizard.startWizard(sessionId, {
    stages: ["voice", "brief", "brand"],
    onComplete: ({ savedAsContext, name }) => {
      if (savedAsContext) {
        postAssistantMessage(sessionId, `Saved as “${name}”. You can use it from any chat now.`);
      } else {
        postAssistantMessage(sessionId, "Got it — keeping this context attached to this chat only.");
      }
      postReadyToGo(sessionId);
      // Hand the persistence decision back to the session so it can update
      // the URL (`contextId` for global, `localContext` flag for local) and
      // push the new context into the store.
      if (onPersist) onPersist({ savedAsContext, name });
    },
  });
}

function postReadyToGo(sessionId) {
  postAssistantMessage(
    sessionId,
    "Ready when you are. Drop a source, ask me something, or pick one of the suggestions below.",
  );
}

// ---- Flow B — Action picker --------------------------------------------

export function startActionPickerFlow(sessionId, { contextName = "Your context" } = {}) {
  postAssistantMessage(sessionId, `Welcome back. ${contextName} is attached — what do you want to do?`);
  postAssistantChoice(sessionId, {
    text: "",
    choices: [
      { value: "add-source", label: "Add a source", icon: "ap-icon-plus" },
      { value: "browse", label: "Browse content", icon: "ap-icon-feature-library" },
      { value: "compare", label: "Compare ideas", icon: "ap-icon-sparkles" },
      { value: "draft", label: "Draft a post", icon: "ap-icon-sparkles-mermaid" },
    ],
    multi: false,
    handler: "start-action",
    context: {},
    submitLabel: "Go",
  });
}

// ---- Step router (called from session.js choice-submit dispatcher) ------

export function handleActionPick(sessionId, message, selectedValues, { setQuery }) {
  const value = selectedValues[0];
  const label =
    {
      "add-source": "Add a source",
      browse: "Browse content",
      compare: "Compare ideas",
      draft: "Draft a post",
    }[value] || value;
  postUserTurn(sessionId, label);

  switch (value) {
    case "add-source": {
      // Open the existing assistant attach menu — no tab change needed.
      const toggle = document.querySelector("[data-assistant-attach-toggle]");
      const menu = document.querySelector("[data-assistant-attach-menu]");
      if (toggle && menu) {
        toggle.setAttribute("aria-expanded", "true");
        menu.hidden = false;
      }
      postAssistantMessage(sessionId, "Pick a source type from the attach menu — PDF, video, or URL.");
      return;
    }
    case "browse": {
      setQuery({ tab: "content", view: "sources" });
      postAssistantMessage(sessionId, "Here's everything you've attached so far. Click any source to dig in.");
      return;
    }
    case "compare": {
      setQuery({ tab: "content", view: "ideas" });
      postAssistantMessage(sessionId, "Here are your ideas. Pick two and I'll compare which one is more actionable.");
      return;
    }
    case "draft": {
      setQuery({ tab: "content", view: "ideas" });
      postAssistantMessage(sessionId, "Pick an idea below and hit Draft Post — I'll generate the post for you.");
      return;
    }
  }
}
