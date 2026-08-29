const proposals = [
  {
    id: "service-desk",
    title: "Internal Service Desk Upgrade",
    owner: "Digital Services",
    category: "Service management",
    duration: "16 weeks",
    updated: 6,
    signal: "missing",
    signalLabel: "Missing info",
    route: "Information request",
    routeNote: "Illustrative pathway",
    summary: "Replace the current service desk workflow with a simpler request and incident experience for staff.",
    provided: ["Problem statement", "Expected timeline", "Project owner", "Affected user group"],
    missing: ["Risk analysis", "Key dependencies"],
    uncertainty: "Medium — supplier and migration assumptions need clarification"
  },
  {
    id: "network-refresh",
    title: "Campus Network Refresh",
    owner: "Infrastructure Team",
    category: "Infrastructure",
    duration: "24 weeks",
    updated: 5,
    signal: "ready",
    signalLabel: "Ready",
    route: "Standard review",
    routeNote: "Illustrative pathway",
    summary: "Refresh ageing network equipment across two teaching buildings with a staged migration plan.",
    provided: ["Problem statement", "Timeline", "Risk analysis", "Dependencies", "Success measures"],
    missing: [],
    uncertainty: "Low — core information is present for an initial human review"
  },
  {
    id: "portal-accessibility",
    title: "Student Portal Accessibility Improvements",
    owner: "Student Experience",
    category: "Web platform",
    duration: "12 weeks",
    updated: 4,
    signal: "manual",
    signalLabel: "Manual review",
    route: "Manual review",
    routeNote: "Illustrative pathway",
    summary: "Improve keyboard navigation, contrast, screen-reader support, and form feedback in the student portal.",
    provided: ["Problem statement", "User need", "Timeline", "Risk analysis", "Success measures"],
    missing: [],
    uncertainty: "High — the affected scope depends on an accessibility audit still in progress"
  },
  {
    id: "iam-pilot",
    title: "Identity & Access Management Pilot",
    owner: "Cyber Security",
    category: "Security",
    duration: "10 weeks",
    updated: 3,
    signal: "missing",
    signalLabel: "Missing info",
    route: "Information request",
    routeNote: "Illustrative pathway",
    summary: "Pilot a role-based access model for a limited set of internal systems before wider rollout.",
    provided: ["Problem statement", "Pilot boundary", "Project owner", "Timeline"],
    missing: ["Data governance impact", "Integration dependencies", "Risk treatment"],
    uncertainty: "High — interfaces and identity data ownership are not yet clear"
  },
  {
    id: "backup-consolidation",
    title: "Cloud Backup Consolidation",
    owner: "Platform Operations",
    category: "Cloud operations",
    duration: "18 weeks",
    updated: 2,
    signal: "ready",
    signalLabel: "Ready",
    route: "Standard review",
    routeNote: "Illustrative pathway",
    summary: "Consolidate three backup tools into a common operating model and documented recovery process.",
    provided: ["Problem statement", "Timeline", "Dependencies", "Risk analysis", "Success measures"],
    missing: [],
    uncertainty: "Low — recovery objectives and migration stages are documented"
  },
  {
    id: "asset-dashboard",
    title: "IT Asset Lifecycle Dashboard",
    owner: "Technology Portfolio",
    category: "Data & reporting",
    duration: "14 weeks",
    updated: 1,
    signal: "missing",
    signalLabel: "Missing info",
    route: "Information request",
    routeNote: "Illustrative pathway",
    summary: "Create a consolidated view of device age, ownership, support status, and replacement timing.",
    provided: ["Problem statement", "Project owner", "Data sources", "Timeline"],
    missing: ["Success measures", "Data quality risks"],
    uncertainty: "Medium — source data quality has not been profiled"
  }
];

const state = {
  filter: "all",
  query: "",
  sort: "updated",
  selectedId: proposals[0].id,
  compared: new Set()
};

