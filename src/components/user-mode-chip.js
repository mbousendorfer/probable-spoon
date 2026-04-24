import { getUserMode, setUserMode } from "../user-mode.js?v=17";

// Floating admin chip in the bottom-right. Toggles between first-time and
// returning-user mocks. Reloads the page on click.

export function initUserModeChip() {
  if (document.getElementById("archieAdminChip")) return;

  const mode = getUserMode();
  const el = document.createElement("button");
  el.id = "archieAdminChip";
  el.type = "button";
  el.className = "admin-chip" + (mode === "new" ? " admin-chip--new" : "");
  el.setAttribute(
    "aria-label",
    mode === "new"
      ? "Admin: currently showing first-time user. Click to switch to returning user."
      : "Admin: currently showing returning user. Click to switch to first-time user.",
  );
  el.innerHTML = `
    <span class="admin-chip__label">Admin</span>
    <span class="admin-chip__divider">·</span>
    <span class="admin-chip__mode">${mode === "new" ? "First-time user" : "Returning user"}</span>
    <i class="ap-icon-refresh admin-chip__icon"></i>
  `;
  el.addEventListener("click", () => {
    setUserMode(mode === "new" ? "returning" : "new");
  });
  document.body.appendChild(el);
}
