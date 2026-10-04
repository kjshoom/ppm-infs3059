const CRITERIA = [
  { key: "alignment", label: "Strategic Alignment", short: "Alignment", low: "No clear link to strategy", high: "Directly supports a top priority" },
  { key: "value", label: "Expected Business Value", short: "Value", low: "Little or no improvement", high: "Exceptional financial or non-financial benefit" },
  { key: "feasibility", label: "Delivery Feasibility", short: "Feasibility", low: "Essential capabilities are unavailable", high: "Capabilities and resources are confirmed" },
  { key: "risk", label: "Risk Manageability", short: "Risk", low: "Very high overall risk", high: "Very low overall risk" },
  { key: "urgency", label: "Time Criticality", short: "Urgency", low: "Can be deferred with little impact", high: "Must begin now to avoid severe impact" }
];

const REVIEW_SCORING_GUIDES = {
  alignment: {
    title: "Strategic Alignment",
    labels: ["Very Low", "Low", "Moderate", "High", "Very High"],
    descriptions: [
      "The project has no clear connection to the organisation’s stated strategic objectives, or conflicts with them.",
      "The project has an indirect or weak connection to the organisation’s stated strategic objectives.",
      "The project clearly supports a stated strategic objective, but has limited alignment with current strategic priorities.",
      "The project directly supports a current strategic priority and clearly explains how its intended outcomes contribute to that priority.",
      "The project directly supports a top strategic priority, with clear evidence that its intended outcomes would make a substantial contribution to achieving that priority."
    ]
  },
  value: {
    title: "Organisational Value / Expected Benefits",
    labels: ["Very Low", "Low", "Moderate", "High", "Very High"],
    descriptions: [
      "The project is expected to provide little or no improvement over the current situation.",
      "The project is expected to provide small improvements, with limited financial or non-financial benefits.",
      "The project is expected to provide meaningful improvements, with clear financial or non-financial benefits.",
      "The project is expected to provide substantial improvements, with major financial or non-financial benefits.",
      "The project is expected to provide exceptionally large improvements, with extensive financial or non-financial benefits."
    ]
  },
  feasibility: {
    title: "Delivery Feasibility",
    labels: ["Very Low", "Low", "Moderate", "High", "Very High"],
    descriptions: [
      "Essential technical capabilities, skills, or resources are unavailable, with no credible plan to obtain them within the proposed timeframe.",
      "Major gaps in technical capabilities, skills, or resources remain, and plans to address them are incomplete or unconfirmed.",
      "Some capability or resource gaps remain, but there is a realistic plan to address them within the proposed timeframe.",
      "Most required capabilities and resources are confirmed. Only minor gaps remain, with clear arrangements to address them before they are needed.",
      "All essential capabilities, resources, and operational arrangements are confirmed for the proposed timeframe, with no significant execution gaps identified."
    ]
  },
  risk: {
    title: "Risk",
    labels: ["Very High Risk", "High Risk", "Moderate Risk", "Low Risk", "Very Low Risk"],
    descriptions: [
      "The project presents very high overall risk, considering the likelihood and potential impact of adverse events.",
      "The project presents high overall risk, with significant concerns about the likelihood or potential impact of adverse events.",
      "The project presents moderate overall risk, with concerns that require monitoring and mitigation.",
      "The project presents low overall risk, with limited concerns about the likelihood and potential impact of adverse events.",
      "The project presents very low overall risk, with adverse events assessed as unlikely and their potential impact as minor."
    ]
  },
  urgency: {
    title: "Time Criticality / Urgency",
    labels: ["Very Low", "Low", "Moderate", "High", "Very High"],
    descriptions: [
      "The project can be deferred beyond the current planning cycle with negligible consequences. No pressing deadline or time-sensitive opportunity is identified.",
      "The project can be deferred to a later planning cycle with minor consequences. There is considerable flexibility in when work needs to begin.",
      "The project should begin within the current planning cycle. Some delay is manageable, but further postponement would cause meaningful operational impacts or lost opportunities.",
      "The project needs to begin soon to meet an important deadline or opportunity window. There is little scheduling flexibility, and further delay would have substantial consequences.",
      "The project needs to begin immediately to avoid missing a critical deadline or opportunity window. Further delay would have severe consequences for the organisation."
    ]
  }
};

const TEST_MODE = new URLSearchParams(window.location.search).has("mvpTest");
const TEST_PREFIX = "ppm-mvp-test-v1:";

const DEFAULT_ORGANISATION = {
  name: "Demo IT Portfolio 2026",
  startDate: "2026-10-01",
  endDate: "2027-01-13",
  businessUnit: "IT Department",
  planningHorizon: "FY2026–FY2027",
  objectives: ["Improve Customer Experience", "Improve Operational Efficiency", "Service Reliability"],
  budget: 5,
  resources: [
    { name: "Developers", fte: 8 },
    { name: "Data Analysts", fte: 4 },
    { name: "Cybersecurity Specialists", fte: 4 },
    { name: "Project Managers", fte: 4 }
  ],
  staff: 20
};

const FIXED_RESOURCE_TYPES = ["Developers", "Data Analysts", "Cybersecurity Specialists", "Project Managers"];

const DEMO_PROPOSALS = [
  {
    id: "project-a", title: "Project A", owner: "Project Team A", category: "IT project", scenarioGroup: "A",
    objective: "Improve Customer Experience", duration: "12 weeks", cost: 0.8, staff: 3, status: "Evaluated",
    summary: "Example proposal A for demonstrating the portfolio review workflow.",
    benefits: "Shows how a reviewed proposal can be shortlisted, compared, and included in a candidate portfolio.",
    risks: "Example delivery assumptions must be replaced when the team enters the real proposal.",
    scores: { alignment: 4, value: 4, feasibility: 5, risk: 4, urgency: 3 },
    rationales: {
      alignment: "The example supports a stated strategic objective.",
      value: "The expected benefit is clear enough for an initial comparison.",
      feasibility: "The example assumes the required capability is available.",
      risk: "The example risks appear manageable with normal controls.",
      urgency: "The example can be planned within the current cycle."
    }, missing: []
  },
  {
    id: "project-b", title: "Project B", owner: "Project Team B", category: "IT project", scenarioGroup: "A",
    objective: "Improve Operational Efficiency", duration: "16 weeks", cost: 1.1, staff: 4, status: "Evaluated",
    summary: "Example proposal B for demonstrating the portfolio review workflow.",
    benefits: "Provides a second project profile for comparing cost, resources, and reviewer evidence.",
    risks: "Example dependencies must be confirmed when the team enters the real proposal.",
    scores: { alignment: 5, value: 4, feasibility: 3, risk: 3, urgency: 4 },
    rationales: {
      alignment: "The example is closely aligned with an operational priority.",
      value: "The example describes a useful operational improvement.",
      feasibility: "Some delivery assumptions still need confirmation.",
      risk: "Dependencies require active monitoring and mitigation.",
      urgency: "The example should begin within the current planning cycle."
    }, missing: []
  },
  {
    id: "project-c", title: "Project C", owner: "Project Team C", category: "IT project", scenarioGroup: "B",
    objective: "Service Reliability", duration: "14 weeks", cost: 0.9, staff: 3, status: "Evaluated",
    summary: "Example proposal C for demonstrating the portfolio review workflow.",
    benefits: "Shows an alternative candidate portfolio with a different five-criterion profile.",
    risks: "Example service assumptions must be replaced with evidence from the real proposal.",
    scores: { alignment: 4, value: 3, feasibility: 4, risk: 5, urgency: 4 },
    rationales: {
      alignment: "The example supports the service-reliability objective.",
      value: "The expected benefit is moderate and clearly described.",
      feasibility: "The example assumes a practical delivery approach.",
      risk: "The example has few unresolved delivery risks.",
      urgency: "The timing matters within the current planning cycle."
    }, missing: []
  },
  {
    id: "project-d", title: "Project D", owner: "Project Team D", category: "IT project", scenarioGroup: "B",
    objective: "Service Reliability", duration: "20 weeks", cost: 1.3, staff: 5, status: "Evaluated",
    summary: "Example proposal D for demonstrating the portfolio review workflow.",
    benefits: "Provides a contrasting candidate for scenario and constraint checking.",
    risks: "Example technical and resource assumptions must be validated before a real decision.",
    scores: { alignment: 5, value: 5, feasibility: 3, risk: 3, urgency: 5 },
    rationales: {
      alignment: "The example directly supports a security objective.",
      value: "The example describes a substantial organisational benefit.",
      feasibility: "Specialist capacity needs to be confirmed.",
      risk: "Technical dependencies require active management.",
      urgency: "The example represents a time-critical need."
    }, missing: []
  },
  {
    id: "project-e", title: "Project E", owner: "Customer Platforms Team", category: "IT project", scenarioGroup: "",
    objective: "Improve Customer Experience", duration: "10 weeks", cost: 0.7, staff: 2, status: "Submitted",
    summary: "Introduce a self-service request portal that gives customers clearer updates and reduces avoidable support calls.",
    benefits: "Customers can track requests in one place while service teams spend less time answering repeated status enquiries.",
    risks: "Content ownership and integration with the current support mailbox must be confirmed before delivery begins.",
    scores: {}, rationales: {}, missing: []
  },
  {
    id: "project-f", title: "Project F", owner: "Service Operations Team", category: "IT project", scenarioGroup: "",
    objective: "Service Reliability", duration: "12 weeks", cost: 1.0, staff: 3, status: "Under review",
    summary: "Create consolidated service-health monitoring and alerting for the organisation's most important digital services.",
    benefits: "Earlier incident detection should reduce service disruption and give support teams a clearer operational view.",
    risks: "Monitoring coverage depends on access to several existing systems and agreement on alert ownership.",
    scores: { alignment: 4, value: 4 },
    rationales: {
      alignment: "The proposal directly supports the saved Service Reliability objective.",
      value: "Earlier detection and clearer alerts are expected to reduce disruption and repeated diagnostic work."
    },
    missing: ["Delivery feasibility, risk manageability, and time criticality still require reviewer assessment."]
  }
];

const DEFAULT_SCENARIOS = {
  A: { projectIds: ["project-a", "project-b"], budget: DEFAULT_ORGANISATION.budget, staff: DEFAULT_ORGANISATION.staff },
  B: { projectIds: ["project-c", "project-d"], budget: DEFAULT_ORGANISATION.budget, staff: DEFAULT_ORGANISATION.staff }
};

const TEST_ORGANISATION = {
  name: "MVP test portfolio",
  objectives: ["Improve Customer Experience", "Improve Operational Efficiency", "Improve Service Reliability", "Reduce Security Risk"],
  budget: 1.5,
  staff: 4
};

const TEST_PROPOSALS = [
  {
    id: "test-service-hub", title: "Service Hub", owner: "Test Digital Team", category: "Service management",
    objective: "Improve Operational Efficiency", duration: "12 weeks", cost: 0.6, staff: 2, status: "Evaluated",
    summary: "A small test project for improving internal service requests and updates.",
    benefits: "Faster request handling and clearer updates for staff.",
    risks: "The data migration needs a staged handover.",
    scores: { alignment: 4, value: 4, feasibility: 5, risk: 4, urgency: 3 },
    rationales: {
      alignment: "Supports the operational-efficiency objective.",
      value: "Removes repeated manual request handling.",
      feasibility: "The team has delivered a similar workflow before.",
      risk: "A staged handover keeps the migration manageable.",
      urgency: "Helpful this term, but not tied to a fixed deadline."
    }, missing: []
  },
  {
    id: "test-accessibility-update", title: "Accessibility Update", owner: "Test Student Experience", category: "Web platform",
    objective: "Improve Customer Experience", duration: "10 weeks", cost: 0.7, staff: 1, status: "Evaluated",
    summary: "A test update for keyboard access, contrast, and form feedback in a student-facing service.",
    benefits: "A more inclusive experience and better accessibility readiness.",
    risks: "A final audit may find a few extra pages to update.",
    scores: { alignment: 5, value: 4, feasibility: 4, risk: 5, urgency: 4 },
    rationales: {
      alignment: "Directly supports an inclusive student experience.",
      value: "Improves access for a broad group of users.",
      feasibility: "The changes are small and well understood.",
      risk: "Changes can be tested one page at a time.",
      urgency: "There is a clear window before the next audit."
    }, missing: []
  },
  {
    id: "test-security-pilot", title: "Security Pilot", owner: "Test Cyber Security", category: "Security",
    objective: "Reduce Security Risk", duration: "8 weeks", cost: 0.9, staff: 4, status: "Under review",
    summary: "A test role-based access pilot for a small group of internal systems.",
    benefits: "Clearer access controls and less manual access work.",
    risks: "System interfaces and ownership still need confirmation.",
    scores: { alignment: 5, value: 4, feasibility: 3, risk: 3, urgency: 5 },
    rationales: {
      alignment: "Directly supports the security objective.",
      value: "Could reduce inappropriate permissions and manual work.",
      feasibility: "Interfaces still need to be confirmed before wider rollout.",
      risk: "A limited pilot contains the delivery risk.",
      urgency: "It responds to a recent security finding."
    }, missing: ["Interface confirmation"]
  },
  {
    id: "test-awaiting-review", title: "Test proposal awaiting review", owner: "Test Project Owner", category: "IT project",
    objective: "Improve Service Reliability", duration: "6 weeks", cost: 0.3, staff: 1, status: "Submitted",
    summary: "Use this small proposal to test the reviewer validation and evaluation form.",
    benefits: "A safe item for testing the review workflow.",
    risks: "No major delivery risks are known at this early stage.",
    scores: {}, rationales: {}, missing: []
  }
];

const STORAGE = {
  accounts: "ppm-v2-prototype-accounts",
  activeAccount: "ppm-v2-active-account",
  organisation: "ppm-organisation",
  customProposals: "ppm-v2-custom-proposals",
  shortlist: "ppm-v2-shortlist",
  scenarios: "ppm-v2-scenarios",
  decisions: "ppm-v2-decisions",
  scenarioDecisions: "ppm-v2-scenario-decisions"
};