const listEl = document.querySelector("#proposal-list");
const detailEl = document.querySelector("#proposal-detail");
const countEl = document.querySelector("#result-count");
const emptyEl = document.querySelector("#empty-state");
const compareBar = document.querySelector("#compare-bar");
const compareCount = document.querySelector("#compare-count");
const compareDialog = document.querySelector("#compare-dialog");
const reviewDialog = document.querySelector("#review-dialog");

function signalClass(signal) {
  return `signal-pill signal-pill--${signal}`;
}

function visibleProposals() {
  const term = state.query.trim().toLowerCase();
  const filtered = proposals.filter((proposal) => {
    const matchesFilter = state.filter === "all" || proposal.signal === state.filter;
    const haystack = `${proposal.title} ${proposal.owner} ${proposal.category} ${proposal.summary}`.toLowerCase();
    return matchesFilter && (!term || haystack.includes(term));
  });

  return filtered.sort((a, b) => {
    if (state.sort === "title") return a.title.localeCompare(b.title);
    if (state.sort === "gaps") return b.missing.length - a.missing.length;
    return b.updated - a.updated;
  });
}

function renderResults() {
  const visible = visibleProposals();
  countEl.textContent = String(visible.length);
  emptyEl.hidden = visible.length !== 0;
  listEl.innerHTML = visible.map((proposal) => `
    <article class="proposal-card ${proposal.id === state.selectedId ? "is-selected" : ""}" data-card-id="${proposal.id}">
      <button class="proposal-select" type="button" data-select-id="${proposal.id}" aria-label="View ${proposal.title}">
        <div class="proposal-topline">
          <span class="proposal-kind">${proposal.category}</span>
          <span class="${signalClass(proposal.signal)}">${proposal.signalLabel}</span>
        </div>
        <h3>${proposal.title}</h3>
        <p>${proposal.summary}</p>
        <div class="proposal-meta"><span>${proposal.owner}</span><span>${proposal.duration}</span><span>${proposal.missing.length} information gap${proposal.missing.length === 1 ? "" : "s"}</span></div>
      </button>
      <label class="compare-toggle">
        <input type="checkbox" data-compare-id="${proposal.id}" ${state.compared.has(proposal.id) ? "checked" : ""} />
        Compare
      </label>
    </article>
  `).join("");

  listEl.querySelectorAll("[data-select-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.selectId;
      renderResults();
      renderDetail();
      if (window.innerWidth < 980) detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  listEl.querySelectorAll("[data-compare-id]").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.dataset.compareId;
      if (input.checked && state.compared.size >= 3) {
        input.checked = false;
        window.alert("Choose up to three proposals for a clear comparison.");
        return;
      }
      input.checked ? state.compared.add(id) : state.compared.delete(id);
      renderCompareBar();
    });
  });
}

