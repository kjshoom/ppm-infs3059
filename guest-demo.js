(() => {
  "use strict";
  if (window.PPMGuestDemo !== true || window.PPMTestMode === true) return;

  // Visitors can inspect and compare samples. Text entry fields stay focusable so
  // a click can explain how to sign in, but remain read-only in the demo.
  const mutationControls = [
    "#workspace form input", "#workspace form textarea", "#workspace form select", "#workspace form button:not([data-context-help-toggle])",
    "#review-dialog input", "#review-dialog textarea", "#review-dialog select",
    "#save-note", "#add-evaluation-comment", "#release-review-claim",
    "#add-objective", "#reset-test-data",
    "[data-remove-objective]", "[data-add-formal-shortlist]", "[data-remove-formal-shortlist]",
    "[data-add-to-scenario]", "[data-remove-from-scenario]", "[data-create-scenario]",
    "[data-rename-active-scenario]", "[data-delete-active-scenario]", "[data-save-active-scenario]",
    "[data-delete-proposal]", "[data-ppm-remove-proposal]", "[data-decision]",
    "[data-add-decision-action]", "[data-remove-decision-action]",
    "[data-decision-action]", "[data-decision-action-date]"
  ].join(",");
  const textEntryControls = [
    '#workspace form input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="hidden"]):not([type="image"]):not([type="color"]):not([type="range"])',
    "#workspace form textarea",
    '#review-dialog input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"]):not([type="hidden"]):not([type="image"])',
    "#review-dialog textarea"
  ].join(",");
  const loginNotice = document.createElement("aside");
  loginNotice.className = "demo-login-notice";
  loginNotice.hidden = true;
  loginNotice.setAttribute("role", "status");
  loginNotice.setAttribute("aria-live", "polite");
  const alreadySignedIn = Boolean(window.PPMAuth?.currentUser?.());
  const accountHref = alreadySignedIn ? "./workplace.html" : "./login.html?mode=login&amp;return=workplace.html";
  const accountAction = alreadySignedIn ? "Open workplace" : "Sign in";
  const accountMessage = alreadySignedIn
    ? "This sample is read-only. Open your signed-in workplace to add and save information."
    : "Sign in to add and save information in your own workspace.";
  loginNotice.innerHTML = `<div><strong>Want to enter your own information?</strong><p>${accountMessage}</p></div><a href="${accountHref}">${accountAction}</a><button type="button" aria-label="Dismiss sign-in message">×</button>`;
  document.body.append(loginNotice);
  loginNotice.querySelector("button").addEventListener("click", () => { loginNotice.hidden = true; });

  const showLoginNotice = () => { loginNotice.hidden = false; };
  const lockControls = () => {
    document.querySelectorAll(textEntryControls).forEach((control) => {
      control.disabled = false;
      control.readOnly = true;
      control.setAttribute("aria-readonly", "true");
      control.title = "Read-only demo. Sign in to enter and save your own information.";
    });
    document.querySelectorAll(mutationControls).forEach((control) => {
      if (control.matches(textEntryControls)) return;
      if (!control.disabled) control.disabled = true;
      if (control.title !== "Read-only demo. Sign in to enter and save your own information.") {
        control.title = "Read-only demo. Sign in to enter and save your own information.";
      }
    });
  };
  document.addEventListener("submit", (event) => {
    if (!event.target.closest("#workspace, #review-dialog")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  // Trigger on pointer down as well as focus/click. Native date and number
  // inputs can handle their own click behavior differently across browsers.
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest(textEntryControls)) showLoginNotice();
  }, true);
  ["click", "change"].forEach((eventName) => document.addEventListener(eventName, (event) => {
    if (!(event.target instanceof Element) || !event.target.closest(mutationControls)) return;
    if (eventName === "click" && event.target.closest(textEntryControls)) showLoginNotice();
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true));
  document.addEventListener("focusin", (event) => {
    if (event.target instanceof Element && event.target.matches(textEntryControls)) showLoginNotice();
  }, true);
  document.addEventListener("beforeinput", (event) => {
    if (!(event.target instanceof Element) || !event.target.matches(textEntryControls)) return;
    event.preventDefault();
    showLoginNotice();
  }, true);
  lockControls();
  const observer = new MutationObserver(lockControls);
  ["#workspace", "#review-dialog"].forEach((selector) => {
    const section = document.querySelector(selector);
    if (section) observer.observe(section, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled"]
    });
  });
})();