const activeStorage = TEST_MODE ? window.sessionStorage : window.localStorage;
const scopedStorageKey = (key) => TEST_MODE ? `${TEST_PREFIX}${key}` : key;
const storage = {
  get: (key) => activeStorage.getItem(scopedStorageKey(key)),
  set: (key, value) => activeStorage.setItem(scopedStorageKey(key), value),
  remove: (key) => activeStorage.removeItem(scopedStorageKey(key))
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function readStoredJSON(key, fallback) {
  try {
    const raw = storage.get(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    storage.remove(key);
    return fallback;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function uniqueObjectives(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).map((value) => String(value).trim()).filter((value) => {
    if (!value) return false;
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const ACCOUNT_ROLES = ["Project Proposer", "Reviewer", "Portfolio Manager"];

function normaliseAccounts(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).map((account) => ({
    id: String(account?.id || "").trim(),
    displayName: String(account?.displayName || "").trim(),
    role: String(account?.role || "").trim(),
    createdAt: String(account?.createdAt || "")
  })).filter((account) => {
    if (!account.id || !account.displayName || !ACCOUNT_ROLES.includes(account.role) || seen.has(account.id)) return false;
    seen.add(account.id);
    return true;
  });
}

function normaliseResources(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).map((resource) => ({
    name: String(resource?.name || "").trim(),
    fte: resource?.fte === "" || resource?.fte == null ? NaN : Number(resource.fte)
  })).filter((resource) => {
    const key = resource.name.toLocaleLowerCase();
    if (!resource.name || !Number.isFinite(resource.fte) || resource.fte < 0 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normaliseProposal(raw) {
  return {
    id: String(raw.id),
    title: String(raw.title || "Untitled IT project"),
    owner: String(raw.owner || "Not assigned"),
    category: String(raw.category || "IT project"),
    objective: String(raw.objective || DEFAULT_ORGANISATION.objectives[0]),
    duration: String(raw.duration || "Not provided"),
    cost: Math.max(0, numberOr(raw.cost, 0)),
    staff: Math.max(0, numberOr(raw.staff, 0)),
    status: String(raw.status || "Submitted"),
    summary: String(raw.summary || "No description provided."),
    benefits: String(raw.benefits || "No expected benefits recorded."),
    risks: String(raw.risks || "No risks or dependencies recorded."),
    scores: raw.scores && typeof raw.scores === "object" ? { ...raw.scores } : {},
    rationales: raw.rationales && typeof raw.rationales === "object" ? { ...raw.rationales } : {},
    missing: Array.isArray(raw.missing) ? raw.missing.map(String) : [],
    isCustom: Boolean(raw.isCustom),
    scenarioGroup: raw.scenarioGroup === "A" || raw.scenarioGroup === "B" ? raw.scenarioGroup : ""
  };
}

function normaliseOrganisation(raw) {
  const suppliedObjectives = uniqueObjectives(raw?.objectives);
  const resources = normaliseResources(raw?.resources);
  const resourceTotal = resources.reduce((sum, resource) => sum + resource.fte, 0);
  const storedStaff = Number(raw?.staff);
  return {
    name: String(raw?.name || DEFAULT_ORGANISATION.name),
    startDate: String(raw?.startDate || ""),
    endDate: String(raw?.endDate || ""),
    businessUnit: String(raw?.businessUnit || ""),
    planningHorizon: String(raw?.planningHorizon || ""),
    objectives: suppliedObjectives,
    budget: Math.max(0, numberOr(raw?.budget, DEFAULT_ORGANISATION.budget)),
    resources,
    staff: Math.max(0, Number.isFinite(storedStaff) ? storedStaff : resources.length ? resourceTotal : DEFAULT_ORGANISATION.staff)
  };
}

let organisation = normaliseOrganisation(readStoredJSON(STORAGE.organisation, TEST_MODE ? TEST_ORGANISATION : DEFAULT_ORGANISATION));
const initialProposals = TEST_MODE ? TEST_PROPOSALS : DEMO_PROPOSALS;
const proposalMap = new Map(initialProposals.map((proposal) => [proposal.id, normaliseProposal(proposal)]));
readStoredJSON(STORAGE.customProposals, []).forEach((proposal) => {
  const normalised = normaliseProposal(proposal);
  if (normalised.id) proposalMap.set(normalised.id, normalised);
});
const proposals = Array.from(proposalMap.values());
const storedShortlistIds = readStoredJSON(STORAGE.shortlist, []);
const storedAccounts = normaliseAccounts(readStoredJSON(STORAGE.accounts, []));
const storedActiveAccountId = String(readStoredJSON(STORAGE.activeAccount, "") || "");

const state = {
  activeView: TEST_MODE ? "tests" : "manager",
  accounts: storedAccounts,
  activeAccountId: storedAccounts.some((account) => account.id === storedActiveAccountId) ? storedActiveAccountId : "",
  editingAccountId: storedAccounts.some((account) => account.id === storedActiveAccountId) ? storedActiveAccountId : "",
  query: "",
  objective: "all",
  feasibility: 0,
  risk: 0,
  cost: "all",
  status: "all",
  sort: "title",
  selectedId: null,
  compared: new Set(),
  shortlisted: new Set((Array.isArray(storedShortlistIds) ? storedShortlistIds : []).map(String).filter((id) => proposals.some((proposal) => proposal.id === id))),
  scenarios: readStoredJSON(STORAGE.scenarios, structuredClone(DEFAULT_SCENARIOS)),
  activeScenarioName: "A",
  portfolioReviewScenarioName: null,
  decisionScenarioId: null,
  decisions: readStoredJSON(STORAGE.decisions, {}),
  scenarioDecisions: readStoredJSON(STORAGE.scenarioDecisions, {}),
  quickChecks: {},
  testProgress: TEST_MODE ? readStoredJSON("mvp-test-progress", {}) : {}
};

function scenarioIdentifierForName(name) {
  if (name === "A" || name === "B") return `scenario-${name.toLowerCase()}`;
  const value = String(name || "scenario");
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "custom";
  let hash = 0;
  for (const character of value) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return `scenario-${slug}-${Math.abs(hash).toString(36)}`;
}

function ensureScenarioIdentifiers() {
  let changed = false;
  const used = new Set();
  Object.entries(state.scenarios || {}).forEach(([name, scenario]) => {
    let id = typeof scenario?.id === "string" && scenario.id.trim() ? scenario.id.trim() : scenarioIdentifierForName(name);
    while (used.has(id)) id = `${id}-${used.size + 1}`;
    used.add(id);
    if (!scenario || scenario.id !== id) {
      state.scenarios[name] = { ...(scenario || {}), id };
      changed = true;
    }
  });
  if (changed) storage.set(STORAGE.scenarios, JSON.stringify(state.scenarios));
}

ensureScenarioIdentifiers();

const listEl = $("#proposal-list");
const detailEl = $("#proposal-detail");
const emptyEl = $("#empty-state");
const compareDialog = $("#compare-dialog");
const reviewDialog = $("#review-dialog");

function money(value) {
  return `$${Number(value).toFixed(1).replace(".0", "")}M`;
}

function scenarioLabel(proposal) {
  return proposal.scenarioGroup ? `Scenario ${proposal.scenarioGroup}` : "Not assigned";
}

function scenarioLink(proposal) {
  if (!proposal.scenarioGroup) return '<span class="comparison-scenario-unassigned">Not assigned</span>';
  return '<a class="comparison-scenario-link" href="#scenario-' + proposal.scenarioGroup + '" data-open-project-scenario="' + proposal.scenarioGroup + '">Scenario ' + proposal.scenarioGroup + '</a>';
}

function isScore(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 5;
}

function hasRationale(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isEvaluated(proposal) {
  return CRITERIA.every((criterion) => isScore(proposal.scores[criterion.key]) && hasRationale(proposal.rationales[criterion.key]));
}

function currentStatus(proposal) {
  const decision = state.decisions[proposal.id]?.decision;
  if (decision) return decision;
  if (isEvaluated(proposal) && proposal.status === "Submitted") return "Evaluated";
  return proposal.status || "Submitted";
}

function scoreClass(score) {
  return Number(score) >= 4 ? "score-high" : Number(score) === 3 ? "score-medium" : "score-low";
}

function statusClass(status) {
  return `status-${String(status).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function persistCustomProposals() {
  storage.set(STORAGE.customProposals, JSON.stringify(proposals.filter((proposal) => proposal.isCustom)));
}

function persistEvaluation(proposal) {
  storage.set(`ppm-evaluation-${proposal.id}`, JSON.stringify({
    scores: proposal.scores,
    rationales: proposal.rationales,
    status: proposal.status
  }));
  if (proposal.isCustom) persistCustomProposals();
}

function loadStoredEvaluations() {
  proposals.forEach((proposal) => {
    const saved = readStoredJSON(`ppm-evaluation-${proposal.id}`, null);
    if (!saved || typeof saved !== "object") return;
    if (saved.scores && typeof saved.scores === "object") proposal.scores = { ...proposal.scores, ...saved.scores };
    if (saved.rationales && typeof saved.rationales === "object") proposal.rationales = { ...proposal.rationales, ...saved.rationales };
    if (saved.status) proposal.status = String(saved.status);
  });
}

function activeObjectives() {
  return [...new Set(organisation.objectives.map((objective) => objective.trim()).filter(Boolean))];
}

function objectiveDraftValues() {
  return $$("#objective-input-list input").map((input) => input.value);
}

function renderObjectiveInputs(values = organisation.objectives) {
  const list = $("#objective-input-list");
  if (!list) return;
  const objectives = values.length ? values : [""];
  list.innerHTML = objectives.map((objective, index) => `
    <div class="objective-input-row">
      <label>Objective ${index + 1}<input type="text" maxlength="100" value="${escapeHTML(objective)}" data-objective-input /></label>
      <button type="button" class="text-button" data-remove-objective="${index}" ${objectives.length === 1 ? "disabled" : ""}>Remove</button>
    </div>
  `).join("");
  list.querySelectorAll("[data-remove-objective]").forEach((button) => button.addEventListener("click", () => {
    const current = objectiveDraftValues();
    current.splice(Number(button.dataset.removeObjective), 1);
    renderObjectiveInputs(current.length ? current : [""]);
  }));
}

function resourceDraftValues() {
  return $$("#resource-capacity-list [data-resource-row]").map((row) => {
    const fteValue = row.querySelector("[data-resource-fte]").value.trim();
    return {
      name: row.dataset.resourceType,
      fte: fteValue === "" ? null : Number(fteValue)
    };
  });
}

function validateResourceDraft(resources) {
  for (const resource of resources) {
    if (resource.fte !== null && (!Number.isFinite(resource.fte) || resource.fte < 0)) return "Available FTE must be a valid non-negative number.";
  }
  return "";
}

function isFixedResourceName(name) {
  return FIXED_RESOURCE_TYPES.some((type) => type.toLocaleLowerCase() === String(name).trim().toLocaleLowerCase());
}

function fixedResourceValue(resources, type) {
  return resources.find((resource) => resource.name.toLocaleLowerCase() === type.toLocaleLowerCase())?.fte ?? null;
}

function hasCompleteFixedResourceBreakdown(resources) {
  return resources.length === FIXED_RESOURCE_TYPES.length && resources.every((resource) => resource.fte !== null && Number.isFinite(resource.fte) && resource.fte >= 0);
}

function totalAvailableStaff(resources, fallback) {
  return hasCompleteFixedResourceBreakdown(resources) ? resources.reduce((sum, resource) => sum + resource.fte, 0) : fallback;
}

function updateResourceTotal() {
  const resources = resourceDraftValues();
  const error = validateResourceDraft(resources);
  if (error) {
    $("#resource-total-fte").textContent = "—";
    $("#resource-total-source").textContent = "Fix the resource list before saving or calculating the total capacity.";
    $("#resource-capacity-message").textContent = error;
    return;
  }
  const complete = hasCompleteFixedResourceBreakdown(resources);
  const total = totalAvailableStaff(resources, organisation.staff);
  $("#resource-total-fte").textContent = String(Number(total.toFixed(2)));
  $("#resource-total-source").textContent = complete
    ? "Calculated from the four fixed resource types. Only this total is used by the existing scenario staff-capacity check."
    : `Complete all four values to replace the existing total. The saved capacity of ${organisation.staff} FTE remains in use.`;
  $("#resource-capacity-message").textContent = "";
}

function renderResourceRows(values = organisation.resources) {
  const list = $("#resource-capacity-list");
  if (!list) return;
  list.innerHTML = FIXED_RESOURCE_TYPES.map((type) => {
    const fte = fixedResourceValue(values, type);
    return `
      <div class="resource-capacity-row" data-resource-row data-resource-type="${escapeHTML(type)}">
        <strong>${escapeHTML(type)}</strong>
        <label><span class="sr-only">Available FTE for ${escapeHTML(type)}</span><input type="number" min="0" step="0.1" inputmode="decimal" value="${fte === null ? "" : escapeHTML(fte)}" data-resource-fte placeholder="FTE" /></label>
        <span class="resource-unit">FTE</span>
      </div>`;
  }).join("");
  list.querySelectorAll("[data-resource-fte]").forEach((input) => input.addEventListener("input", updateResourceTotal));
  const legacyResources = values.filter((resource) => !isFixedResourceName(resource.name));
  const legacyNote = $("#legacy-resource-note");
  legacyNote.hidden = legacyResources.length === 0;
  legacyNote.innerHTML = legacyResources.length
    ? `<strong>Earlier resource data retained:</strong> ${legacyResources.map((resource) => `${escapeHTML(resource.name)} (${escapeHTML(resource.fte)} FTE)`).join(" · ")}. These records are preserved for compatibility but are not treated as separate constraint categories.`
    : "";
  updateResourceTotal();
}

function updateSelectOptions(select, values, includeAll) {
  if (!select) return;
  const previous = select.value;
  const allOption = includeAll ? '<option value="all">All objectives</option>' : '<option value="" disabled>Select an objective</option>';
  select.innerHTML = `${allOption}${values.map((value) => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join("")}`;
  const candidates = includeAll ? ["all", ...values] : values;
  select.value = candidates.includes(previous) ? previous : (includeAll ? "all" : values[0] || "");
}

function renderOrganisationForm() {
  $("#org-name").value = organisation.name;
  $("#org-start-date").value = organisation.startDate;
  $("#org-end-date").value = organisation.endDate;
  $("#org-business-unit").value = organisation.businessUnit;
  $("#org-planning-horizon").value = organisation.planningHorizon;
  renderObjectiveInputs(organisation.objectives);
  $("#org-budget").value = String(organisation.budget);
  renderResourceRows(organisation.resources);
  $("#resource-capacity-message").textContent = "";
  $("#scenario-organisation").textContent = `${organisation.name} · ${money(organisation.budget)} · ${organisation.staff} FTE`;
}

function populateObjectives() {
  const allObjectives = [...new Set([...activeObjectives(), ...proposals.map((proposal) => proposal.objective)])].sort();
  updateSelectOptions($("#objective-filter"), allObjectives, true);
  state.objective = $("#objective-filter").value;
  updateSelectOptions($("#proposal-objective"), activeObjectives(), false);
}

function visibleProposals() {
  const term = state.query.trim().toLowerCase();
  const maxCost = state.cost === "all" ? Infinity : Number(state.cost);
  const filtered = proposals.filter((proposal) => {
    const haystack = `${proposal.title} ${proposal.owner} ${proposal.category} ${proposal.objective} ${proposal.summary}`.toLowerCase();
    const feasibility = Number(proposal.scores.feasibility) || 0;
    const risk = Number(proposal.scores.risk) || 0;
    return (!term || haystack.includes(term))
      && (state.objective === "all" || proposal.objective === state.objective)
      && feasibility >= state.feasibility
      && risk >= state.risk
      && proposal.cost <= maxCost
      && (state.status === "all" || currentStatus(proposal) === state.status);
  });
  return filtered.sort((a, b) => {
    if (state.sort === "alignment") return (Number(b.scores.alignment) || 0) - (Number(a.scores.alignment) || 0) || a.title.localeCompare(b.title);
    if (state.sort === "feasibility") return (Number(b.scores.feasibility) || 0) - (Number(a.scores.feasibility) || 0) || a.title.localeCompare(b.title);
    if (state.sort === "cost") return a.cost - b.cost || a.title.localeCompare(b.title);
    return a.title.localeCompare(b.title);
  });
}

function assessmentProfile(proposal) {
  if (!isEvaluated(proposal)) {
    return '<div class="awaiting-profile">Awaiting five-criterion reviewer evaluation</div>';
  }
  return `<div class="assessment-profile" aria-label="Five criterion profile">${CRITERIA.map((criterion) => {
    const score = Number(proposal.scores[criterion.key]);
    return `<div><small>${criterion.short}</small><span class="signal-bar"><i style="width:${score * 20}%"></i></span><strong>${score}/5</strong></div>`;
  }).join("")}</div>`;
}

function renderSummary() {
  const evaluated = proposals.filter(isEvaluated).length;
  const underReview = proposals.filter((proposal) => !isEvaluated(proposal) && currentStatus(proposal) === "Under review").length;
  const submitted = proposals.filter((proposal) => !isEvaluated(proposal) && currentStatus(proposal) === "Submitted").length;
  const budgetRequested = proposals.reduce((sum, proposal) => sum + proposal.cost, 0);
  const total = proposals.length || 1;
  $("#summary-total").textContent = String(proposals.length);
  $("#summary-evaluated").textContent = String(evaluated);
  $("#summary-needs-evaluation").textContent = String(proposals.length - evaluated);
  $("#summary-budget-requested").textContent = money(budgetRequested);
  $("#summary-budget-limit").textContent = money(organisation.budget);
  $("#readiness-evaluated").textContent = String(evaluated);
  $("#readiness-review").textContent = String(underReview);
  $("#readiness-submitted").textContent = String(submitted);
  $("#readiness-evaluated-bar").style.width = `${evaluated / total * 100}%`;
  $("#readiness-review-bar").style.width = `${underReview / total * 100}%`;
  $("#readiness-submitted-bar").style.width = `${submitted / total * 100}%`;
}

function overviewScoreCell(proposal, criterion) {
  const score = proposal.scores[criterion.key];
  return isScore(score)
    ? `<span class="overview-score ${scoreClass(score)}">${Number(score)}/5</span>`
    : '<span class="overview-not-rated">Not rated</span>';
}

function renderResults() {
  const visible = visibleProposals();
  $("#result-count").textContent = String(visible.length);
  emptyEl.hidden = visible.length !== 0;
  const rows = visible.map((proposal) => {
    const evaluated = isEvaluated(proposal);
    const status = currentStatus(proposal);
    return `<tr class="${proposal.id === state.selectedId ? "is-selected" : ""}" data-project-id="${escapeHTML(proposal.id)}">
      <td class="shortlist-table-cell"><label class="table-shortlist-control" title="${evaluated ? "Select for comparison" : "Complete reviewer evaluation before comparison"}"><input type="checkbox" data-comparison-id="${escapeHTML(proposal.id)}" aria-label="Select ${escapeHTML(proposal.title)} for comparison" ${state.compared.has(proposal.id) ? "checked" : ""} ${evaluated ? "" : "disabled"} /><span class="sr-only">Select ${escapeHTML(proposal.title)} for comparison</span></label></td>
      <th scope="row"><strong>${escapeHTML(proposal.title)}</strong><small>${escapeHTML(proposal.owner)}</small></th>
      <td><span class="table-objective">${escapeHTML(proposal.objective)}</span></td>
      ${CRITERIA.map((criterion) => `<td class="criterion-table-cell" data-label="${escapeHTML(criterion.label)}">${overviewScoreCell(proposal, criterion)}</td>`).join("")}
      <td class="table-cost">${money(proposal.cost)}</td>
      <td><span class="status-pill ${statusClass(status)}">${escapeHTML(status)}</span></td>
      <td><div class="table-row-actions"><button type="button" class="text-button" data-select-id="${escapeHTML(proposal.id)}">View details</button>${proposal.isCustom ? `<button type="button" class="card-remove-button" data-delete-proposal="${escapeHTML(proposal.id)}" aria-label="Delete proposal ${escapeHTML(proposal.title)}">Delete proposal</button>` : ""}</div></td>
    </tr>`;
  }).join("");
  listEl.innerHTML = visible.length ? `<table class="portfolio-project-table"><thead><tr><th scope="col"><span class="sr-only">Select for comparison</span></th><th scope="col">Project name</th><th scope="col">Primary strategic objective</th>${CRITERIA.map((criterion) => `<th scope="col">${escapeHTML(criterion.label)}</th>`).join("")}<th scope="col">Estimated cost</th><th scope="col">Evaluation status</th><th scope="col">Details</th></tr></thead><tbody>${rows}</tbody></table>` : "";

  $$('[data-select-id]').forEach((button) => button.addEventListener("click", () => {
    state.selectedId = button.dataset.selectId;
    renderResults();
    renderDetail();
    detailEl.focus({ preventScroll: true });
    detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  $$('[data-comparison-id]').forEach((input) => input.addEventListener("change", () => toggleComparisonSelection(input.dataset.comparisonId, input.checked)));
  bindCustomProposalDeleteButtons(listEl);
}

function toggleComparisonSelection(id, shouldAdd) {
  const proposal = proposals.find((item) => item.id === id);
  if (!proposal || !isEvaluated(proposal)) {
    window.alert("Complete the five-criterion review before comparing this proposal.");
    return;
  }
  if (shouldAdd && state.compared.size >= 4) {
    window.alert("Choose up to four projects for a clear comparison.");
    return;
  }
  if (shouldAdd) state.compared.add(id);
  else state.compared.delete(id);
  renderSummary();
  renderResults();
  renderScenario();
  if (state.activeView === "shortlist") renderShortlistWorkspace();
  if (state.activeView === "comparison") renderComparisonWorkspace();
  if (state.activeView === "scenarios") renderScenarioWorkspace();
}

function persistFormalShortlist() {
  storage.set(STORAGE.shortlist, JSON.stringify([...state.shortlisted]));
}

function shortlistedProposals() {
  return proposals.filter((proposal) => state.shortlisted.has(proposal.id) && isEvaluated(proposal));
}

function toggleFormalShortlist(id, shouldAdd) {
  const proposal = proposals.find((item) => item.id === id);
  if (!proposal || !isEvaluated(proposal)) {
    window.alert("Complete the five-criterion review before adding this proposal to the Shortlist.");
    return;
  }
  if (shouldAdd) state.shortlisted.add(id);
  else state.shortlisted.delete(id);
  persistFormalShortlist();
  renderShortlistWorkspace();
  if (state.activeView === "comparison") renderComparisonWorkspace();
  if (state.activeView === "scenarios") renderScenarioWorkspace();
}

function bindCustomProposalDeleteButtons(scope) {
  if (!scope) return;
  scope.querySelectorAll('[data-delete-proposal]').forEach((button) => {
    button.addEventListener("click", () => deleteCustomProposal(button.dataset.deleteProposal));
  });
}

function deleteCustomProposal(id) {
  const proposalIndex = proposals.findIndex((proposal) => proposal.id === id);
  const proposal = proposals[proposalIndex];
  if (!proposal?.isCustom) return;
  if (!window.confirm(`Remove “${proposal.title}” from this browser?`)) return;
  proposals.splice(proposalIndex, 1);
  state.compared.delete(id);
  state.shortlisted.delete(id);
  if (state.selectedId === id) state.selectedId = null;
  Object.entries(state.scenarios || {}).forEach(([name, scenario]) => {
    const projectIds = Array.isArray(scenario?.projectIds) ? scenario.projectIds : [];
    state.scenarios[name] = { ...scenario, projectIds: projectIds.filter((projectId) => projectId !== id) };
  });
  delete state.decisions[id];
  persistCustomProposals();
  persistFormalShortlist();
  storage.set(STORAGE.scenarios, JSON.stringify(state.scenarios));
  storage.set(STORAGE.decisions, JSON.stringify(state.decisions));
  storage.remove(`ppm-evaluation-${id}`);
  storage.remove(`ppm-note-${id}`);
  renderAll();
  if (state.activeView === "comparison") renderComparisonWorkspace();
  if (state.activeView === "scenarios") renderScenarioWorkspace();
  if (state.activeView === "decisions") renderDecisionWorkspace();
  if (state.activeView === "reports") renderReportWorkspace();
}

function selectedProposals() {
  return proposals.filter((proposal) => state.compared.has(proposal.id) && isEvaluated(proposal));
}

function calculateScenario(selected, budget = organisation.budget, staff = organisation.staff) {
  const totalCost = selected.reduce((sum, proposal) => sum + proposal.cost, 0);
  const totalStaff = selected.reduce((sum, proposal) => sum + proposal.staff, 0);
  return {
    totalCost,
    totalStaff,
    budgetOk: totalCost <= budget,
    staffOk: totalStaff <= staff
  };
}

function renderScenario() {
  const selected = selectedProposals();
  const { totalCost, totalStaff, budgetOk, staffOk } = calculateScenario(selected);

  $("#scenario-selection").innerHTML = selected.length
    ? selected.map((proposal) => `<button type="button" data-remove-comparison="${escapeHTML(proposal.id)}"><span>${escapeHTML(proposal.title)}</span><strong>${money(proposal.cost)} · ${proposal.staff} FTE</strong><i aria-hidden="true">×</i></button>`).join("")
    : "<p>Select two to four evaluated projects from the table.</p>";
  $("#scenario-cost").textContent = money(totalCost);
  $("#scenario-staff").textContent = `${totalStaff} FTE`;
  $("#budget-check").textContent = budgetOk ? `Within ${money(organisation.budget)}` : `${money(totalCost - organisation.budget)} over budget`;
  $("#staff-check").textContent = staffOk ? `Within ${organisation.staff} FTE` : `${totalStaff - organisation.staff} FTE over capacity`;
  $("#budget-check").className = budgetOk ? "check-ok" : "check-warning";
  $("#staff-check").className = staffOk ? "check-ok" : "check-warning";
  $("#constraint-result").className = `constraint-result ${selected.length && budgetOk && staffOk ? "is-feasible" : selected.length ? "is-warning" : ""}`;
  $("#constraint-result").innerHTML = !selected.length
    ? "Select projects to check constraints."
    : budgetOk && staffOk
      ? "<strong>Feasible candidate</strong><span>The current selection is within both organisation limits.</span>"
      : `<strong>Needs revision</strong><span>${!budgetOk ? "Budget limit exceeded. " : ""}${!staffOk ? "Staff capacity exceeded." : ""}</span>`;
  $("#open-compare").disabled = selected.length < 2;
  $$('[data-remove-comparison]').forEach((button) => button.addEventListener("click", () => toggleComparisonSelection(button.dataset.removeComparison, false)));
  renderSavedScenarios();
}

function renderSavedScenarios() {
  const entries = Object.entries(state.scenarios || {});
  $("#saved-scenarios").innerHTML = entries.length ? `<h4>Defined scenarios</h4>${entries.map(([name, scenario]) => {
    const ids = Array.isArray(scenario.projectIds) ? scenario.projectIds : [];
    const projects = proposals.filter((proposal) => ids.includes(proposal.id) && isEvaluated(proposal));
    const cost = projects.reduce((sum, proposal) => sum + proposal.cost, 0);
    const staff = projects.reduce((sum, proposal) => sum + proposal.staff, 0);
    const budget = Math.max(0, numberOr(scenario.budget, organisation.budget));
    const capacity = Math.max(0, numberOr(scenario.staff, organisation.staff));
    const feasible = cost <= budget && staff <= capacity;
    return `<button type="button" data-load-scenario="${escapeHTML(name)}"><span>Scenario ${escapeHTML(name)}</span><small>${projects.length} projects · ${money(cost)} · ${staff} FTE</small><strong>${feasible ? "Feasible" : "Needs revision"}</strong></button>`;
  }).join("")}` : "";
  $$('[data-load-scenario]').forEach((button) => button.addEventListener("click", () => {
    state.activeScenarioName = button.dataset.loadScenario;
    setActiveView("scenarios");
  }));
}

function radarSVG(series) {
  const size = 520;
  const center = size / 2;
  const radius = 168;
  const labelRadius = 215;
  const colours = ["#1176d4", "#7b42d1", "#1c9d57", "#e47816"];
  const point = (index, distance) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / CRITERIA.length;
    return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance];
  };
  const points = (distance) => CRITERIA.map((_, index) => point(index, distance).join(",")).join(" ");
  const grid = [1, 2, 3, 4, 5].map((level) => `<polygon points="${points(radius * level / 5)}" fill="none" stroke="#d7d7cf" stroke-width="1"/>`).join("");
  const axes = CRITERIA.map((_, index) => {
    const [x, y] = point(index, radius);
    return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#d7d7cf"/>`;
  }).join("");
  const labels = CRITERIA.map((criterion, index) => {
    const [x, y] = point(index, labelRadius);
    const anchor = x < center - 20 ? "end" : x > center + 20 ? "start" : "middle";
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle">${criterion.short}</text>`;
  }).join("");
  const shapes = series.map((item, seriesIndex) => {
    const colour = colours[seriesIndex % colours.length];
    const seriesPoints = CRITERIA.map((criterion, index) => point(index, radius * Number(item.scores[criterion.key]) / 5).join(",")).join(" ");
    const dots = CRITERIA.map((criterion, index) => {
      const [x, y] = point(index, radius * Number(item.scores[criterion.key]) / 5);
      return `<circle cx="${x}" cy="${y}" r="4.5" fill="${colour}"/>`;
    }).join("");
    return `<polygon points="${seriesPoints}" fill="${colour}" fill-opacity="0.14" stroke="${colour}" stroke-width="3"/>${dots}`;
  }).join("");
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Radar chart comparing five project criteria">${grid}${axes}${shapes}${labels}</svg>`;
}

function detailsOverview(proposal) {
  return `<div class="detail-overview"><article><span>Expected benefits</span><p>${escapeHTML(proposal.benefits)}</p></article><article><span>Key risks and dependencies</span><p>${escapeHTML(proposal.risks)}</p></article></div>`;
}

function renderDetail() {
  const proposal = proposals.find((item) => item.id === state.selectedId);
  if (!proposal) {
    detailEl.hidden = true;
    detailEl.innerHTML = "";
    detailEl.closest('[data-workspace-view="manager"]')?.classList.remove("is-detail-open");
    return;
  }
  detailEl.hidden = false;
  detailEl.tabIndex = -1;
  detailEl.closest('[data-workspace-view="manager"]')?.classList.add("is-detail-open");
  const savedDecision = state.decisions[proposal.id];
  const status = currentStatus(proposal);
  const detailHeader = `<button type="button" class="project-detail-back" data-close-project-detail>← Back to Project Overview</button><div class="insight-header"><div><p class="section-kicker">Project insight</p><h3>${escapeHTML(proposal.title)}</h3><p>${escapeHTML(proposal.owner)} · ${escapeHTML(proposal.objective)} · ${money(proposal.cost)} · ${proposal.staff} FTE · ${escapeHTML(proposal.duration)}</p></div><div><span class="objective-tag">${escapeHTML(scenarioLabel(proposal))}</span><span class="status-pill ${statusClass(status)}">${escapeHTML(status)}</span><button type="button" class="outline-button" data-open-review="${escapeHTML(proposal.id)}">${isEvaluated(proposal) ? "Edit evaluation" : "Start evaluation"}</button>${proposal.isCustom ? `<button type="button" class="card-remove-button" data-delete-proposal="${escapeHTML(proposal.id)}">Remove added</button>` : ""}</div></div>`;

  if (!isEvaluated(proposal)) {
    detailEl.innerHTML = `${detailHeader}${detailsOverview(proposal)}<div class="pending-evaluation"><div><p class="section-kicker">Next step</p><h4>Ready for a five-criterion review.</h4></div><div><p>Record ratings and a short reason for strategic alignment, expected business value, delivery feasibility, risk manageability, and time criticality. A radar profile appears only after all five are complete.</p><button type="button" class="solid-button" data-open-review="${escapeHTML(proposal.id)}">Review this proposal</button></div></div>`;
  } else {
    detailEl.innerHTML = `${detailHeader}${detailsOverview(proposal)}
      <div class="insight-grid"><div class="single-radar">${radarSVG([proposal])}</div><div class="criteria-panel"><h4>Criterion ratings</h4>${CRITERIA.map((criterion, index) => `<button type="button" class="criterion-row ${index === 0 ? "is-active" : ""}" data-criterion="${criterion.key}"><span>${criterion.label}</span><strong class="${scoreClass(proposal.scores[criterion.key])}">${proposal.scores[criterion.key]}/5</strong></button>`).join("")}</div><div class="rationale-panel"><p class="section-kicker">Reviewer rationale</p><h4 id="rationale-title">${CRITERIA[0].label}</h4><p id="rationale-copy">${escapeHTML(proposal.rationales[CRITERIA[0].key])}</p>${proposal.missing.length ? `<div class="missing-note"><strong>Information still required</strong><span>${proposal.missing.map(escapeHTML).join(", ")}</span></div>` : ""}</div></div>
      <div class="decision-strip"><div><p class="section-kicker">Human decision</p><strong>${savedDecision ? `${escapeHTML(savedDecision.decision)} recorded` : "No final decision recorded"}</strong><small>${savedDecision?.date ? `${escapeHTML(scenarioDisplayName(savedDecision.scenario || "—"))} · Saved ${escapeHTML(savedDecision.date)}` : "Review the evidence and candidate-portfolio constraints first."}</small></div><div><button type="button" data-decision="Approved">Approve</button><button type="button" data-decision="Deferred">Defer</button><button type="button" data-decision="Rejected">Reject</button></div></div>`;
  }

  $$('[data-criterion]').forEach((button) => button.addEventListener("click", () => {
    const criterion = CRITERIA.find((item) => item.key === button.dataset.criterion);
    if (!criterion) return;
    $$('[data-criterion]').forEach((item) => item.classList.toggle("is-active", item === button));
    $("#rationale-title").textContent = criterion.label;
    $("#rationale-copy").textContent = proposal.rationales[criterion.key];
  }));
  $$('[data-open-review]').forEach((button) => button.addEventListener("click", () => openReview(button.dataset.openReview)));
  $$('[data-decision]').forEach((button) => button.addEventListener("click", () => recordDecision(proposal.id, button.dataset.decision)));
  $('[data-close-project-detail]')?.addEventListener("click", closeProjectDetail);
  bindCustomProposalDeleteButtons(detailEl);
}

function closeProjectDetail() {
  const previousId = state.selectedId;
  state.selectedId = null;
  renderDetail();
  renderResults();
  const returnButton = previousId ? document.querySelector(`[data-select-id="${CSS.escape(previousId)}"]`) : null;
  (returnButton || listEl).focus?.({ preventScroll: true });
  document.querySelector('.portfolio-catalog-panel')?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function recordDecision(id, decision) {
  const proposal = proposals.find((item) => item.id === id);
  if (!proposal || !isEvaluated(proposal)) {
    window.alert("Complete the reviewer evaluation before recording a final decision.");
    return;
  }
  const scenarioName = Object.entries(state.scenarios || {}).find(([, scenario]) => Array.isArray(scenario?.projectIds) && scenario.projectIds.includes(id))?.[0];
  if (!scenarioName) {
    window.alert("This proposal has not been assigned to a candidate portfolio scenario yet.");
    return;
  }
  state.decisions[id] = { decision, date: new Date().toLocaleDateString("en-AU"), scenario: scenarioName };
  storage.set(STORAGE.decisions, JSON.stringify(state.decisions));
  renderAll();
}

function openReview(id) {
  const proposal = proposals.find((item) => item.id === id);
  if (!proposal) return;
  reviewDialog.dataset.proposalId = id;
  $("#review-dialog-title").textContent = proposal.title;
  $("#review-score-form").innerHTML = CRITERIA.map((criterion, criterionIndex) => {
    const score = proposal.scores[criterion.key];
    const guide = REVIEW_SCORING_GUIDES[criterion.key];
    const isRisk = criterion.key === "risk";
    const ratingCards = guide.labels.map((label, index) => {
      const value = index + 1;
      return `<label class="review-rating-card"><input type="radio" name="review-score-${criterion.key}" data-review-score="${criterion.key}" value="${value}" ${Number(score) === value ? "checked" : ""} aria-label="${escapeHTML(guide.title)}: ${value}, ${escapeHTML(label)}" required><span class="review-rating-copy"><strong>${value}</strong><small>${escapeHTML(label)}</small></span></label>`;
    }).join("");
    const guideItems = guide.descriptions.map((description, index) => {
      const value = index + 1;
      const scoreLabel = isRisk ? `${value} — ${guide.labels[index]}` : String(value);
      return `<li><strong>${escapeHTML(scoreLabel)}</strong><span>${escapeHTML(description)}</span></li>`;
    }).join("");
    const riskNotice = isRisk ? '<p class="risk-direction-note"><strong>Risk scoring direction</strong><span>Higher score means lower and more manageable risk.</span></p>' : "";
    return `<section class="review-criterion-card ${isRisk ? "is-risk" : ""}" aria-labelledby="review-criterion-${criterion.key}">
      <div class="review-criterion-heading">
        <div><span class="criterion-number">0${criterionIndex + 1}</span><h3 id="review-criterion-${criterion.key}">${escapeHTML(guide.title)}</h3></div>
        ${riskNotice}
      </div>
      <div class="review-rating-options" role="radiogroup" aria-label="${escapeHTML(guide.title)} rating">${ratingCards}</div>
      <label class="review-rationale-field"><span>Rationale <small>Required</small></span><textarea data-review-rationale="${criterion.key}" rows="3" aria-label="Rationale for ${escapeHTML(guide.title)}" placeholder="Add short evidence or a reason for this rating" required>${escapeHTML(proposal.rationales[criterion.key] || "")}</textarea></label>
      <details class="scoring-guide"><summary><span>Scoring guide</span><small>View the formal 1–5 rubric</small></summary><ol>${guideItems}</ol></details>
    </section>`;
  }).join("");
  $("#review-notes").value = storage.get(`ppm-note-${id}`) || "";
  $("#save-message").textContent = "";
  reviewDialog.showModal();
}

function saveReview() {
  const id = reviewDialog.dataset.proposalId;
  const proposal = proposals.find((item) => item.id === id);
  if (!proposal) return;
  const scores = {};
  const rationales = {};
  let complete = true;
  CRITERIA.forEach((criterion) => {
    const scoreInput = $(`[data-review-score="${criterion.key}"]:checked`);
    const rationaleInput = $(`[data-review-rationale="${criterion.key}"]`);
    const score = scoreInput ? Number(scoreInput.value) : Number.NaN;
    const rationale = rationaleInput ? rationaleInput.value.trim() : "";
    if (!isScore(score) || !rationale) complete = false;
    scores[criterion.key] = score;
    rationales[criterion.key] = rationale;
  });
  if (!complete) {
    $("#save-message").textContent = "Give every criterion a 1–5 rating and a short reason before saving.";
    return;
  }
  proposal.scores = scores;
  proposal.rationales = rationales;
  proposal.status = proposal.missing.length ? "Under review" : "Evaluated";
  persistEvaluation(proposal);
  storage.set(`ppm-note-${id}`, $("#review-notes").value.trim());
  $("#save-message").textContent = "Evaluation saved in this browser.";
  renderAll();
}

function renderReviewQueue() {
  const ordered = [...proposals].sort((a, b) => Number(isEvaluated(a)) - Number(isEvaluated(b)) || a.title.localeCompare(b.title));
  $("#review-queue").innerHTML = ordered.map((proposal) => {
    const evaluated = isEvaluated(proposal);
    return `<article class="review-queue-card ${evaluated ? "" : "is-awaiting"}"><div class="review-queue-card-top"><p class="section-kicker">${evaluated ? "Evaluation recorded" : "Awaiting review"}</p><span class="status-pill ${statusClass(currentStatus(proposal))}">${escapeHTML(currentStatus(proposal))}</span></div><h4>${escapeHTML(proposal.title)}</h4><p>${escapeHTML(proposal.owner)} · ${escapeHTML(proposal.objective)} · ${money(proposal.cost)} · ${proposal.staff} FTE</p><div class="queue-profile">${evaluated ? "Five ratings and reviewer rationale available." : "Five ratings and five short rationales required."}</div><div class="review-queue-actions"><button type="button" class="outline-button" data-review-queue-id="${escapeHTML(proposal.id)}">${evaluated ? "Edit evaluation" : "Start evaluation"}</button>${proposal.isCustom ? `<button type="button" class="card-remove-button" data-delete-proposal="${escapeHTML(proposal.id)}">Remove added</button>` : ""}</div></article>`;
  }).join("");
  $$('[data-review-queue-id]').forEach((button) => button.addEventListener("click", () => openReview(button.dataset.reviewQueueId)));
  bindCustomProposalDeleteButtons($("#review-queue"));
}

const QUICK_CHECKS = [
  {
    id: "test-data",
    title: "Test portfolio is ready",
    detail: "Checks the four sample projects used by this walkthrough.",
    run: () => ["test-service-hub", "test-accessibility-update", "test-security-pilot", "test-awaiting-review"].every((id) => proposals.some((proposal) => proposal.id === id))
  },
  {
    id: "five-criteria",
    title: "Five-criterion profiles load",
    detail: "Checks three evaluated test projects have a rating and reason for every criterion.",
    run: () => {
      const evaluated = proposals.filter(isEvaluated);
      return evaluated.length >= 3 && evaluated.every((proposal) => CRITERIA.every((criterion) => isScore(proposal.scores[criterion.key]) && hasRationale(proposal.rationales[criterion.key])));
    }
  },
  {
    id: "search-filter",
    title: "Search finds the right project",
    detail: "Checks the portfolio search can find Security Pilot.",
    run: () => {
      const previous = { query: state.query, objective: state.objective, feasibility: state.feasibility, risk: state.risk, cost: state.cost, status: state.status, sort: state.sort };
      try {
        Object.assign(state, { query: "security pilot", objective: "all", feasibility: 0, risk: 0, cost: "all", status: "all", sort: "title" });
        const found = visibleProposals();
        return found.length === 1 && found[0].id === "test-security-pilot";
      } finally {
        Object.assign(state, previous);
      }
    }
  },
  {
    id: "scenario-math",
    title: "Scenario totals and limits work",
    detail: "Checks the two-project set fits and the three-project set raises both warnings.",
    run: () => {
      const twoProjects = proposals.filter((proposal) => ["test-service-hub", "test-accessibility-update"].includes(proposal.id));
      const threeProjects = proposals.filter((proposal) => ["test-service-hub", "test-accessibility-update", "test-security-pilot"].includes(proposal.id));
      const withinLimits = calculateScenario(twoProjects);
      const overLimits = calculateScenario(threeProjects);
      return Math.abs(withinLimits.totalCost - 1.3) < 0.0001 && withinLimits.totalStaff === 3 && withinLimits.budgetOk && withinLimits.staffOk
        && Math.abs(overLimits.totalCost - 2.2) < 0.0001 && overLimits.totalStaff === 7 && !overLimits.budgetOk && !overLimits.staffOk;
    }
  },
  {
    id: "safe-session",
    title: "Test saving is isolated",
    detail: "Checks this walkthrough can save in the tab without using your normal workspace data.",
    run: () => {
      const key = "mvp-test-probe";
      try {
        storage.set(key, "ready");
        return storage.get(key) === "ready";
      } finally {
        storage.remove(key);
      }
    }
  },
  {
    id: "screen-controls",
    title: "Main controls are available",
    detail: "Checks proposal entry, reviewer evaluation, comparison, and scenario controls are on the page.",
    run: () => Boolean($("#proposal-form") && $("#review-score-form") && $("#open-compare") && $("#proposal-list") && $("#scenario-selection"))
  }
];

const TEST_STEPS = [
  {
    id: "portfolio",
    title: "Check the portfolio overview",
    copy: "Open the portfolio and use the search box to find a project.",
    expected: "Four test projects are shown. Searching for Security Pilot leaves one result.",
    action: "portfolio",
    actionLabel: "Open portfolio"
  },
  {
    id: "proposal",
    title: "Submit a test proposal",
    copy: "Enter a small IT project through the normal proposal form and submit it.",
    expected: "The proposal moves to the Reviewer queue as Submitted.",
    action: "proposal",
    actionLabel: "Open proposal form"
  },
  {
    id: "review",
    title: "Test reviewer validation",
    copy: "Open Test proposal awaiting review, try saving it blank, then add all five ratings and short reasons.",
    expected: "The blank save shows a clear message. A complete review creates a profile and rationale.",
    action: "review",
    actionLabel: "Open reviewer queue"
  },
  {
    id: "rationale",
    title: "Open reviewer evidence",
    copy: "Find Security Pilot and select Feasibility in its project detail.",
    expected: "You can read the reviewer’s reason behind the 3/5 feasibility rating.",
    action: "rationale",
    actionLabel: "Find Security Pilot"
  },
  {
    id: "comparison",
    title: "Compare two evaluated projects",
    copy: "Prepare Service Hub and Accessibility Update, then select Compare selected.",
    expected: "The overlay radar chart and legend show two project profiles.",
    action: "comparison",
    actionLabel: "Prepare comparison"
  },
  {
    id: "constraints",
    title: "Check portfolio limits",
    copy: "Add Security Pilot to the prepared selection and review the scenario panel.",
    expected: "The panel shows $2.2M and 7 FTE, with both limits flagged.",
    action: "constraints",
    actionLabel: "Show limit check"
  },
  {
    id: "decision",
    title: "Record a human decision",
    copy: "Open Service Hub and choose Approve, Defer, or Reject after looking at its evidence.",
    expected: "The decision is recorded in this test tab and remains after a refresh.",
    action: "decision",
    actionLabel: "Open decision"
  }
];

function testStepProgress() {
  return Object.values(state.testProgress).filter(Boolean).length;
}

function renderTestHarness() {
  const banner = $("#test-mode-banner");
  if (banner) banner.hidden = !TEST_MODE;
  if (!TEST_MODE) return;

  const results = Object.values(state.quickChecks);
  const passed = results.filter((result) => result.passed).length;
  $("#quick-check-summary").textContent = results.length ? `${passed} of ${QUICK_CHECKS.length} checks passed` : "Not run yet";
  $("#quick-check-results").innerHTML = results.length
    ? QUICK_CHECKS.map((check) => {
      const result = state.quickChecks[check.id];
      const stateLabel = result?.passed ? "Pass" : "Needs attention";
      return `<article class="quick-check ${result?.passed ? "is-pass" : "is-fail"}"><span>${result?.passed ? "✓" : "!"}</span><div><strong>${escapeHTML(check.title)}</strong><p>${escapeHTML(result?.passed ? check.detail : result?.detail || "This check did not finish. Reset test data and run it again.")}</p></div><b>${stateLabel}</b></article>`;
    }).join("")
    : "";

  $("#test-checklist").innerHTML = TEST_STEPS.map((step, index) => {
    const completed = Boolean(state.testProgress[step.id]);
    return `<article class="test-step ${completed ? "is-complete" : ""}"><span class="test-step-number">${String(index + 1).padStart(2, "0")}</span><div class="test-step-copy"><h4>${escapeHTML(step.title)}</h4><p>${escapeHTML(step.copy)}</p><small><strong>Check:</strong> ${escapeHTML(step.expected)}</small></div><div class="test-step-actions"><button type="button" class="outline-button" data-test-action="${escapeHTML(step.action)}">${escapeHTML(step.actionLabel)}</button><button type="button" class="test-mark-button" data-mark-test="${escapeHTML(step.id)}">${completed ? "Checked · undo" : "Mark checked"}</button></div></article>`;
  }).join("");
  $$('[data-test-action]').forEach((button) => button.addEventListener("click", () => runTestAction(button.dataset.testAction)));
  $$('[data-mark-test]').forEach((button) => button.addEventListener("click", () => toggleTestStep(button.dataset.markTest)));
}

function runQuickChecks() {
  if (!TEST_MODE) return;
  state.quickChecks = {};
  QUICK_CHECKS.forEach((check) => {
    try {
      state.quickChecks[check.id] = { passed: Boolean(check.run()) };
    } catch {
      state.quickChecks[check.id] = { passed: false, detail: "The browser could not complete this check." };
    }
  });
  renderTestHarness();
}

function toggleTestStep(id) {
  if (!TEST_MODE || !TEST_STEPS.some((step) => step.id === id)) return;
  state.testProgress[id] = !state.testProgress[id];
  storage.set("mvp-test-progress", JSON.stringify(state.testProgress));
  renderTestHarness();
}

function focusAfterRender(selector) {
  window.requestAnimationFrame(() => {
    const target = $(selector);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.focus?.({ preventScroll: true });
  });
}

function runTestAction(action) {
  if (!TEST_MODE) return;
  if (action === "portfolio") {
    state.query = "";
    setActiveView("manager");
    $("#proposal-search").value = "";
    focusAfterRender("#proposal-search");
    return;
  }
  if (action === "proposal") {
    setActiveView("proposer");
    focusAfterRender('#proposal-form input[name="title"]');
    return;
  }
  if (action === "review") {
    setActiveView("reviewer");
    focusAfterRender('[data-review-queue-id="test-awaiting-review"]');
    return;
  }
  if (action === "rationale") {
    state.query = "Security Pilot";
    state.selectedId = "test-security-pilot";
    setActiveView("manager");
    $("#proposal-search").value = state.query;
    renderResults();
    renderDetail();
    focusAfterRender("#proposal-detail");
    return;
  }
  if (action === "comparison" || action === "constraints") {
    const ids = action === "comparison"
      ? ["test-service-hub", "test-accessibility-update"]
      : ["test-service-hub", "test-accessibility-update", "test-security-pilot"];
    state.compared = new Set(ids);
    state.selectedId = ids[0];
    state.query = "";
    setActiveView("manager");
    $("#proposal-search").value = "";
    focusAfterRender(action === "comparison" ? "#open-compare" : "#scenario-title");
    return;
  }
  if (action === "decision") {
    const testIds = ["test-service-hub", "test-accessibility-update"];
    state.compared = new Set(testIds);
    testIds.forEach((id) => state.shortlisted.add(id));
    persistFormalShortlist();
    state.scenarios.A = { projectIds: testIds, budget: organisation.budget, staff: organisation.staff };
    storage.set(STORAGE.scenarios, JSON.stringify(state.scenarios));
    state.selectedId = "test-service-hub";
    state.query = "";
    setActiveView("manager");
    $("#proposal-search").value = "";
    focusAfterRender('[data-decision="Approved"]');
  }
}

function openTestMode() {
  if (TEST_MODE) {
    setActiveView("tests");
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set("mvpTest", "1");
  url.hash = "workspace";
  window.location.assign(url.toString());
}

function resetTestData() {
  if (!TEST_MODE) return;
  const testKeys = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith(TEST_PREFIX)) testKeys.push(key);
  }
  testKeys.forEach((key) => window.sessionStorage.removeItem(key));
  window.location.reload();
}

function configureTestMode() {
  const exitUrl = new URL(window.location.href);
  exitUrl.searchParams.delete("mvpTest");
  exitUrl.hash = "workspace";
  $("#exit-test-mode").href = exitUrl.toString();
  $("#test-mode-banner").hidden = !TEST_MODE;
}

function saveOrganisation(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const objectives = uniqueObjectives(objectiveDraftValues());
  if (!objectives.length) {
    $("#organisation-message").textContent = "Add at least one strategic objective.";
    $("#objective-input-list input")?.focus();
    return;
  }
  const resources = resourceDraftValues();
  const resourceError = validateResourceDraft(resources);
  if (resourceError) {
    $("#resource-capacity-message").textContent = resourceError;
    return;
  }
  const totalStaff = totalAvailableStaff(resources, organisation.staff);
  const legacyResources = organisation.resources.filter((resource) => !isFixedResourceName(resource.name));
  const fixedResources = resources.filter((resource) => resource.fte !== null);
  organisation = normaliseOrganisation({
    name: $("#org-name").value.trim(),
    startDate: $("#org-start-date").value,
    endDate: $("#org-end-date").value,
    businessUnit: $("#org-business-unit").value.trim(),
    planningHorizon: $("#org-planning-horizon").value.trim(),
    objectives,
    budget: numberOr($("#org-budget").value, DEFAULT_ORGANISATION.budget),
    resources: [...fixedResources, ...legacyResources],
    staff: totalStaff
  });
  storage.set(STORAGE.organisation, JSON.stringify(organisation));
  renderOrganisationForm();
  populateObjectives();
  renderAll();
  $("#organisation-message").textContent = "Organisation setup saved in this browser.";
}

function submitProposal(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const title = String(values.get("title") || "").trim();
  const id = `proposal-${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "project"}`;
  const proposal = normaliseProposal({
    id,
    title,
    owner: String(values.get("owner") || "").trim(),
    category: "IT project",
    objective: String(values.get("objective") || "").trim(),
    duration: String(values.get("duration") || "").trim(),
    cost: Number(values.get("cost")),
    staff: Number(values.get("staff")),
    status: "Submitted",
    summary: String(values.get("summary") || "").trim(),
    benefits: String(values.get("benefits") || "").trim(),
    risks: String(values.get("risks") || "").trim(),
    scores: {},
    rationales: {},
    missing: [],
    isCustom: true,
    scenarioGroup: ""
  });
  proposals.unshift(proposal);
  state.selectedId = proposal.id;
  persistCustomProposals();
  form.reset();
  populateObjectives();
  renderAll();
  $("#proposal-form-message").textContent = "Proposal submitted. It is now in the reviewer queue.";
  setActiveView("reviewer");
}

function accountId() {
  if (window.crypto?.randomUUID) return `account-${window.crypto.randomUUID()}`;
  return `account-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function activeAccount() {
  return state.accounts.find((account) => account.id === state.activeAccountId) || null;
}

function persistAccounts() {
  storage.set(STORAGE.accounts, JSON.stringify(state.accounts));
  if (state.activeAccountId) storage.set(STORAGE.activeAccount, JSON.stringify(state.activeAccountId));
  else storage.remove(STORAGE.activeAccount);
}

function renderSidebarAccountSummary() {
  const container = $("#sidebar-account-summary");
  if (!container) return;
  const account = activeAccount();
  container.innerHTML = account
    ? `<span>Signed in as</span><strong>${escapeHTML(account.displayName)}</strong><small>${escapeHTML(account.role)}</small>`
    : '<span>Account</span><strong>Not signed in</strong><small>Use the profile menu above</small>';
}

function renderAccountWorkspace() {
  const currentContainer = $("#current-account-summary");
  if (!currentContainer) return;
  const sharedAccount = Boolean(window.PPMAuth?.apiBase());
  const current = activeAccount();
  currentContainer.innerHTML = current
    ? `<div class="current-account-card"><span class="account-status">${sharedAccount ? "Shared PPM account" : "Signed in on this browser"}</span><strong>${escapeHTML(current.displayName)}</strong><p>${escapeHTML(current.role)}</p><small>Use the profile circle above to manage this session.</small></div>`
    : `<div class="account-empty"><strong>You are not signed in</strong><p>${sharedAccount ? "Sign in to your shared PPM account from this device." : "Create a local prototype account or sign in from this browser."}</p><a class="outline-button" href="./login.html?mode=signup&amp;return=workplace.html">${sharedAccount ? "Create or sign in" : "Create an account"}</a></div>`;
  const storageSubtitle = $("#account-storage-subtitle");
  const storageSummary = $("#account-storage-summary");
  if (sharedAccount) {
    if (storageSubtitle) storageSubtitle.textContent = "Shared sign-in is connected";
    if (storageSummary) storageSummary.innerHTML = "<p>Account names and sign-in credentials are verified by the shared service. You can use the same account from another device. Proposal, review, and portfolio data are still stored in this browser.</p>";
  } else {
    if (storageSubtitle) storageSubtitle.textContent = "No shared account service is configured";
    if (storageSummary) storageSummary.innerHTML = '<p>Until a shared account service is connected, accounts are saved in this browser only. Project and portfolio information is also stored in this browser.</p><a class="outline-button" href="./login.html?mode=signup&amp;return=workplace.html">Create an account</a>';
  }
  renderSidebarAccountSummary();
}

function saveAccount(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const displayName = String(values.get("displayName") || "").trim();
  const role = String(values.get("accountRole") || "");
  if (!displayName || !ACCOUNT_ROLES.includes(role)) return;

  const editingIndex = state.accounts.findIndex((account) => account.id === state.editingAccountId);
  let saved;
  if (editingIndex >= 0) {
    saved = { ...state.accounts[editingIndex], displayName, role };
    state.accounts.splice(editingIndex, 1, saved);
  } else {
    const existing = state.accounts.find((account) => account.displayName.toLocaleLowerCase() === displayName.toLocaleLowerCase() && account.role === role);
    saved = existing || { id: accountId(), displayName, role, createdAt: new Date().toISOString() };
    if (!existing) state.accounts.push(saved);
  }
  state.activeAccountId = saved.id;
  state.editingAccountId = saved.id;
  persistAccounts();
  renderAccountWorkspace();
  setActiveView("organisation");
}

function prepareNewAccount() {
  state.editingAccountId = "";
  const form = $("#account-form");
  form?.reset();
  $("#account-message").textContent = "Enter another browser-only profile. Existing accounts and portfolio data will remain saved.";
  $("#account-display-name")?.focus();
}

function renderAll() {
  renderSidebarAccountSummary();
  renderOrganisationForm();
  populateObjectives();
  renderSummary();
  renderResults();
  renderScenario();
  renderDetail();
  renderReviewQueue();
  renderShortlistWorkspace();
  renderCriterionInsights();
  renderTestHarness();
}

function bindEvents() {
  $("#organisation-form").addEventListener("submit", saveOrganisation);
  $("#add-objective").addEventListener("click", () => renderObjectiveInputs([...objectiveDraftValues(), ""]));
  $("#proposal-form").addEventListener("submit", submitProposal);
  $("#open-test-mode").addEventListener("click", openTestMode);
  $("#reset-test-data").addEventListener("click", resetTestData);
  $("#run-quick-checks").addEventListener("click", runQuickChecks);
  $$('[data-workspace-view-button]').forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.workspaceViewButton === "manager") state.selectedId = null;
    setActiveView(button.dataset.workspaceViewButton);
  }));
  $("#proposal-search").addEventListener("input", (event) => { state.query = event.target.value; renderResults(); });
  $("#objective-filter").addEventListener("change", (event) => { state.objective = event.target.value; renderResults(); });
  $("#feasibility-filter").addEventListener("change", (event) => { state.feasibility = Number(event.target.value); renderResults(); });
  $("#risk-filter").addEventListener("change", (event) => { state.risk = Number(event.target.value); renderResults(); });
  $("#cost-filter").addEventListener("change", (event) => { state.cost = event.target.value; renderResults(); });
  $("#status-filter").addEventListener("change", (event) => { state.status = event.target.value; renderResults(); });
  $("#sort-select").addEventListener("change", (event) => { state.sort = event.target.value; renderResults(); });
  $("#clear-compare").addEventListener("click", () => { state.compared.clear(); renderAll(); });
  $("#open-compare").addEventListener("click", openComparison);
  $$('[data-open-comparison]').forEach((button) => button.addEventListener("click", () => setActiveView("comparison")));
  $$('[data-open-shortlist]').forEach((button) => button.addEventListener("click", () => setActiveView("shortlist")));
  $$('[data-open-insights]').forEach((button) => button.addEventListener("click", () => setActiveView("insights")));
  $$('[data-open-scenarios]').forEach((button) => button.addEventListener("click", () => setActiveView("scenarios")));
  $$('[data-open-organisation]').forEach((button) => button.addEventListener("click", () => setActiveView("organisation")));
  $("[data-close-dialog]").addEventListener("click", () => compareDialog.close());
  $("[data-close-review]").addEventListener("click", () => reviewDialog.close());
  $("#save-note").addEventListener("click", saveReview);
  [compareDialog, reviewDialog].forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      state.selectedId = null;
      setActiveView("manager");
      $("#proposal-search").focus();
    }
  });
}

loadStoredEvaluations();
configureTestMode();
bindEvents();
renderAll();
setActiveView(TEST_MODE ? "tests" : "manager");

document.body.classList.add("js-ready");
const revealGroups = $$(".reveal-group");
const revealItems = $$(".reveal").filter((item) => !item.closest(".reveal-group"));
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      entry.target.querySelectorAll?.(".reveal").forEach((item) => item.classList.add("is-visible"));
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6%" });
  revealGroups.forEach((group) => revealObserver.observe(group));
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  [...revealGroups, ...revealItems].forEach((item) => item.classList.add("is-visible"));
}


function scenarioSummary(scenario) {
  const ids = Array.isArray(scenario && scenario.projectIds) ? scenario.projectIds : [];
  const projects = proposals.filter((proposal) => ids.includes(proposal.id) && isEvaluated(proposal));
  const budget = Math.max(0, numberOr(scenario && scenario.budget, organisation.budget));
  const staff = Math.max(0, numberOr(scenario && scenario.staff, organisation.staff));
  return { projects, budget, staff, ...calculateScenario(projects, budget, staff) };
}

function scenarioDisplayName(name) {
  const value = String(name || "").trim();
  return /^[A-Z]$/i.test(value) ? `Scenario ${value.toUpperCase()}` : value;
}

function scenarioNameExists(candidate, exceptName = "") {
  const displayCandidate = scenarioDisplayName(candidate).toLocaleLowerCase();
  return Object.keys(state.scenarios || {}).some((name) => name !== exceptName && scenarioDisplayName(name).toLocaleLowerCase() === displayCandidate);
}

function renderShortlistWorkspace() {
  const workspace = $("#shortlist-workspace");
  if (!workspace) return;
  const shortlisted = shortlistedProposals();
  const cards = shortlisted.map((proposal) => '<article class="shortlist-project-card is-selected"><div><span class="objective-tag">' + escapeHTML(proposal.objective) + '</span><h4>' + escapeHTML(proposal.title) + '</h4><p>' + escapeHTML(proposal.owner) + ' · ' + money(proposal.cost) + ' · ' + proposal.staff + ' FTE</p></div>' + assessmentProfile(proposal) + '<button type="button" class="text-button" data-remove-formal-shortlist="' + escapeHTML(proposal.id) + '">Remove from Shortlist</button></article>').join("");
  workspace.innerHTML = '<section class="shortlist-summary"><div><p class="section-kicker">Formal Shortlist</p><h4>' + shortlisted.length + ' project' + (shortlisted.length === 1 ? '' : 's') + ' retained</h4><p>Projects are added manually after comparison. This saved list has no four-project limit.</p></div><div><button type="button" class="solid-button" data-shortlist-open-builder>Build Candidate Portfolio</button><button type="button" class="outline-button" data-shortlist-open-comparison>Open Comparison</button></div></section>' + (cards ? '<div class="shortlist-project-grid">' + cards + '</div>' : '<div class="workspace-empty"><p class="section-kicker">Formal Shortlist</p><h4>No projects have been shortlisted yet.</h4><p>Compare two to four evaluated proposals, then manually add suitable projects here.</p><button type="button" class="solid-button" data-shortlist-open-comparison>Open Comparison</button><button type="button" class="text-button" data-shortlist-back-overview>Go to Project Overview</button></div>');
  workspace.querySelectorAll('[data-remove-formal-shortlist]').forEach((button) => button.addEventListener("click", () => toggleFormalShortlist(button.dataset.removeFormalShortlist, false)));
  workspace.querySelectorAll('[data-shortlist-open-comparison]').forEach((button) => button.addEventListener("click", () => setActiveView("comparison")));
  workspace.querySelector('[data-shortlist-open-builder]')?.addEventListener("click", () => setActiveView("scenarios"));
  workspace.querySelector('[data-shortlist-back-overview]')?.addEventListener("click", () => setActiveView("manager"));
}

function renderCriterionInsights() {
  const workspace = $("#insights-workspace");
  if (!workspace) return;
  const evaluated = proposals.filter(isEvaluated);
  if (!evaluated.length) {
    workspace.innerHTML = '<div class="workspace-empty"><p class="section-kicker">Criterion Insights</p><h4>No completed evaluation yet.</h4><p>Complete all five 1–5 ratings and reviewer rationales before viewing criterion insights.</p><button type="button" class="solid-button" data-insights-open-evaluation>Open Project Evaluation</button><button type="button" class="text-button" data-insights-back-overview>Back to Project Overview</button></div>';
    workspace.querySelector('[data-insights-open-evaluation]').addEventListener("click", () => setActiveView("reviewer"));
    workspace.querySelector('[data-insights-back-overview]').addEventListener("click", () => setActiveView("manager"));
    return;
  }
  const proposal = evaluated.find((item) => item.id === state.selectedId) || evaluated[0];
  workspace.innerHTML = '<div class="insights-toolbar"><label>Project<select id="criterion-insights-project">' + evaluated.map((item) => '<option value="' + escapeHTML(item.id) + '" ' + (item.id === proposal.id ? 'selected' : '') + '>' + escapeHTML(item.title) + '</option>').join("") + '</select></label><button type="button" class="outline-button" data-insights-back-overview>Back to Project Overview</button></div><section class="criterion-insights-summary"><div><p class="section-kicker">Project evidence</p><h4>' + escapeHTML(proposal.title) + '</h4><p>' + escapeHTML(proposal.summary) + '</p></div><div class="single-radar">' + radarSVG([proposal]) + '</div></section><div class="criterion-insights-list">' + CRITERIA.map((criterion) => '<article><header><h4>' + escapeHTML(criterion.label) + '</h4><strong>' + proposal.scores[criterion.key] + '/5</strong></header><p>' + escapeHTML(proposal.rationales[criterion.key]) + '</p></article>').join("") + '</div>';
  workspace.querySelector('#criterion-insights-project').addEventListener("change", (event) => { state.selectedId = event.target.value; renderCriterionInsights(); });
  workspace.querySelector('[data-insights-back-overview]').addEventListener("click", () => setActiveView("manager"));
}

function renderComparisonWorkspace() {
  const workspace = $("#comparison-workspace");
  if (!workspace) return;
  const selected = selectedProposals();
  if (selected.length < 2) {
    workspace.innerHTML = '<div class="workspace-empty"><p class="section-kicker">Comparison selection</p><h4>' + (selected.length || "No") + ' project' + (selected.length === 1 ? "" : "s") + ' selected</h4><p>Select two to four fully evaluated proposals in Project Overview before opening the radar comparison.</p><button type="button" class="solid-button" data-open-overview>Go to Project Overview</button><button type="button" class="text-button" data-open-shortlist>View formal Shortlist</button></div>';
    workspace.querySelector("[data-open-shortlist]").addEventListener("click", () => setActiveView("shortlist"));
    workspace.querySelector("[data-open-overview]").addEventListener("click", () => setActiveView("manager"));
    return;
  }
  const cards = selected.map((proposal) => '<article><span class="objective-tag">' + escapeHTML(proposal.objective) + '</span><h4>' + escapeHTML(proposal.title) + '</h4><p>' + money(proposal.cost) + ' · ' + proposal.staff + ' FTE · ' + scenarioLink(proposal) + '</p><div class="comparison-card-actions"><button type="button" class="comparison-shortlist-action ' + (state.shortlisted.has(proposal.id) ? 'is-added' : '') + '" data-add-formal-shortlist="' + escapeHTML(proposal.id) + '" ' + (state.shortlisted.has(proposal.id) ? 'disabled' : '') + '>' + (state.shortlisted.has(proposal.id) ? 'In Shortlist' : 'Add to Shortlist') + '</button><button type="button" data-remove-comparison-project="' + escapeHTML(proposal.id) + '">Remove from comparison</button></div></article>').join("");
  const strengths = CRITERIA.map((criterion) => {
    const highest = Math.max(...selected.map((proposal) => Number(proposal.scores[criterion.key])));
    const names = selected.filter((proposal) => Number(proposal.scores[criterion.key]) === highest).map((proposal) => proposal.title).join(", ");
    return '<li><span>' + escapeHTML(criterion.short) + '</span><strong>' + escapeHTML(names) + ' · ' + highest + '/5</strong></li>';
  }).join("");
  const legend = selected.map((proposal, index) => '<span><i class="legend-colour-' + index + '"></i>' + escapeHTML(proposal.title) + '</span>').join("");
  const header = CRITERIA.map((criterion) => '<th>' + escapeHTML(criterion.short) + '</th>').join("");
  const rows = selected.map((proposal) => '<tr><th>' + escapeHTML(proposal.title) + '</th>' + CRITERIA.map((criterion) => '<td><span class="score-cell ' + scoreClass(proposal.scores[criterion.key]) + '">' + proposal.scores[criterion.key] + '</span></td>').join("") + '<td>' + money(proposal.cost) + '</td><td>' + proposal.staff + ' FTE</td><td>' + scenarioLink(proposal) + '</td></tr>').join("");
  workspace.innerHTML = '<div class="comparison-selected-strip">' + cards + '</div><div class="comparison-stage"><section class="comparison-radar-panel"><div class="comparison-panel-heading"><p class="section-kicker">Five-criterion profile</p><strong>Overlay view</strong></div><div class="workspace-radar">' + radarSVG(selected) + '</div><div class="workspace-legend">' + legend + '</div></section><aside class="comparison-tradeoffs"><p class="section-kicker">Recorded strengths</p><h4>Read the trade-offs, not a winner.</h4><p>The chart helps the Portfolio Manager discuss the highest recorded ratings, cost, resource limits, and reviewer evidence.</p><ul>' + strengths + '</ul><button type="button" class="outline-button" data-open-shortlist>View formal Shortlist</button></aside></div><div class="comparison-score-table"><div class="comparison-panel-heading"><p class="section-kicker">Side-by-side detail</p><div><button type="button" class="text-button" data-open-overview>Change comparison selection</button><button type="button" class="text-button" data-open-shortlist>View formal Shortlist</button></div></div><div class="comparison-table-wrap"><table class="comparison-table"><thead><tr><th>Project</th>' + header + '<th>Cost</th><th>Staff</th><th>Scenario</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  workspace.querySelectorAll("[data-add-formal-shortlist]").forEach((button) => button.addEventListener("click", () => toggleFormalShortlist(button.dataset.addFormalShortlist, true)));
  workspace.querySelectorAll("[data-remove-comparison-project]").forEach((button) => button.addEventListener("click", () => toggleComparisonSelection(button.dataset.removeComparisonProject, false)));
  workspace.querySelectorAll("[data-open-overview]").forEach((button) => button.addEventListener("click", () => setActiveView("manager")));
  workspace.querySelectorAll("[data-open-shortlist]").forEach((button) => button.addEventListener("click", () => setActiveView("shortlist")));
  workspace.querySelectorAll("[data-open-project-scenario]").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    const name = link.dataset.openProjectScenario;
    setActiveView("scenarios");
    requestAnimationFrame(() => document.querySelector(`[data-scenario-card="${name}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }));
}

function renderScenarioWorkspace() {
  const workspace = $("#scenario-workspace");
  if (!workspace) return;
  const scenarioNames = Object.keys(state.scenarios || {});
  if (!scenarioNames.length) {
    state.scenarios = structuredClone(DEFAULT_SCENARIOS);
    ensureScenarioIdentifiers();
    scenarioNames.push(...Object.keys(state.scenarios));
  }
  if (!scenarioNames.includes(state.activeScenarioName)) state.activeScenarioName = scenarioNames[0];

  const name = state.activeScenarioName;
  const scenario = state.scenarios[name] || { projectIds: [], budget: organisation.budget, staff: organisation.staff };
  const summary = scenarioSummary({ ...scenario, budget: organisation.budget, staff: organisation.staff });
  const selectedIds = new Set(summary.projects.map((proposal) => proposal.id));
  const available = shortlistedProposals().filter((proposal) => !selectedIds.has(proposal.id));
  const costRemaining = summary.budget - summary.totalCost;
  const staffRemaining = summary.staff - summary.totalStaff;
  const displayName = scenarioDisplayName(name);
  const isProtectedScenario = name === 'A' || name === 'B';
  const tabs = scenarioNames.map((scenarioName) => '<button type="button" class="' + (scenarioName === name ? 'is-active' : '') + '" data-edit-scenario="' + escapeHTML(scenarioName) + '" aria-pressed="' + (scenarioName === name) + '">' + escapeHTML(scenarioDisplayName(scenarioName)) + '</button>').join("");
  const availableCards = available.map((proposal) => '<article class="scenario-project-card"><div><h4>' + escapeHTML(proposal.title) + '</h4><span class="objective-tag">' + escapeHTML(proposal.objective) + '</span><p>' + money(proposal.cost) + ' · ' + proposal.staff + ' FTE</p></div><button type="button" class="solid-button" data-add-to-scenario="' + escapeHTML(proposal.id) + '">Add</button></article>').join("") || '<div class="scenario-column-empty"><strong>No available shortlisted projects.</strong><p>Add evaluated projects on the Shortlist page, or all currently shortlisted projects are already in this scenario.</p><button type="button" class="text-button" data-scenario-open-shortlist>Open Shortlist</button></div>';
  const currentCards = summary.projects.map((proposal) => '<article class="scenario-project-card"><div><h4>' + escapeHTML(proposal.title) + '</h4><span class="objective-tag">' + escapeHTML(proposal.objective) + '</span><p>' + money(proposal.cost) + ' · ' + proposal.staff + ' FTE</p></div><button type="button" class="text-button" data-remove-from-scenario="' + escapeHTML(proposal.id) + '">Remove</button></article>').join("") || '<div class="scenario-column-empty"><strong>' + escapeHTML(displayName) + ' is empty.</strong><p>Add a project from the saved formal Shortlist.</p></div>';
  const constraintClass = summary.budgetOk && summary.staffOk ? 'is-feasible' : 'is-warning';

  workspace.innerHTML = '<div class="scenario-builder-toolbar"><div class="scenario-editor-tabs" aria-label="Choose a scenario">' + tabs + '<button type="button" class="scenario-new-button" data-create-scenario>+ New Scenario</button></div><div class="scenario-toolbar-actions">' + (isProtectedScenario ? '' : '<button type="button" class="text-button" data-rename-active-scenario>Rename</button><button type="button" class="text-button scenario-delete-button" data-delete-active-scenario>Delete</button>') + '<button type="button" class="outline-button" data-save-active-scenario>Save ' + escapeHTML(displayName) + '</button><button type="button" class="solid-button" data-open-portfolio-review>Proceed to Portfolio Review</button></div></div><p class="scenario-data-note"><strong>Candidate source:</strong> the saved formal Shortlist. Existing scenario projects remain available even if they are not currently shortlisted.</p><div class="scenario-builder-grid"><section class="scenario-builder-column"><header><p class="section-kicker">Available shortlisted projects</p><h4>' + available.length + ' available</h4></header><div class="scenario-project-list">' + availableCards + '</div></section><section class="scenario-builder-column"><header><p class="section-kicker">Currently editing</p><h4>' + escapeHTML(displayName) + '</h4><span>' + summary.projects.length + ' project' + (summary.projects.length === 1 ? '' : 's') + ' included</span></header><div class="scenario-project-list">' + currentCards + '</div></section><aside class="scenario-summary-panel ' + constraintClass + '"><header><p class="section-kicker">Scenario summary</p><h4>' + (summary.budgetOk && summary.staffOk ? 'Within limits' : 'Constraints exceeded') + '</h4></header><div class="scenario-summary-metric"><span>Budget usage</span><strong>' + money(summary.totalCost) + ' <small>of ' + money(summary.budget) + '</small></strong><div class="scenario-meter"><i style="width:' + Math.min(summary.budget ? summary.totalCost / summary.budget * 100 : summary.totalCost ? 100 : 0, 100) + '%"></i></div><p class="' + (summary.budgetOk ? 'check-ok' : 'check-warning') + '">' + (summary.budgetOk ? money(Math.max(0, costRemaining)) + ' remaining' : money(Math.abs(costRemaining)) + ' over budget') + '</p></div><div class="scenario-summary-metric"><span>Total staff capacity</span><strong>' + summary.totalStaff + ' FTE <small>of ' + summary.staff + ' FTE</small></strong><div class="scenario-meter"><i style="width:' + Math.min(summary.staff ? summary.totalStaff / summary.staff * 100 : summary.totalStaff ? 100 : 0, 100) + '%"></i></div><p class="' + (summary.staffOk ? 'check-ok' : 'check-warning') + '">' + (summary.staffOk ? Math.max(0, staffRemaining) + ' FTE remaining' : Math.abs(staffRemaining) + ' FTE over capacity') + '</p></div><div class="scenario-constraint-summary"><strong>' + (summary.budgetOk && summary.staffOk ? 'Feasible candidate' : 'Needs revision') + '</strong><p>' + (summary.budgetOk && summary.staffOk ? 'The current scenario is within the saved budget and total FTE limits.' : (!summary.budgetOk ? 'The investment budget is exceeded. ' : '') + (!summary.staffOk ? 'The total staff capacity is exceeded.' : '')) + '</p></div><small class="scenario-capacity-note">Projects currently provide total FTE only. No resource-type usage is inferred.</small></aside></div>';

  workspace.querySelectorAll('[data-edit-scenario]').forEach((button) => button.addEventListener('click', () => { state.activeScenarioName = button.dataset.editScenario; renderScenarioWorkspace(); }));
  workspace.querySelector('[data-create-scenario]')?.addEventListener('click', createScenario);
  workspace.querySelector('[data-rename-active-scenario]')?.addEventListener('click', renameActiveScenario);
  workspace.querySelector('[data-delete-active-scenario]')?.addEventListener('click', deleteActiveScenario);
  workspace.querySelectorAll('[data-add-to-scenario]').forEach((button) => button.addEventListener('click', () => updateActiveScenarioProject(button.dataset.addToScenario, true)));
  workspace.querySelectorAll('[data-remove-from-scenario]').forEach((button) => button.addEventListener('click', () => updateActiveScenarioProject(button.dataset.removeFromScenario, false)));
  workspace.querySelector('[data-save-active-scenario]')?.addEventListener('click', saveActiveScenario);
  workspace.querySelector('[data-scenario-open-shortlist]')?.addEventListener('click', () => setActiveView('shortlist'));
  workspace.querySelector('[data-open-portfolio-review]')?.addEventListener('click', () => {
    state.portfolioReviewScenarioName = state.activeScenarioName;
    setActiveView('reports');
  });
}

function requestedScenarioName(message, initialValue = '') {
  const entered = window.prompt(message, initialValue);
  if (entered === null) return null;
  const name = entered.trim().replace(/\s+/g, ' ');
  if (!name) {
    window.alert('Enter a scenario name.');
    return null;
  }
  return name;
}

function createScenario() {
  const name = requestedScenarioName('Name the new candidate portfolio scenario:', 'Scenario C');
  if (!name) return;
  if (scenarioNameExists(name)) {
    window.alert('A scenario with this name already exists.');
    return;
  }
  state.scenarios[name] = { id: `${scenarioIdentifierForName(name)}-${Date.now().toString(36)}`, projectIds: [], budget: organisation.budget, staff: organisation.staff };
  state.activeScenarioName = name;
  storage.set(STORAGE.scenarios, JSON.stringify(state.scenarios));
  renderScenarioWorkspace();
}

function renameActiveScenario() {
  const oldName = state.activeScenarioName;
  if (oldName === 'A' || oldName === 'B') return;
  const name = requestedScenarioName('Rename this candidate portfolio scenario:', scenarioDisplayName(oldName));
  if (!name || name === oldName) return;
  if (scenarioNameExists(name, oldName)) {
    window.alert('A scenario with this name already exists.');
    return;
  }
  const renamedScenarios = {};
  Object.entries(state.scenarios).forEach(([scenarioName, scenario]) => {
    renamedScenarios[scenarioName === oldName ? name : scenarioName] = scenario;
  });
  state.scenarios = renamedScenarios;
  state.activeScenarioName = name;
  Object.values(state.decisions).forEach((record) => {
    if (record?.scenario === oldName) record.scenario = name;
  });
  storage.set(STORAGE.scenarios, JSON.stringify(state.scenarios));
  storage.set(STORAGE.decisions, JSON.stringify(state.decisions));
  renderScenarioWorkspace();
}

function deleteActiveScenario() {
  const name = state.activeScenarioName;
  if (name === 'A' || name === 'B') return;
  if (!window.confirm(`Delete “${scenarioDisplayName(name)}”? Projects, shortlist selections, and other scenarios will not be deleted.`)) return;
  delete state.scenarios[name];
  state.activeScenarioName = Object.keys(state.scenarios)[0] || 'A';
  storage.set(STORAGE.scenarios, JSON.stringify(state.scenarios));
  renderScenarioWorkspace();
}

function updateActiveScenarioProject(projectId, shouldAdd) {
  const name = state.activeScenarioName;
  const current = state.scenarios[name] || { projectIds: [], budget: organisation.budget, staff: organisation.staff };
  const ids = new Set(Array.isArray(current.projectIds) ? current.projectIds : []);
  const proposal = proposals.find((item) => item.id === projectId);
  if (shouldAdd) {
    if (!proposal || !state.shortlisted.has(projectId) || !isEvaluated(proposal)) return;
    ids.add(projectId);
  } else {
    ids.delete(projectId);
  }
  state.scenarios[name] = { ...current, projectIds: [...ids], budget: organisation.budget, staff: organisation.staff };
  storage.set(STORAGE.scenarios, JSON.stringify(state.scenarios));
  renderScenarioWorkspace();
}

function saveActiveScenario() {
  storage.set(STORAGE.scenarios, JSON.stringify(state.scenarios));
  const button = $('#scenario-workspace [data-save-active-scenario]');
  if (!button) return;
  const original = button.textContent;
  button.textContent = 'Saved';
  window.setTimeout(() => { if (button.isConnected) button.textContent = original; }, 1200);
}

function renderDecisionWorkspace() {
  const workspace = $("#decision-workspace");
  if (!workspace) return;
  ensureScenarioIdentifiers();
  const entries = Object.entries(state.scenarios || {});
  if (!entries.length) {
    workspace.innerHTML = '<div class="workspace-empty"><p class="section-kicker">Portfolio Decision</p><h4>No saved scenarios.</h4><p>Build and review a candidate portfolio before recording a scenario-level decision.</p><button type="button" class="solid-button" data-decision-open-builder>Build Candidate Portfolio</button></div>';
    workspace.querySelector('[data-decision-open-builder]').addEventListener('click', () => setActiveView('scenarios'));
    return;
  }

  if (!entries.some(([, scenario]) => scenario.id === state.decisionScenarioId)) {
    const reviewScenario = state.scenarios[state.portfolioReviewScenarioName];
    state.decisionScenarioId = reviewScenario?.id || entries[0][1].id;
  }
  const selectedEntry = entries.find(([, scenario]) => scenario.id === state.decisionScenarioId) || entries[0];
  const [selectedName, selectedScenario] = selectedEntry;
  const summary = scenarioSummary({ ...selectedScenario, budget: organisation.budget, staff: organisation.staff });
  const options = entries.map(([name, scenario]) => '<option value="' + escapeHTML(scenario.id) + '" ' + (scenario.id === selectedScenario.id ? 'selected' : '') + '>' + escapeHTML(scenarioDisplayName(name)) + '</option>').join('');

  if (!summary.projects.length) {
    workspace.innerHTML = '<div class="portfolio-decision-selector"><label><span>Selected Scenario</span><select id="decision-scenario-select">' + options + '</select></label><div><button type="button" class="outline-button" data-decision-open-review>Return to Portfolio Review</button><button type="button" class="solid-button" data-decision-open-builder>Build Candidate Portfolio</button></div></div><div class="workspace-empty portfolio-decision-empty"><p class="section-kicker">' + escapeHTML(scenarioDisplayName(selectedName)) + '</p><h4>This scenario has no projects.</h4><p>Add projects and review the candidate portfolio before recording a decision.</p></div>';
    workspace.querySelector('#decision-scenario-select').addEventListener('change', (event) => { state.decisionScenarioId = event.target.value; renderDecisionWorkspace(); });
    workspace.querySelector('[data-decision-open-review]').addEventListener('click', () => { state.portfolioReviewScenarioName = selectedName; setActiveView('reports'); });
    workspace.querySelector('[data-decision-open-builder]').addEventListener('click', () => { state.activeScenarioName = selectedName; setActiveView('scenarios'); });
    return;
  }

  const budgetRemaining = organisation.budget - summary.totalCost;
  const staffRemaining = organisation.staff - summary.totalStaff;
  const objectives = [...new Set(summary.projects.map((proposal) => proposal.objective).filter(Boolean))];
  const records = Array.isArray(state.scenarioDecisions[selectedScenario.id]) ? state.scenarioDecisions[selectedScenario.id] : [];
  const history = [...records].reverse().map((record, index) => '<article class="scenario-decision-record"><header><div><span class="status-pill status-' + escapeHTML(String(record.outcome).toLowerCase()) + '">' + escapeHTML(record.outcome) + '</span><strong>' + escapeHTML(index === 0 ? 'Latest record' : 'Earlier record') + '</strong></div><time datetime="' + escapeHTML(record.recordedAt) + '">' + escapeHTML(new Date(record.recordedAt).toLocaleString('en-AU')) + '</time></header><p>' + escapeHTML(record.rationale) + '</p>' + (record.actions?.length ? '<ul>' + record.actions.map((action) => '<li><span>' + escapeHTML(action.text) + '</span>' + (action.dueDate ? '<time datetime="' + escapeHTML(action.dueDate) + '">Due ' + escapeHTML(action.dueDate) + '</time>' : '') + '</li>').join('') + '</ul>' : '<small>No follow-up actions recorded.</small>') + '<footer>Recorded for ' + escapeHTML(record.scenarioName || scenarioDisplayName(selectedName)) + '</footer></article>').join('') || '<div class="scenario-decision-no-history"><strong>No scenario-level decision recorded yet.</strong><p>Select an outcome and provide a rationale. The system will not choose an outcome for you.</p></div>';
  const comparison = entries.filter(([, scenario]) => scenario.id !== selectedScenario.id).map(([name, scenario]) => {
    const item = scenarioSummary({ ...scenario, budget: organisation.budget, staff: organisation.staff });
    return '<li><strong>' + escapeHTML(scenarioDisplayName(name)) + '</strong><span>' + item.projects.length + ' projects · ' + money(item.totalCost) + ' · ' + item.totalStaff + ' FTE · ' + (item.budgetOk && item.staffOk ? 'Within limits' : 'Constraints exceeded') + '</span></li>';
  }).join('') || '<li><span>No other saved scenarios to compare.</span></li>';

  workspace.innerHTML = '<div class="portfolio-decision-selector"><label><span>Selected Scenario</span><select id="decision-scenario-select">' + options + '</select></label><button type="button" class="outline-button" data-decision-open-review>Return to Portfolio Review</button></div><div class="portfolio-decision-layout"><form class="portfolio-decision-form" id="scenario-decision-form"><section><p class="section-kicker">Decision Outcome</p><h4>Choose a human decision</h4><div class="decision-outcome-options"><label><input type="radio" name="scenario-outcome" value="Approve" required><span>Approve</span></label><label><input type="radio" name="scenario-outcome" value="Defer" required><span>Defer</span></label><label><input type="radio" name="scenario-outcome" value="Reject" required><span>Reject</span></label></div></section><section><label class="decision-rationale-field"><span>Decision Rationale <small>Required</small></span><textarea name="scenario-rationale" rows="6" required placeholder="Explain the evidence and reasoning behind this decision"></textarea></label></section><section><div class="decision-action-heading"><div><p class="section-kicker">Conditions / Follow-up Actions</p><h4>Add actions where needed</h4></div><button type="button" class="outline-button" data-add-decision-action>Add action</button></div><div class="decision-action-list" id="decision-action-list"></div></section><button type="submit" class="solid-button decision-record-button">Record Decision</button><p class="save-message" id="scenario-decision-message" role="status"></p></form><aside class="decision-support-panel"><header><p class="section-kicker">Decision Support Summary</p><h4>' + escapeHTML(scenarioDisplayName(selectedName)) + '</h4></header><dl><div><dt>Projects</dt><dd>' + summary.projects.length + '</dd></div><div><dt>Total cost</dt><dd>' + money(summary.totalCost) + '</dd></div><div><dt>Budget balance</dt><dd class="' + (summary.budgetOk ? 'check-ok' : 'check-warning') + '">' + (summary.budgetOk ? money(budgetRemaining) + ' remaining' : money(Math.abs(budgetRemaining)) + ' over') + '</dd></div><div><dt>Total FTE</dt><dd>' + summary.totalStaff + ' / ' + organisation.staff + '</dd></div><div><dt>FTE balance</dt><dd class="' + (summary.staffOk ? 'check-ok' : 'check-warning') + '">' + (summary.staffOk ? staffRemaining + ' remaining' : Math.abs(staffRemaining) + ' over') + '</dd></div><div><dt>Objectives covered</dt><dd>' + objectives.length + '</dd></div></dl><div class="decision-known-limit"><strong>Known limits</strong><p>' + (summary.budgetOk && summary.staffOk ? 'The scenario is within the current total budget and total FTE limits.' : (!summary.budgetOk ? 'Budget exceeded. ' : '') + (!summary.staffOk ? 'Total FTE capacity exceeded.' : '')) + '</p><small>Project-level demand by resource type is not available.</small></div><button type="button" class="text-button" data-decision-open-review>View detailed Portfolio Review</button><div class="decision-scenario-comparison"><strong>Other saved scenarios</strong><ul>' + comparison + '</ul></div></aside></div><section class="scenario-decision-history"><header><p class="section-kicker">Decision History</p><h4>' + records.length + ' record' + (records.length === 1 ? '' : 's') + ' for this scenario</h4></header><div>' + history + '</div></section><details class="legacy-decision-records"><summary>Legacy project-level decisions (' + Object.keys(state.decisions || {}).length + ')</summary><p>These existing records remain stored separately and have not been converted into scenario decisions.</p></details>';

  addDecisionActionRow();
  workspace.querySelector('#decision-scenario-select').addEventListener('change', (event) => { state.decisionScenarioId = event.target.value; renderDecisionWorkspace(); });
  workspace.querySelectorAll('[data-decision-open-review]').forEach((button) => button.addEventListener('click', () => { state.portfolioReviewScenarioName = selectedName; setActiveView('reports'); }));
  workspace.querySelector('[data-add-decision-action]').addEventListener('click', () => addDecisionActionRow());
  workspace.querySelector('#scenario-decision-form').addEventListener('submit', (event) => recordScenarioDecision(event, selectedName, selectedScenario.id));
}

function addDecisionActionRow(value = {}, focus = false) {
  const list = $('#decision-action-list');
  if (!list) return;
  const row = document.createElement('div');
  row.className = 'decision-action-row';
  row.innerHTML = '<label><span>Action</span><input type="text" data-decision-action placeholder="Describe a condition or follow-up" value="' + escapeHTML(value.text || '') + '"></label><label><span>Due date <small>Optional</small></span><input type="date" data-decision-action-date value="' + escapeHTML(value.dueDate || '') + '"></label><button type="button" class="text-button" data-remove-decision-action>Remove</button>';
  list.append(row);
  row.querySelector('[data-remove-decision-action]').addEventListener('click', () => row.remove());
  if (focus) row.querySelector('[data-decision-action]').focus();
}

function recordScenarioDecision(event, scenarioName, scenarioId) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const outcome = form.querySelector('[name="scenario-outcome"]:checked')?.value;
  const rationale = form.elements['scenario-rationale'].value.trim();
  if (!outcome || !rationale) return;
  const actions = Array.from(form.querySelectorAll('.decision-action-row')).map((row) => ({
    text: row.querySelector('[data-decision-action]').value.trim(),
    dueDate: row.querySelector('[data-decision-action-date]').value
  })).filter((action) => action.text || action.dueDate);
  if (actions.some((action) => !action.text)) {
    $('#scenario-decision-message').textContent = 'Add a description for every action that has a due date.';
    return;
  }
  const previous = Array.isArray(state.scenarioDecisions[scenarioId]) ? state.scenarioDecisions[scenarioId] : [];
  if (previous.length && !window.confirm('Record this as a new decision entry? The earlier history will be retained.')) return;
  const recordedAt = new Date().toISOString();
  const record = {
    id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `decision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scenarioId,
    scenarioName: scenarioDisplayName(scenarioName),
    outcome,
    rationale,
    actions,
    recordedAt
  };
  state.scenarioDecisions[scenarioId] = [...previous, record];
  storage.set(STORAGE.scenarioDecisions, JSON.stringify(state.scenarioDecisions));
  renderDecisionWorkspace();
}

function renderReportWorkspace() {
  const workspace = $("#report-workspace");
  if (!workspace) return;
  const entries = Object.entries(state.scenarios || {});
  if (!entries.length) {
    workspace.innerHTML = '<div class="workspace-empty"><p class="section-kicker">Portfolio Review</p><h4>No saved scenarios.</h4><p>Build and save a candidate portfolio before reviewing its projects, constraints, and strategic allocation.</p><button type="button" class="solid-button" data-review-open-builder>Build Candidate Portfolio</button></div>';
    workspace.querySelector('[data-review-open-builder]').addEventListener('click', () => setActiveView('scenarios'));
    return;
  }

  const names = entries.map(([name]) => name);
  if (!names.includes(state.portfolioReviewScenarioName)) {
    state.portfolioReviewScenarioName = names.includes(state.activeScenarioName) ? state.activeScenarioName : names[0];
  }
  const selectedName = state.portfolioReviewScenarioName;
  const selectedScenario = state.scenarios[selectedName];
  const summary = scenarioSummary({ ...selectedScenario, budget: organisation.budget, staff: organisation.staff });
  const budgetRemaining = organisation.budget - summary.totalCost;
  const staffRemaining = organisation.staff - summary.totalStaff;
  const coveredObjectives = [...new Set(summary.projects.map((proposal) => proposal.objective).filter(Boolean))];
  const options = names.map((name) => '<option value="' + escapeHTML(name) + '" ' + (name === selectedName ? 'selected' : '') + '>' + escapeHTML(scenarioDisplayName(name)) + '</option>').join('');

  if (!summary.projects.length) {
    workspace.innerHTML = '<div class="portfolio-review-selector"><label><span>Selected Scenario</span><select id="portfolio-review-scenario">' + options + '</select></label><button type="button" class="outline-button" data-review-open-builder>Return to Build Candidate Portfolio</button></div><div class="workspace-empty portfolio-review-empty"><p class="section-kicker">' + escapeHTML(scenarioDisplayName(selectedName)) + '</p><h4>This scenario has no projects.</h4><p>Add projects on the Build Candidate Portfolio page, then return here to review the portfolio.</p><button type="button" class="solid-button" data-review-open-builder>Add projects to this scenario</button></div>';
    workspace.querySelector('#portfolio-review-scenario').addEventListener('change', (event) => { state.portfolioReviewScenarioName = event.target.value; renderReportWorkspace(); });
    workspace.querySelectorAll('[data-review-open-builder]').forEach((button) => button.addEventListener('click', () => { state.activeScenarioName = selectedName; setActiveView('scenarios'); }));
    return;
  }

  const projectRows = summary.projects.map((proposal) => '<tr><th scope="row">' + escapeHTML(proposal.title) + '</th><td>' + escapeHTML(proposal.objective) + '</td><td>' + money(proposal.cost) + '</td><td>' + proposal.staff + ' FTE</td><td><button type="button" class="text-button" data-review-project="' + escapeHTML(proposal.id) + '">View proposal &amp; rationale</button></td></tr>').join('');
  const allocationObjectives = [...new Set([...organisation.objectives, ...summary.projects.map((proposal) => proposal.objective)].filter(Boolean))];
  const allocationRows = allocationObjectives.map((objective) => {
    const matching = summary.projects.filter((proposal) => proposal.objective === objective);
    const cost = matching.reduce((sum, proposal) => sum + proposal.cost, 0);
    return '<tr><th scope="row">' + escapeHTML(objective) + '</th><td>' + matching.length + '</td><td>' + money(cost) + '</td></tr>';
  }).join('');
  const comparisonRows = entries.map(([name, scenario]) => {
    const item = scenarioSummary({ ...scenario, budget: organisation.budget, staff: organisation.staff });
    const objectiveCount = new Set(item.projects.map((proposal) => proposal.objective).filter(Boolean)).size;
    return '<tr class="' + (name === selectedName ? 'is-selected' : '') + '"><th scope="row"><button type="button" class="text-button" data-review-compare-scenario="' + escapeHTML(name) + '">' + escapeHTML(scenarioDisplayName(name)) + '</button></th><td>' + item.projects.length + '</td><td>' + money(item.totalCost) + '</td><td>' + item.totalStaff + ' FTE</td><td>' + objectiveCount + '</td><td><span class="status-pill ' + (item.budgetOk && item.staffOk ? 'status-evaluated' : 'status-under-review') + '">' + (item.budgetOk && item.staffOk ? 'Within limits' : 'Constraints exceeded') + '</span></td></tr>';
  }).join('');
  const feasibilityMessage = summary.budgetOk && summary.staffOk
    ? 'This candidate portfolio is within the current total budget and total FTE limits.'
    : (!summary.budgetOk ? money(Math.abs(budgetRemaining)) + ' over budget. ' : '') + (!summary.staffOk ? Math.abs(staffRemaining) + ' FTE over capacity.' : '');

  workspace.innerHTML = '<div class="portfolio-review-selector"><label><span>Selected Scenario</span><select id="portfolio-review-scenario">' + options + '</select></label><div><button type="button" class="outline-button" data-review-open-builder>Edit in Build Candidate Portfolio</button><button type="button" class="solid-button" data-review-proceed-decisions>Proceed to Decisions</button></div></div><section class="portfolio-review-metrics" aria-label="Selected scenario summary"><article><span>Selected projects</span><strong>' + summary.projects.length + '</strong><small>in ' + escapeHTML(scenarioDisplayName(selectedName)) + '</small></article><article><span>Total cost</span><strong>' + money(summary.totalCost) + '</strong><small>of ' + money(organisation.budget) + ' available</small></article><article><span>Budget remaining</span><strong class="' + (summary.budgetOk ? '' : 'is-warning') + '">' + (summary.budgetOk ? money(budgetRemaining) : '−' + money(Math.abs(budgetRemaining))) + '</strong><small>' + (summary.budgetOk ? 'remaining' : 'over budget') + '</small></article><article><span>Objectives covered</span><strong>' + coveredObjectives.length + '</strong><small>of ' + organisation.objectives.length + ' saved objectives</small></article><article><span>Constraint status</span><strong class="portfolio-review-status ' + (summary.budgetOk && summary.staffOk ? 'is-feasible' : 'is-warning') + '">' + (summary.budgetOk && summary.staffOk ? 'Within limits' : 'Review needed') + '</strong><small>budget and total FTE</small></article></section><div class="portfolio-review-main"><section class="portfolio-review-panel portfolio-review-projects"><header><p class="section-kicker">Selected Projects</p><h4>Projects in this scenario</h4></header><div class="portfolio-review-table-wrap"><table><thead><tr><th>Project</th><th>Primary strategic objective</th><th>Estimated cost</th><th>Total FTE</th><th>Evidence</th></tr></thead><tbody>' + projectRows + '</tbody></table></div></section><aside class="portfolio-review-panel portfolio-feasibility"><header><p class="section-kicker">Budget &amp; Resource Feasibility</p><h4>' + (summary.budgetOk && summary.staffOk ? 'Within limits' : 'Constraints exceeded') + '</h4></header><div class="portfolio-feasibility-metric"><span>Investment budget</span><strong>' + money(summary.totalCost) + ' / ' + money(organisation.budget) + '</strong><div class="scenario-meter"><i style="width:' + Math.min(organisation.budget ? summary.totalCost / organisation.budget * 100 : summary.totalCost ? 100 : 0, 100) + '%"></i></div><small class="' + (summary.budgetOk ? 'check-ok' : 'check-warning') + '">' + (summary.budgetOk ? money(Math.max(0, budgetRemaining)) + ' remaining' : money(Math.abs(budgetRemaining)) + ' over budget') + '</small></div><div class="portfolio-feasibility-metric"><span>Total FTE</span><strong>' + summary.totalStaff + ' / ' + organisation.staff + ' FTE</strong><div class="scenario-meter"><i style="width:' + Math.min(organisation.staff ? summary.totalStaff / organisation.staff * 100 : summary.totalStaff ? 100 : 0, 100) + '%"></i></div><small class="' + (summary.staffOk ? 'check-ok' : 'check-warning') + '">' + (summary.staffOk ? Math.max(0, staffRemaining) + ' FTE remaining' : Math.abs(staffRemaining) + ' FTE over capacity') + '</small></div><div class="portfolio-feasibility-note">' + escapeHTML(feasibilityMessage) + '</div><small class="scenario-capacity-note">Only total FTE is compared. Project-level resource-type demand is not available.</small></aside></div><div class="portfolio-review-lower"><section class="portfolio-review-panel"><header><p class="section-kicker">Strategic Investment Allocation</p><h4>Projects and cost by primary objective</h4></header><div class="portfolio-review-table-wrap"><table><thead><tr><th>Strategic objective</th><th>Projects</th><th>Investment</th></tr></thead><tbody>' + allocationRows + '</tbody></table></div></section><section class="portfolio-review-panel"><header><p class="section-kicker">Scenario Comparison</p><h4>Saved candidate portfolios</h4></header><div class="portfolio-review-table-wrap"><table><thead><tr><th>Scenario</th><th>Projects</th><th>Cost</th><th>Total FTE</th><th>Objectives</th><th>Status</th></tr></thead><tbody>' + comparisonRows + '</tbody></table></div></section></div>';

  workspace.querySelector('#portfolio-review-scenario').addEventListener('change', (event) => { state.portfolioReviewScenarioName = event.target.value; renderReportWorkspace(); });
  workspace.querySelectorAll('[data-review-compare-scenario]').forEach((button) => button.addEventListener('click', () => { state.portfolioReviewScenarioName = button.dataset.reviewCompareScenario; renderReportWorkspace(); }));
  workspace.querySelectorAll('[data-review-project]').forEach((button) => button.addEventListener('click', () => { state.selectedId = button.dataset.reviewProject; setActiveView('manager'); renderDetail(); }));
  workspace.querySelector('[data-review-open-builder]').addEventListener('click', () => { state.activeScenarioName = selectedName; setActiveView('scenarios'); });
  workspace.querySelector('[data-review-proceed-decisions]').addEventListener('click', () => {
    state.decisionScenarioId = selectedScenario.id;
    setActiveView('decisions');
  });
}

function openComparison() {
  if (selectedProposals().length < 2) { window.alert("Choose two to four evaluated projects before comparing them."); return; }
  setActiveView("comparison");
}

function setActiveView(view) {
  const knownViews = ["account", "organisation", "proposer", "reviewer", "manager", "shortlist", "comparison", "insights", "scenarios", "decisions", "reports", "tests"];
  if (!knownViews.includes(view)) return;
  state.activeView = view;
  $$('[data-workspace-view]').forEach((section) => { section.hidden = section.dataset.workspaceView !== view; });
  $$('[data-workspace-view-button]').forEach((button) => { if (button.dataset.workspaceViewButton === view) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current"); });
  const testButton = $("#open-test-mode"); if (testButton) testButton.setAttribute("aria-pressed", String(view === "tests"));
  if (view === "account") renderAccountWorkspace();
  if (view === "manager") renderAll();
  if (view === "reviewer") renderReviewQueue();
  if (view === "organisation") renderOrganisationForm();
  if (view === "proposer") populateObjectives();
  if (view === "shortlist") renderShortlistWorkspace();
  if (view === "comparison") renderComparisonWorkspace();
  if (view === "insights") renderCriterionInsights();
  if (view === "scenarios") renderScenarioWorkspace();
  if (view === "decisions") renderDecisionWorkspace();
  if (view === "reports") renderReportWorkspace();
  if (view === "tests") renderTestHarness();
}



/* PPM browser-local removal controls */
const PPM_REMOVED_PROPOSAL_KEY = "ppm-v2-removed-proposals";
const ppmRemovedProposalIds = new Set(readStoredJSON(PPM_REMOVED_PROPOSAL_KEY, []));

function saveRemovedProposals() {
  storage.set(PPM_REMOVED_PROPOSAL_KEY, JSON.stringify([...ppmRemovedProposalIds]));
}

function deleteProposal(id) {
  const index = proposals.findIndex((proposal) => proposal.id === id);
  const proposal = proposals[index];
  if (!proposal) return;
  if (!window.confirm("Remove “" + proposal.title + "” from this browser?")) return;
  proposals.splice(index, 1);
  ppmRemovedProposalIds.add(id);
  state.compared.delete(id);
  state.shortlisted.delete(id);
  if (state.selectedId === id) state.selectedId = null;
  Object.entries(state.scenarios || {}).forEach(([name, scenario]) => {
    const ids = Array.isArray(scenario && scenario.projectIds) ? scenario.projectIds : [];
    state.scenarios[name] = { ...scenario, projectIds: ids.filter((projectId) => projectId !== id) };
  });
  delete state.decisions[id];
  persistCustomProposals();
  persistFormalShortlist();
  saveRemovedProposals();
  storage.set(STORAGE.scenarios, JSON.stringify(state.scenarios));
  storage.set(STORAGE.decisions, JSON.stringify(state.decisions));
  storage.remove("ppm-evaluation-" + id);
  storage.remove("ppm-note-" + id);
  renderAll();
  if (state.activeView === "comparison") renderComparisonWorkspace();
  if (state.activeView === "scenarios") renderScenarioWorkspace();
  if (state.activeView === "decisions") renderDecisionWorkspace();
  if (state.activeView === "reports") renderReportWorkspace();
}

function ppmRemoveButton(label, attribute, value, ariaLabel) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "card-remove-button";
  button.textContent = label;
  button.setAttribute(attribute, value);
  button.setAttribute("aria-label", ariaLabel);
  return button;
}

function addRemovalControls() {
  $$(".portfolio-card").forEach((card) => {
    const id = card.dataset.projectId;
    const actions = card.querySelector(".portfolio-card-actions");
    if (id && actions && !actions.querySelector("[data-delete-proposal], [data-ppm-remove-proposal]")) {
      actions.append(ppmRemoveButton("Remove", "data-ppm-remove-proposal", id, "Remove proposal"));
    }
  });
  $$(".review-queue-card").forEach((card) => {
    const title = card.querySelector("h4") && card.querySelector("h4").textContent;
    const proposal = proposals.find((item) => item.title === title);
    const actions = card.querySelector(".review-queue-actions");
    if (proposal && actions && !actions.querySelector("[data-delete-proposal], [data-ppm-remove-proposal]")) {
      actions.append(ppmRemoveButton("Remove", "data-ppm-remove-proposal", proposal.id, "Remove proposal"));
    }
  });
  const detailActions = $(".insight-header > div:last-child");
  if (detailActions && state.selectedId && !detailActions.querySelector("[data-delete-proposal], [data-ppm-remove-proposal]")) {
    detailActions.append(ppmRemoveButton("Remove", "data-ppm-remove-proposal", state.selectedId, "Remove proposal"));
  }
}

function applyPersistedProposalRemovals() {
  if (!ppmRemovedProposalIds.size) return;
  for (let index = proposals.length - 1; index >= 0; index -= 1) {
    if (ppmRemovedProposalIds.has(proposals[index].id)) proposals.splice(index, 1);
  }
  state.compared = new Set([...state.compared].filter((id) => proposals.some((proposal) => proposal.id === id)));
  state.shortlisted = new Set([...state.shortlisted].filter((id) => proposals.some((proposal) => proposal.id === id)));
  Object.entries(state.scenarios || {}).forEach(([name, scenario]) => {
    const ids = Array.isArray(scenario && scenario.projectIds) ? scenario.projectIds : [];
    state.scenarios[name] = { ...scenario, projectIds: ids.filter((id) => proposals.some((proposal) => proposal.id === id)) };
  });
  if (!proposals.some((proposal) => proposal.id === state.selectedId)) state.selectedId = null;
  persistCustomProposals();
  persistFormalShortlist();
  storage.set(STORAGE.scenarios, JSON.stringify(state.scenarios));
}

document.addEventListener("click", (event) => {
  const proposalButton = event.target.closest("[data-ppm-remove-proposal], [data-delete-proposal]");
  if (proposalButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    deleteProposal(proposalButton.dataset.ppmRemoveProposal || proposalButton.dataset.deleteProposal);
    return;
  }
}, true);

const ppmRemovalStyle = document.createElement("style");
ppmRemovalStyle.textContent = ".card-remove-button{margin-left:8px}";
document.head.append(ppmRemovalStyle);
const ppmRemovalObserver = new MutationObserver(() => requestAnimationFrame(addRemovalControls));
ppmRemovalObserver.observe(document.body, { childList: true, subtree: true });
applyPersistedProposalRemovals();
renderAll();
if (state.activeView === "comparison") renderComparisonWorkspace();
if (state.activeView === "scenarios") renderScenarioWorkspace();
if (state.activeView === "decisions") renderDecisionWorkspace();
if (state.activeView === "reports") renderReportWorkspace();
addRemovalControls();