function renderDetail() {
  const proposal = proposals.find((item) => item.id === state.selectedId);
  if (!proposal) return;

  const missingMarkup = proposal.missing.length
    ? `<div class="detail-section"><h4>Information to request</h4><ul class="detail-list detail-list--missing">${proposal.missing.map((item) => `<li><span>!</span>${item}</li>`).join("")}</ul></div>`
    : `<div class="detail-section"><h4>Information gaps</h4><ul class="detail-list"><li><span>✓</span>No core information gaps in this sample</li></ul></div>`;

  detailEl.innerHTML = `
    <div class="detail-topline">
      <span>Selected proposal</span>
      <span class="${signalClass(proposal.signal)}">${proposal.signalLabel}</span>
    </div>
    <h3>${proposal.title}</h3>
    <p class="detail-owner">${proposal.owner} · ${proposal.category} · ${proposal.duration}</p>
    <p class="detail-summary">${proposal.summary}</p>
    <div class="route-card">
      <div><p>Potential next pathway</p><strong>${proposal.route}</strong></div>
      <small>${proposal.routeNote}<br />Not a final decision</small>
    </div>
    <div class="detail-section">
      <h4>Uncertainty signal</h4>
      <ul class="detail-list"><li><span>↗</span>${proposal.uncertainty}</li></ul>
    </div>
    ${missingMarkup}
    <div class="detail-section">
      <h4>Information present</h4>
      <ul class="detail-list">${proposal.provided.map((item) => `<li><span>✓</span>${item}</li>`).join("")}</ul>
    </div>
    <div class="detail-actions">
      <button class="solid-button" type="button" data-start-review="${proposal.id}">Open reviewer notes</button>
      <button class="outline-button" type="button" data-toggle-compare="${proposal.id}">${state.compared.has(proposal.id) ? "Remove comparison" : "Add to compare"}</button>
    </div>
  `;

  detailEl.querySelector("[data-start-review]").addEventListener("click", () => openReview(proposal.id));
  detailEl.querySelector("[data-toggle-compare]").addEventListener("click", () => {
    if (state.compared.has(proposal.id)) state.compared.delete(proposal.id);
    else if (state.compared.size < 3) state.compared.add(proposal.id);
    else window.alert("Choose up to three proposals for a clear comparison.");
    renderResults();
    renderDetail();
    renderCompareBar();
  });
}

function renderCompareBar() {
  compareBar.hidden = state.compared.size === 0;
  compareCount.textContent = String(state.compared.size);
}

function openComparison() {
  const selected = proposals.filter((proposal) => state.compared.has(proposal.id));
  const grid = document.querySelector("#compare-grid");
  grid.style.setProperty("--compare-columns", String(Math.max(selected.length, 1)));
  grid.innerHTML = selected.map((proposal) => `
    <article class="compare-column">
      <span class="${signalClass(proposal.signal)}">${proposal.signalLabel}</span>
      <h3>${proposal.title}</h3>
      <p>${proposal.owner}</p>
      <div class="compare-fact"><span>Potential pathway</span><strong>${proposal.route}</strong></div>
      <div class="compare-fact"><span>Duration</span><strong>${proposal.duration}</strong></div>
      <div class="compare-fact"><span>Information gaps</span><strong>${proposal.missing.length ? proposal.missing.join(", ") : "No core gaps in sample"}</strong></div>
      <div class="compare-fact"><span>Uncertainty</span><strong>${proposal.uncertainty}</strong></div>
    </article>
  `).join("");
  compareDialog.showModal();
}

function openReview(id) {
  const proposal = proposals.find((item) => item.id === id);
  reviewDialog.dataset.proposalId = id;
  document.querySelector("#review-dialog-title").textContent = proposal.title;
  document.querySelector("#review-notes").value = localStorage.getItem(`ppm-note-${id}`) || "";
  document.querySelector("#save-message").textContent = "";
  reviewDialog.showModal();
}

document.querySelector("#proposal-search").addEventListener("input", (event) => {
  state.query = event.target.value;
  renderResults();
});

document.querySelector("#sort-select").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderResults();
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
    renderResults();
  });
});

document.querySelector("#clear-compare").addEventListener("click", () => {
  state.compared.clear();
  renderResults();
  renderDetail();
  renderCompareBar();
});

document.querySelector("#open-compare").addEventListener("click", openComparison);
document.querySelector("[data-close-dialog]").addEventListener("click", () => compareDialog.close());
document.querySelector("[data-close-review]").addEventListener("click", () => reviewDialog.close());

document.querySelector("#save-note").addEventListener("click", () => {
  const id = reviewDialog.dataset.proposalId;
  localStorage.setItem(`ppm-note-${id}`, document.querySelector("#review-notes").value);
  document.querySelector("#save-message").textContent = "Saved in this browser.";
});

[compareDialog, reviewDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#proposal-search").focus();
  }
});

renderResults();
renderDetail();
renderCompareBar();

document.body.classList.add("js-ready");
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -8%" });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
