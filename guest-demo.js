(() => {
  "use strict";
  // Visitors can inspect and compare the samples, but cannot change portfolio data.
  const mutationControls = [
    "#workspace form input", "#workspace form textarea", "#workspace form select", "#workspace form button",
    "#review-dialog input", "#review-dialog textarea", "#save-note", "#add-objective", "#open-test-mode",
    "[data-remove-objective]", "[data-add-formal-shortlist]", "[data-remove-formal-shortlist]",
    "[data-add-to-scenario]", "[data-remove-from-scenario]", "[data-create-scenario]",
    "[data-rename-active-scenario]", "[data-delete-active-scenario]", "[data-save-active-scenario]",
    "[data-delete-proposal]", "[data-ppm-remove-proposal]", "[data-decision]",
    "[data-add-decision-action]", "[data-remove-decision-action]"
  ].join(",");
  const lockControls = () => document.querySelectorAll(mutationControls).forEach((control) => {
    if (control.disabled) return;
    control.disabled = true;
    control.title = "Sign in and choose a role to make changes.";
  });
  document.addEventListener("submit", (event) => {
    if (!event.target.closest("#workspace, #review-dialog")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  document.addEventListener("click", (event) => {
    if (!event.target.closest(mutationControls)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  lockControls();
  new MutationObserver(lockControls).observe(document.querySelector("#workspace"), { childList: true, subtree: true });
  new MutationObserver(lockControls).observe(document.querySelector("#review-dialog"), { childList: true, subtree: true });
})();
