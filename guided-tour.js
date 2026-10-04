(() => {
  "use strict";

  const SEEN_KEY = "ppm-live-demo-seen-v1";
  const layer = document.querySelector("#tour-layer");
  const $ = (selector) => document.querySelector(selector);
  let stepIndex = 0;
  let activeTarget = null;
  let resizeHandler = null;

  const steps = [
    { title: "Move through the workplace", description: "Use the left navigation to move between organisation setup, proposal entry, reviewer evaluation, project overview, comparisons, scenarios, and decisions.", view: null, target: ".workspace-nav" },
    { title: "Set the investment context", description: "Start with shared objectives, available budget, and staff capacity. Candidate portfolios use these limits when checking constraints.", view: "organisation", target: "#organisation-form" },
    { title: "Enter project proposals", description: "Add the owner, objective, benefits, estimated cost, staff, timeline, and risks. New proposals join the reviewer queue.", view: "proposer", target: "#proposal-form" },
    { title: "Review evidence", description: "Reviewers record five separate 1–5 ratings and a short rationale for each one. PPM keeps the evidence visible without making the final decision.", view: "reviewer", target: "#review-queue" },
    { title: "Find and inspect projects", description: "Search, filter, and sort the portfolio. Select a project to inspect its proposal information and reviewer rationale.", view: "manager", target: ".portfolio-layout" },
    { title: "Compare project profiles", description: "Select two to four evaluated projects and compare their five criterion ratings side by side, including the radar profile.", view: "comparison", target: "#comparison-workspace" },
    { title: "Build a candidate portfolio", description: "Choose shortlisted projects for a scenario. The workspace totals their cost and staff requirements and flags any limits exceeded.", view: "scenarios", target: "#scenario-workspace" },
    { title: "Record the human decision", description: "After reviewing the evidence and constraints, the Portfolio Manager records the outcome and its rationale here.", view: "decisions", target: "#decision-workspace" },
    { title: "Your PPM account", description: window.PPMAuth?.apiBase() ? "Sign in with the same account on another device. Proposal and portfolio information is still kept in this browser." : "Create or sign in to a prototype account from the profile circle. Until the shared account service is connected, credentials stay in this browser.", view: null, target: ".workplace-topbar .auth-slot" }
  ];

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
    if (stepIndex >= steps.length) { finish(); return; }
    const step = steps[stepIndex];
    removeFocus();
    if (step.view) document.querySelector(`[data-workspace-view-button="${step.view}"]`)?.click();
    layer.hidden = false;
    layer.innerHTML = `<div class="tour-popover" role="dialog" aria-modal="true" aria-labelledby="tour-title"><p class="tour-progress">Live demo · ${String(stepIndex + 1).padStart(2, "0")} / ${steps.length}</p><h2 id="tour-title">${step.title}</h2><p>${step.description}</p><footer><button class="tour-skip" type="button" data-tour-skip>Skip</button><div><button type="button" data-tour-back ${stepIndex === 0 ? "disabled" : ""}>Back</button><button type="button" data-tour-next>${stepIndex === steps.length - 1 ? "Finish" : "Next"}</button></div></footer></div>`;
    layer.querySelector("[data-tour-next]").addEventListener("click", () => { stepIndex += 1; showStep(); });
    layer.querySelector("[data-tour-back]").addEventListener("click", () => { if (stepIndex > 0) { stepIndex -= 1; showStep(); } });
    layer.querySelector("[data-tour-skip]").addEventListener("click", finish);
    requestAnimationFrame(() => requestAnimationFrame(placeStep));
  }

  function finish() {
    removeFocus();
    layer.hidden = true;
    layer.replaceChildren();
    localStorage.setItem(SEEN_KEY, "1");
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }

  function start() {
    stepIndex = 0;
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    resizeHandler = () => placeStep();
    window.addEventListener("resize", resizeHandler);
    showStep();
  }

  function init() {
    document.querySelectorAll("[data-start-live-demo]").forEach((button) => button.addEventListener("click", start));
    if (localStorage.getItem(SEEN_KEY) !== "1") window.setTimeout(start, 650);
  }

  window.PPMTour = { init, start };
})();
