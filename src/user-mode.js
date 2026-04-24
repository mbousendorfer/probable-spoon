// Tiny admin helper: lets the prototype preview two entry-point states.
//   "new"       → first-time user (no recent sessions, empty tabs)
//   "returning" → populated mocks everywhere
//
// The mode is stored in localStorage and read synchronously at render time.
// Toggling reloads the page so nothing has to subscribe to changes.

const KEY = "archie-user-mode";

export function getUserMode() {
  try {
    return window.localStorage.getItem(KEY) === "new" ? "new" : "returning";
  } catch {
    return "returning";
  }
}

export function setUserMode(mode) {
  try {
    if (mode === "new") {
      window.localStorage.setItem(KEY, "new");
    } else {
      window.localStorage.removeItem(KEY);
    }
  } catch {
    // ignore
  }
  window.location.reload();
}

export function isNewUser() {
  return getUserMode() === "new";
}
