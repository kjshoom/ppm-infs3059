(() => {
  "use strict";

  const layer = document.querySelector("#tour-layer");
  const $ = (selector) => document.querySelector(selector);
  let stepIndex = 0;
  let activeTarget = null;
  let resizeHandler = null;
  let steps = [];

  const signInStep = {
    title: "Sign in and choose your role",
    description: "Start here: sign in or create an account, then choose Project Proposer, Reviewer, or Portfolio Manager. The workplace navigation will show the screens for that role. If you are already signed in, check your role from the profile menu.",
    view: null,
    target: ".workplace-topbar .auth-slot"
  };
  const navigationStep = {
    title: "Your role-specific workplace",
    description: "The left menu is filtered to the screens for your saved role. Proposers see proposal entry, Reviewers see evaluation, and Portfolio Managers see Investment Context plus screens 04–09.",
    view: null,
    target: ".workspace-nav"
  };
  const roleSteps = {
    "Project Proposer": [
      { title: "Enter a project proposal", description: "Add the project owner, objective, benefits, estimated cost, staff, timeline, and risks. A submitted proposal waits for reviewer assessment.", view: "proposer", target: "#proposal-form" }
    ],
    Reviewer: [
      { title: "Evaluate a proposal", description: "Reviewers record five separate 1–5 ratings and a short rationale for each one. The evidence is recorded without calculating a single total score.", view: "reviewer", target: "#review-queue" }
    ],
    "Portfolio Manager": [
      { title: "Set the investment context · 01", description: "Set the planning cycle, strategic objectives, budget, and available capacity used for portfolio checks.", view: "organisation", target: "#organisation-form" },
      { title: "Review the project overview · 04", description: "Search and filter evaluated proposals. Select an individual project to inspect its ratings and reviewer rationale.", view: "manager", target: ".portfolio-layout" },
      { title: "View one project’s radar profile · 05", description: "A single evaluated proposal is enough to show its five-criterion radar profile. This does not create a total score or recommendation.", view: "comparison", target: "#comparison-workspace", prepare: () => prepareSelection(1) },
      { title: "Compare project profiles · 05", description: "Select two to four evaluated proposals to see their criterion profiles overlaid and compare the recorded ratings side by side.", view: "comparison", target: "#comparison-workspace", prepare: () => prepareSelection(2) },
      { title: "Retain projects for consideration · 06", description: "Add suitable projects to the formal Shortlist after reviewing their evidence. Shortlisting is not a final decision.", view: "shortlist", target: "#shortlist-workspace" },
      { title: "Build a candidate portfolio · 07", description: "Choose shortlisted projects for a scenario. The workspace totals cost and staff requirements and flags limits that are exceeded.", view: "scenarios", target: "#scenario-workspace" },
      { title: "Review portfolio constraints · 08", description: "Inspect the selected scenario’s project mix, budget, staff capacity, and objective coverage before proceeding.", view: "reports", target: "#report-workspace" },
      { title: "Record the human decision · 09", description: "After reviewing evidence and constraints, record the decision and its rationale. The system does not decide automatically.", view: "decisions", target: "#decision-workspace" }
    ]
  };
  const allRoleSteps = [
    { title: "Set the investment context", description: "Start with shared objectives, available budget, and staff capacity. Candidate portfolios use these limits when checking constraints.", view: "organisation", target: "#organisation-form" },
    roleSteps["Project Proposer"][0],
    roleSteps.Reviewer[0],
    { title: "Find and inspect projects", description: "Search, filter, and sort the portfolio. Select a project to inspect its proposal information and reviewer rationale.", view: "manager", target: ".portfolio-layout" },
    roleSteps["Portfolio Manager"][2],
    roleSteps["Portfolio Manager"][3],
    roleSteps["Portfolio Manager"][4],
    roleSteps["Portfolio Manager"][5],
    roleSteps["Portfolio Manager"][6],
    roleSteps["Portfolio Manager"][7]
  ];

  function prepareSelection(count) {
    document.querySelector('[data-workspace-view-button="manager"]')?.click();
    const checkboxes = Array.from(document.querySelectorAll('[data-comparison-id]:not(:disabled)'));
    if (checkboxes.length < count) return;
    checkboxes.filter((checkbox) => checkbox.checked).forEach((checkbox) => {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    });
    checkboxes.slice(0, count).forEach((checkbox) => {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function stepsForCurrentRole() {
    const role = $(".workspace-nav")?.dataset.activeRole || "";
    return [signInStep, navigationStep, ...(roleSteps[role] || allRoleSteps)];
  }

  function removeFocus() {
    activeTarget?.classList.remove("tour-focus");
    activeTarget = null;
  }

  function shade(top, left, width, height) {
    const element = document.createElement("div");
    element.className = "tour-shade";
    Object.assign(element.style, { top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` });
    layer.append(element);
  }

  function placeStep() {
    const step = steps[stepIndex];
    const target = $(step.target);
    if (!target || target.closest("[hidden]")) {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      showStep();
      return;
    }
    removeFocus();
    target.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
    requestAnimationFrame(() => {
      if (layer.hidden) return;
      activeTarget = target;
      target.classList.add("tour-focus");
      const bounds = target.getBoundingClientRect();
      const gap = 9;
      const left = Math.max(8, bounds.left - gap);
      const top = Math.max(8, bounds.top - gap);
      const right = Math.min(innerWidth - 8, bounds.right + gap);
      const bottom = Math.min(innerHeight - 8, bounds.bottom + gap);
      layer.querySelectorAll(".tour-shade, .tour-focus-ring").forEach((item) => item.remove());
      shade(0, 0, innerWidth, top);
      shade(bottom, 0, innerWidth, innerHeight - bottom);
      shade(top, 0, left, bottom - top);
      shade(top, right, innerWidth - right, bottom - top);
      const ring = document.createElement("div");
      ring.className = "tour-focus-ring";
      Object.assign(ring.style, { top: `${top}px`, left: `${left}px`, width: `${right - left}px`, height: `${bottom - top}px` });
      layer.append(ring);
      const popover = layer.querySelector(".tour-popover");
      if (!popover) return;
      const popoverHeight = popover.offsetHeight;
      let popoverTop = bottom + 16;
      if (popoverTop + popoverHeight > innerHeight - 12) popoverTop = Math.max(12, top - popoverHeight - 16);
      const popoverLeft = Math.min(Math.max(12, bounds.left), innerWidth - Math.min(390, innerWidth - 30) - 12);
      popover.style.top = `${popoverTop}px`;
      popover.style.left = `${popoverLeft}px`;
    });
  }

  function showStep() {
    if (stepIndex >= steps.length) { finish(true); return; }
    const step = steps[stepIndex];
    removeFocus();
    step.prepare?.();
    if (step.view) document.querySelector(`[data-workspace-view-button="${step.view}"]`)?.click();
    layer.hidden = false;
    layer.innerHTML = `<div class="tour-popover" role="dialog" aria-modal="true" aria-labelledby="tour-title"><p class="tour-progress">Live demo · ${String(stepIndex + 1).padStart(2, "0")} / ${steps.length}</p><h2 id="tour-title">${step.title}</h2><p>${step.description}</p><footer><button class="tour-skip" type="button" data-tour-skip>Skip</button><div><button type="button" data-tour-back ${stepIndex === 0 ? "disabled" : ""}>Back</button><button type="button" data-tour-next>${stepIndex === steps.length - 1 ? "Finish" : "Next"}</button></div></footer></div>`;
    layer.querySelector("[data-tour-next]").addEventListener("click", () => {
      if (stepIndex === steps.length - 1) { finish(true); return; }
      stepIndex += 1;
      showStep();
    });
    layer.querySelector("[data-tour-back]").addEventListener("click", () => { if (stepIndex > 0) { stepIndex -= 1; showStep(); } });
    layer.querySelector("[data-tour-skip]").addEventListener("click", finish);
    requestAnimationFrame(() => requestAnimationFrame(placeStep));
  }

  function finish(returnToDefault = false) {
    removeFocus();
    layer.hidden = true;
    layer.replaceChildren();
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
    if (returnToDefault) window.PPMWorkspace?.returnToDefault();
  }

  function start() {
    stepIndex = 0;
    steps = stepsForCurrentRole();
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    resizeHandler = () => placeStep();
    window.addEventListener("resize", resizeHandler);
    showStep();
  }

  function init() {
    document.querySelectorAll("[data-start-live-demo]").forEach((button) => button.addEventListener("click", start));
  }

  window.PPMTour = { init, start };
})();
