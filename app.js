const CRITERIA = [
  { key: "alignment", label: "Strategic Alignment", short: "Alignment", low: "No clear link to strategy", high: "Directly supports a top priority" },
  { key: "value", label: "Organisational Value / Expected Benefits", short: "Value", low: "Little or no improvement", high: "Exceptional financial or non-financial benefit" },
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
  name: "IT investment portfolio",
  businessUnit: "",
  planningHorizon: "",
  objectives: ["Improve Customer Experience", "Improve Operational Efficiency", "Improve Service Reliability", "Reduce Security Risk"],
  budget: 5,
  staff: 20
};

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
    objective: "Improve Service Reliability", duration: "14 weeks", cost: 0.9, staff: 3, status: "Evaluated",
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
    objective: "Reduce Security Risk", duration: "20 weeks", cost: 1.3, staff: 5, status: "Evaluated",
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
  organisation: "ppm-organisation",
  customProposals: "ppm-v2-custom-proposals",
  scenarios: "ppm-v2-scenarios",
  decisions: "ppm-v2-decisions",
  accounts: "ppm-v2-accounts",
  activeAccount: "ppm-v2-active-account",
  objectives: "ppm-v2-objective-history"
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
  const suppliedObjectives = Array.isArray(raw?.objectives)
    ? raw.objectives.map((item) => String(item).trim()).filter(Boolean)
    : [];
  return {
    name: String(raw?.name || DEFAULT_ORGANISATION.name),
    businessUnit: String(raw?.businessUnit || "").trim(),
    planningHorizon: String(raw?.planningHorizon || "").trim(),
    objectives: suppliedObjectives.length ? suppliedObjectives : [...DEFAULT_ORGANISATION.objectives],
    budget: Math.max(0, numberOr(raw?.budget, DEFAULT_ORGANISATION.budget)),
    staff: Math.max(1, numberOr(raw?.staff, DEFAULT_ORGANISATION.staff))
  };
}

let organisation = normaliseOrganisation(readStoredJSON(STORAGE.organisation, TEST_MODE ? TEST_ORGANISATION : DEFAULT_ORGANISATION));
let organisationConfigured = TEST_MODE || Boolean(storage.get(STORAGE.organisation));
let savedAccounts = readStoredJSON(STORAGE.accounts, []);
let activeAccount = readStoredJSON(STORAGE.activeAccount, null);
let objectiveHistory = readStoredJSON(STORAGE.objectives, organisationConfigured ? organisation.objectives : []);
if (!Array.isArray(savedAccounts)) savedAccounts = [];
if (!Array.isArray(objectiveHistory)) objectiveHistory = organisationConfigured ? [...organisation.objectives] : [];
const initialProposals = TEST_MODE ? TEST_PROPOSALS : DEMO_PROPOSALS;
const proposalMap = new Map(initialProposals.map((proposal) => [proposal.id, normaliseProposal(proposal)]));
readStoredJSON(STORAGE.customProposals, []).forEach((proposal) => {
  const normalised = normaliseProposal(proposal);
  if (normalised.id) proposalMap.set(normalised.id, normalised);
});
const proposals = Array.from(proposalMap.values());

const state = {
  activeView: activeAccount ? "manager" : "account",
  query: "",
  objective: "all",
  feasibility: 0,
  risk: 0,
  cost: "all",
  status: "all",
  sort: "title",
  selectedId: null,
  compared: new Set(),
  scenarioDraft: new Set(),
  scenarioDraftName: "",
  overviewNotice: "",
  scenarios: readStoredJSON(STORAGE.scenarios, TEST_MODE ? {} : structuredClone(DEFAULT_SCENARIOS)),
  decisions: readStoredJSON(STORAGE.decisions, {}),
  quickChecks: {},
  testProgress: TEST_MODE ? readStoredJSON("mvp-test-progress", {}) : {}
};

const listEl = $("#proposal-list");
const detailEl = $("#proposal-detail");
const emptyEl = $("#empty-state");
const compareDialog = $("#compare-dialog");
const reviewDialog = $("#review-dialog");

function money(value) {
  return `$${Number(value).toFixed(1).replace(".0", "")}M`;
}

function scenarioLabel(proposal) {
  const names = Object.entries(state.scenarios || {})
    .filter(([, scenario]) => Array.isArray(scenario?.projectIds) && scenario.projectIds.includes(proposal.id))
    .map(([name]) => name);
  return names.length ? names.join(", ") : "Not assigned";
}

function scenarioLink(proposal) {
  const names = Object.entries(state.scenarios || {})
    .filter(([, scenario]) => Array.isArray(scenario?.projectIds) && scenario.projectIds.includes(proposal.id))
    .map(([name]) => name);
  if (!names.length) return '<span class="comparison-scenario-unassigned">Not assigned</span>';
  return names.map((name) => '<a class="comparison-scenario-link" href="#scenario-' + encodeURIComponent(name) + '" data-open-project-scenario="' + escapeHTML(name) + '">' + escapeHTML(name) + '</a>').join(', ');
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

function uniqueObjectiveValues(values) {
  const seen = new Set();
  return values.map((value) => String(value || "").trim()).filter((value) => {
    if (!value) return false;
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function objectiveDraftValues() {
  return $$('[data-objective-input]').map((input) => input.value);
}

function renderObjectiveFields(values = [""]) {
  const container = $("#objective-fields");
  if (!container) return;
  const entries = Array.isArray(values) && values.length ? values : [""];
  container.innerHTML = entries.map((value, index) => `<div class="objective-input-row"><label><span>Objective ${index + 1}</span><input type="text" maxlength="100" data-objective-input value="${escapeHTML(value)}" placeholder="e.g. Improve customer experience" /></label><button type="button" class="text-button objective-remove-button" data-remove-objective-field="${index}" aria-label="Remove objective ${index + 1}"${entries.length === 1 ? " disabled" : ""}>Remove objective</button></div>`).join("");
  container.querySelectorAll("[data-remove-objective-field]").forEach((button) => button.addEventListener("click", () => {
    const current = objectiveDraftValues();
    if (current.length <= 1) return;
    current.splice(Number(button.dataset.removeObjectiveField), 1);
    renderObjectiveFields(current);
  }));
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
  $("#org-business-unit").value = organisation.businessUnit;
  $("#org-planning-horizon").value = organisation.planningHorizon;
  const objectives = organisationConfigured ? organisation.objectives : [];
  renderObjectiveFields(objectives.length ? objectives : [""]);
  $("#org-budget").value = String(organisation.budget);
  $("#org-staff").value = String(organisation.staff);
  $("#scenario-organisation").textContent = `${organisation.name} · ${money(organisation.budget)} · ${organisation.staff} FTE`;
}

function normaliseAccount(raw) {
  const allowedRoles = ["Project Proposer", "Reviewer", "Portfolio Manager"];
  const displayName = String(raw?.displayName || "").trim();
  const role = allowedRoles.includes(raw?.role) ? raw.role : "Project Proposer";
  return displayName ? { displayName, role } : null;
}

function persistAccounts() {
  storage.set(STORAGE.accounts, JSON.stringify(savedAccounts));
  if (activeAccount) storage.set(STORAGE.activeAccount, JSON.stringify(activeAccount));
  else storage.remove(STORAGE.activeAccount);
}

function renderAccount() {
  const account = normaliseAccount(activeAccount);
  $("#active-account-name").textContent = account?.displayName || "Not selected";
  $("#active-account-role").textContent = account?.role || "Choose an account to continue";
  $("#account-card-name").textContent = account?.displayName || "No account selected";
  $("#account-card-role").textContent = account ? `${account.role} · all workspace screens remain visible` : "Select a display name and role. Every role can still view the same workspace screens.";
  if (account) {
    $("#account-name").value = account.displayName;
    $("#account-role").value = account.role;
  }
  const container = $("#saved-accounts");
  container.innerHTML = savedAccounts.length ? savedAccounts.map((item, index) => `<span class="saved-choice-chip"><button type="button" data-reuse-account="${index}"><strong>${escapeHTML(item.displayName)}</strong><small>${escapeHTML(item.role)}</small></button><button type="button" data-remove-account="${index}" aria-label="Remove saved account ${escapeHTML(item.displayName)}">×</button></span>`).join("") : '<p class="saved-choice-empty">No previous accounts saved in this browser.</p>';
  container.querySelectorAll("[data-reuse-account]").forEach((button) => button.addEventListener("click", () => {
    activeAccount = normaliseAccount(savedAccounts[Number(button.dataset.reuseAccount)]);
    state.overviewNotice = "";
    persistAccounts();
    renderAccount();
    setActiveView("manager");
  }));
  container.querySelectorAll("[data-remove-account]").forEach((button) => button.addEventListener("click", () => {
    savedAccounts.splice(Number(button.dataset.removeAccount), 1);
    persistAccounts();
    renderAccount();
  }));
}

function saveAccount(event) {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  activeAccount = normaliseAccount({ displayName: $("#account-name").value, role: $("#account-role").value });
  state.overviewNotice = "";
  const existingIndex = savedAccounts.findIndex((item) => item.displayName.toLowerCase() === activeAccount.displayName.toLowerCase() && item.role === activeAccount.role);
  if (existingIndex < 0) savedAccounts.unshift(activeAccount);
  persistAccounts();
  renderAccount();
  $("#account-message").textContent = "Account saved in this browser.";
  setActiveView("manager");
}

function renderObjectiveSuggestions() {
  const container = $("#objective-suggestions");
  if (!container) return;
  const currentKeys = new Set(objectiveDraftValues().map((item) => item.trim().toLocaleLowerCase()).filter(Boolean));
  const values = uniqueObjectiveValues(objectiveHistory).filter((objective) => !currentKeys.has(objective.toLocaleLowerCase()));
  container.innerHTML = values.length ? values.map((objective, index) => `<span class="saved-choice-chip saved-choice-chip--objective"><button type="button" data-reuse-objective="${index}">${escapeHTML(objective)}</button><button type="button" data-remove-objective="${index}" aria-label="Remove saved objective ${escapeHTML(objective)}">×</button></span>`).join("") : '<p class="saved-choice-empty">No previous objectives outside the current portfolio.</p>';
  container.querySelectorAll("[data-reuse-objective]").forEach((button) => button.addEventListener("click", () => {
    const value = values[Number(button.dataset.reuseObjective)];
    const current = objectiveDraftValues();
    const existingIndex = current.findIndex((item) => item.trim().toLocaleLowerCase() === value.toLocaleLowerCase());
    if (existingIndex >= 0) {
      $$('[data-objective-input]')[existingIndex]?.focus();
      return;
    }
    const blankIndex = current.findIndex((item) => !item.trim());
    if (blankIndex >= 0) current[blankIndex] = value;
    else current.push(value);
    renderObjectiveFields(current);
    $$('[data-objective-input]')[blankIndex >= 0 ? blankIndex : current.length - 1]?.focus();
  }));
  container.querySelectorAll("[data-remove-objective]").forEach((button) => button.addEventListener("click", () => {
    const value = values[Number(button.dataset.removeObjective)];
    objectiveHistory = objectiveHistory.filter((item) => item !== value);
    storage.set(STORAGE.objectives, JSON.stringify(objectiveHistory));
    renderObjectiveSuggestions();
  }));
}

function populateObjectives() {
  const allObjectives = [...new Set([...activeObjectives(), ...proposals.map((proposal) => proposal.objective)])].sort();
  updateSelectOptions($("#objective-filter"), allObjectives, true);
  state.objective = $("#objective-filter").value;
  const objectives = organisationConfigured ? activeObjectives() : [];
  updateSelectOptions($("#proposal-objective"), objectives, false);
  const field = $("#proposal-objective-field");
  const emptyState = $("#proposal-objective-empty");
  const submitButton = $('#proposal-form button[type="submit"]');
  if (field) field.hidden = objectives.length === 0;
  if (emptyState) emptyState.hidden = objectives.length !== 0;
  if (submitButton) submitButton.disabled = objectives.length === 0;
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
  const needsEvaluation = proposals.filter((proposal) => !isEvaluated(proposal)).length;
  $("#summary-total").textContent = String(proposals.length);
  $("#summary-evaluated").textContent = String(evaluated);
  $("#summary-awaiting").textContent = String(needsEvaluation);
  $("#summary-budget").textContent = money(organisation.budget);
}

function renderRoleWorkspace() {
  const panel = $("#role-workspace-panel");
  const success = $("#overview-success");
  if (!panel || !success) return;
  success.hidden = !state.overviewNotice;
  success.textContent = state.overviewNotice;
  const sharedNote = "All screens remain visible in this prototype. The selected role highlights the user’s primary responsibilities.";
  if (!activeAccount) {
    panel.innerHTML = '<div><p class="role-guidance-label">No active account selected</p><h4>Choose an account to see role guidance</h4><p>Select a prototype account and role from the top-right account control. All workspace screens remain visible while no account is selected.</p><small>Use the sidebar to explore the workspace, or choose an account to see role-specific guidance.</small></div>';
    return;
  }
  const role = activeAccount.role;
  const awaitingCount = proposals.filter((proposal) => !isEvaluated(proposal)).length;
  if (role === "Reviewer") {
    panel.innerHTML = `<div><p class="role-guidance-label">Role workspace · Reviewer</p><h4>Review submitted proposals</h4><p>Assess proposals using the five criteria and provide a rationale for every rating.</p><strong class="role-workspace-count">${awaitingCount} proposal${awaitingCount === 1 ? "" : "s"} need${awaitingCount === 1 ? "s" : ""} evaluation</strong><small>${sharedNote}</small></div>`;
  } else if (role === "Portfolio Manager") {
    panel.innerHTML = `<div><p class="role-guidance-label">Role workspace · Portfolio Manager</p><h4>Manage the portfolio decision process</h4><p>Set the investment context, compare evaluated projects, build candidate portfolios, and record decisions.</p><small>${sharedNote}</small></div>`;
  } else {
    panel.innerHTML = `<div><p class="role-guidance-label">Role workspace · Project Proposer</p><h4>Submit a project proposal</h4><p>Provide the project information reviewers need, including one primary strategic objective.</p><small>${sharedNote}</small></div>`;
  }
  panel.querySelectorAll("[data-role-action]").forEach((button) => button.addEventListener("click", () => setActiveView(button.dataset.roleAction)));
}

function renderResults() {
  const visible = visibleProposals();
  $("#result-count").textContent = String(visible.length);
  emptyEl.hidden = visible.length !== 0;
  listEl.innerHTML = visible.map((proposal) => {
    const evaluated = isEvaluated(proposal);
    const status = currentStatus(proposal);
    return `<article class="portfolio-card ${proposal.id === state.selectedId ? "is-selected" : ""}" data-project-id="${escapeHTML(proposal.id)}">
      <label class="shortlist-control" title="${evaluated ? "Add to candidate portfolio" : "Complete reviewer evaluation before comparing"}">
        <input class="shortlist-checkbox" type="checkbox" data-shortlist-id="${escapeHTML(proposal.id)}" aria-label="Shortlist ${escapeHTML(proposal.title)}" ${state.compared.has(proposal.id) ? "checked" : ""} ${evaluated ? "" : "disabled"} />
      </label>
      <div class="portfolio-card-main">
        <div class="portfolio-card-topline"><div><span class="objective-tag">${escapeHTML(proposal.objective)}</span><span class="objective-tag">${escapeHTML(scenarioLabel(proposal))}</span></div><div class="portfolio-card-actions"><span class="status-pill ${statusClass(status)}">${escapeHTML(status)}</span>${proposal.isCustom ? `<button type="button" class="card-remove-button" data-delete-proposal="${escapeHTML(proposal.id)}" aria-label="Delete proposal ${escapeHTML(proposal.title)}">Delete proposal</button>` : ""}</div></div>
        <button type="button" class="portfolio-card-title" data-select-id="${escapeHTML(proposal.id)}">${escapeHTML(proposal.title)}</button>
        <p class="portfolio-summary-copy">${escapeHTML(proposal.summary)}</p>
        <div class="portfolio-meta"><span>${escapeHTML(proposal.owner)}</span><span>${escapeHTML(proposal.duration)}</span><strong>${money(proposal.cost)}</strong><strong>${proposal.staff} FTE</strong></div>
        ${assessmentProfile(proposal)}
        <div class="portfolio-card-footer"><button type="button" class="text-button" data-select-id="${escapeHTML(proposal.id)}">View Project Details</button><button type="button" class="text-button" data-card-review="${escapeHTML(proposal.id)}">${evaluated ? "Edit evaluation" : "Start evaluation"}</button></div>
      </div>
    </article>`;
  }).join("");

  $$('[data-select-id]').forEach((button) => button.addEventListener("click", () => {
    state.selectedId = button.dataset.selectId;
    renderResults();
    renderDetail();
    detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  $$('[data-shortlist-id]').forEach((input) => input.addEventListener("change", () => toggleShortlist(input.dataset.shortlistId, input.checked)));
  $$('[data-card-review]').forEach((button) => button.addEventListener("click", () => openReview(button.dataset.cardReview)));
  bindCustomProposalDeleteButtons(listEl);
}

function toggleShortlist(id, shouldAdd) {
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
  else {
    state.compared.delete(id);
    state.scenarioDraft.delete(id);
  }
  renderSummary();
  renderResults();
  renderScenario();
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
  if (!window.confirm(`Delete proposal “${proposal.title}” from this browser? This also removes its local evaluation, shortlist and scenario references, and recorded decision.`)) return;
  proposals.splice(proposalIndex, 1);
  state.compared.delete(id);
  if (state.selectedId === id) state.selectedId = null;
  Object.entries(state.scenarios || {}).forEach(([name, scenario]) => {
    const projectIds = Array.isArray(scenario?.projectIds) ? scenario.projectIds : [];
    state.scenarios[name] = { ...scenario, projectIds: projectIds.filter((projectId) => projectId !== id) };
  });
  delete state.decisions[id];
  persistCustomProposals();
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
    ? selected.map((proposal) => `<button type="button" data-remove-shortlist="${escapeHTML(proposal.id)}" aria-label="Remove ${escapeHTML(proposal.title)} from shortlist" title="Remove from shortlist"><span>${escapeHTML(proposal.title)}</span><strong>${money(proposal.cost)} · ${proposal.staff} FTE</strong><i aria-hidden="true">×</i></button>`).join("")
    : "<p>Select two to four evaluated projects from the cards.</p>";
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
  $$('[data-remove-shortlist]').forEach((button) => button.addEventListener("click", () => toggleShortlist(button.dataset.removeShortlist, false)));
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
    const capacity = Math.max(1, numberOr(scenario.staff, organisation.staff));
    const feasible = cost <= budget && staff <= capacity;
    return `<button type="button" data-load-scenario="${escapeHTML(name)}"><span>Scenario ${escapeHTML(name)}</span><small>${projects.length} projects · ${money(cost)} · ${staff} FTE</small><strong>${feasible ? "Feasible" : "Needs revision"}</strong></button>`;
  }).join("")}` : "";
  $$('[data-load-scenario]').forEach((button) => button.addEventListener("click", () => {
    const scenario = state.scenarios[button.dataset.loadScenario];
    const ids = Array.isArray(scenario?.projectIds) ? scenario.projectIds : [];
    state.compared = new Set(ids.filter((id) => proposals.some((proposal) => proposal.id === id && isEvaluated(proposal))));
    renderAll();
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
    detailEl.innerHTML = '<div class="detail-empty">Select a project card to view its profile and reviewer rationale.</div>';
    return;
  }
  const savedDecision = state.decisions[proposal.id];
  const status = currentStatus(proposal);
  const detailHeader = `<button type="button" class="workflow-back" data-close-project-detail>← Back to project list</button><div class="insight-header"><div><p class="section-kicker">Project insight</p><h3>${escapeHTML(proposal.title)}</h3><p>${escapeHTML(proposal.owner)} · ${escapeHTML(proposal.objective)} · ${money(proposal.cost)} · ${proposal.staff} FTE · ${escapeHTML(proposal.duration)}</p></div><div><span class="objective-tag">${escapeHTML(scenarioLabel(proposal))}</span><span class="status-pill ${statusClass(status)}">${escapeHTML(status)}</span><button type="button" class="outline-button" data-open-review="${escapeHTML(proposal.id)}">${isEvaluated(proposal) ? "Edit evaluation" : "Start evaluation"}</button>${proposal.isCustom ? `<button type="button" class="card-remove-button" data-delete-proposal="${escapeHTML(proposal.id)}">Delete proposal</button>` : ""}</div></div>`;

  if (!isEvaluated(proposal)) {
    detailEl.innerHTML = `${detailHeader}${detailsOverview(proposal)}<div class="pending-evaluation"><div><p class="section-kicker">Next step</p><h4>Ready for a five-criterion review.</h4></div><div><p>Use the Start evaluation button above to record ratings and a short reason for strategic alignment, expected business value, delivery feasibility, risk manageability, and time criticality. A radar profile appears only after all five are complete.</p></div></div>`;
  } else {
    detailEl.innerHTML = `${detailHeader}${detailsOverview(proposal)}
      <div class="insight-grid"><div class="single-radar">${radarSVG([proposal])}</div><div class="criteria-panel"><h4>Criterion ratings</h4>${CRITERIA.map((criterion, index) => `<button type="button" class="criterion-row ${index === 0 ? "is-active" : ""}" data-criterion="${criterion.key}"><span>${criterion.label}</span><strong class="${scoreClass(proposal.scores[criterion.key])}">${proposal.scores[criterion.key]}/5</strong></button>`).join("")}</div><div class="rationale-panel"><p class="section-kicker">Reviewer rationale</p><h4 id="rationale-title">${CRITERIA[0].label}</h4><p id="rationale-copy">${escapeHTML(proposal.rationales[CRITERIA[0].key])}</p>${proposal.missing.length ? `<div class="missing-note"><strong>Information still required</strong><span>${proposal.missing.map(escapeHTML).join(", ")}</span></div>` : ""}</div></div>
      <div class="decision-strip"><div><p class="section-kicker">Human decision</p><strong>${savedDecision ? `${escapeHTML(savedDecision.decision)} recorded` : "No final decision recorded"}</strong><small>${savedDecision?.date ? `Scenario ${escapeHTML(savedDecision.scenario || "—")} · Saved ${escapeHTML(savedDecision.date)}` : "Review the evidence and candidate-portfolio constraints first."}</small></div><div><button type="button" data-decision="Approved">Approve</button><button type="button" data-decision="Deferred">Defer</button><button type="button" data-decision="Rejected">Reject</button></div></div>`;
  }

  $$('[data-criterion]').forEach((button) => button.addEventListener("click", () => {
    const criterion = CRITERIA.find((item) => item.key === button.dataset.criterion);
    if (!criterion) return;
    $$('[data-criterion]').forEach((item) => item.classList.toggle("is-active", item === button));
    $("#rationale-title").textContent = criterion.label;
    $("#rationale-copy").textContent = proposal.rationales[criterion.key];
  }));
  $$('[data-open-review]').forEach((button) => button.addEventListener("click", () => openReview(button.dataset.openReview)));
  $$('[data-close-project-detail]').forEach((button) => button.addEventListener("click", () => {
    state.selectedId = null;
    renderResults();
    renderDetail();
    document.querySelector(".portfolio-catalog-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  $$('[data-decision]').forEach((button) => button.addEventListener("click", () => recordDecision(proposal.id, button.dataset.decision)));
  bindCustomProposalDeleteButtons(detailEl);
}

function recordDecision(id, decision) {
  const proposal = proposals.find((item) => item.id === id);
  if (!proposal || !isEvaluated(proposal)) {
    window.alert("Complete the reviewer evaluation before recording a final decision.");
    return;
  }
  const scenarioName = Object.entries(state.scenarios || {}).find(([, scenario]) => Array.isArray(scenario?.projectIds) && scenario.projectIds.includes(id))?.[0];
  if (!scenarioName) {
    window.alert("Add this proposal to a saved portfolio scenario before recording a final decision.");
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
  $("#review-evidence").innerHTML = `<div class="proposal-evidence-heading"><p class="section-kicker">Proposal evidence</p><h3>Review the submitted information before rating.</h3></div><dl><div><dt>Project name</dt><dd>${escapeHTML(proposal.title)}</dd></div><div><dt>Project owner</dt><dd>${escapeHTML(proposal.owner)}</dd></div><div class="proposal-evidence-wide"><dt>Project description</dt><dd>${escapeHTML(proposal.summary)}</dd></div><div class="proposal-evidence-wide"><dt>Primary strategic objective</dt><dd>${escapeHTML(proposal.objective)}</dd></div><div class="proposal-evidence-wide"><dt>Expected benefits</dt><dd>${escapeHTML(proposal.benefits)}</dd></div><div><dt>Estimated cost</dt><dd>${money(proposal.cost)}</dd></div><div><dt>Required staff</dt><dd>${proposal.staff} FTE</dd></div><div><dt>Estimated timeline</dt><dd>${escapeHTML(proposal.duration)}</dd></div><div class="proposal-evidence-wide"><dt>Key risks or dependencies</dt><dd>${escapeHTML(proposal.risks)}</dd></div></dl>`;
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
  const queueState = (proposal) => proposal.status === "Under review" ? "Under review" : isEvaluated(proposal) ? "Evaluated" : "Awaiting review";
  const queueOrder = { "Awaiting review": 0, "Under review": 1, Evaluated: 2 };
  const ordered = [...proposals].sort((a, b) => queueOrder[queueState(a)] - queueOrder[queueState(b)] || a.title.localeCompare(b.title));
  $("#review-queue").innerHTML = ordered.map((proposal) => {
    const evaluated = isEvaluated(proposal);
    const workflowStatus = queueState(proposal);
    const statusCopy = workflowStatus === "Evaluated" ? "Five ratings and reviewer rationale available." : workflowStatus === "Under review" ? "Evaluation recorded, but additional proposal information is still required." : "Five ratings and five short rationales required.";
    return `<article class="review-queue-card ${workflowStatus === "Awaiting review" ? "is-awaiting" : workflowStatus === "Under review" ? "is-under-review" : ""}"><div class="review-queue-card-top"><p class="section-kicker">${escapeHTML(workflowStatus)}</p><span class="status-pill ${statusClass(workflowStatus)}">${escapeHTML(workflowStatus)}</span></div><h4>${escapeHTML(proposal.title)}</h4><p>${escapeHTML(proposal.owner)} · ${escapeHTML(proposal.objective)} · ${money(proposal.cost)} · ${proposal.staff} FTE</p><div class="queue-profile">${statusCopy}</div><div class="review-queue-actions"><button type="button" class="outline-button" data-review-queue-id="${escapeHTML(proposal.id)}">${evaluated ? "Edit evaluation" : "Start evaluation"}</button>${proposal.isCustom ? `<button type="button" class="card-remove-button" data-delete-proposal="${escapeHTML(proposal.id)}">Delete proposal</button>` : ""}</div></article>`;
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
    expected: "The proposal appears in Project Evaluation as Submitted.",
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
    title: "Compare two shortlisted projects",
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
  const objectives = uniqueObjectiveValues(objectiveDraftValues());
  if (!objectives.length) {
    $("#organisation-message").textContent = "Add at least one strategic objective.";
    $('[data-objective-input]')?.focus();
    return;
  }
  organisation = {
    name: $("#org-name").value.trim(),
    businessUnit: $("#org-business-unit").value.trim(),
    planningHorizon: $("#org-planning-horizon").value.trim(),
    objectives,
    budget: numberOr($("#org-budget").value, DEFAULT_ORGANISATION.budget),
    staff: numberOr($("#org-staff").value, DEFAULT_ORGANISATION.staff)
  };
  organisationConfigured = true;
  storage.set(STORAGE.organisation, JSON.stringify(organisation));
  objectiveHistory = uniqueObjectiveValues([...objectiveHistory, ...objectives]);
  storage.set(STORAGE.objectives, JSON.stringify(objectiveHistory));
  renderOrganisationForm();
  renderObjectiveSuggestions();
  populateObjectives();
  renderAll();
  $("#organisation-message").textContent = "Investment context saved in this browser.";
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
  state.overviewNotice = "Proposal submitted successfully. It is now awaiting reviewer evaluation.";
  persistCustomProposals();
  form.reset();
  populateObjectives();
  renderAll();
  setActiveView("manager");
}

function renderAll() {
  renderAccount();
  renderOrganisationForm();
  renderObjectiveSuggestions();
  populateObjectives();
  renderSummary();
  renderRoleWorkspace();
  renderResults();
  renderScenario();
  renderDetail();
  renderReviewQueue();
  renderShortlistWorkspace();
  renderInsightsWorkspace();
  renderSettingsWorkspace();
  renderTestHarness();
}

function bindEvents() {
  $("#account-form").addEventListener("submit", saveAccount);
  $("#organisation-form").addEventListener("submit", saveOrganisation);
  $("#add-objective").addEventListener("click", () => {
    const current = objectiveDraftValues();
    renderObjectiveFields([...current, ""]);
    $$('[data-objective-input]').at(-1)?.focus();
  });
  $("#proposal-form").addEventListener("submit", submitProposal);
  $("#open-test-mode").addEventListener("click", openTestMode);
  $("#reset-test-data").addEventListener("click", resetTestData);
  $("#run-quick-checks").addEventListener("click", runQuickChecks);
  $$('[data-workspace-view-button]').forEach((button) => button.addEventListener("click", () => setActiveView(button.dataset.workspaceViewButton)));
  $("#proposal-search").addEventListener("input", (event) => { state.query = event.target.value; renderResults(); });
  $("#objective-filter").addEventListener("change", (event) => { state.objective = event.target.value; renderResults(); });
  $("#feasibility-filter").addEventListener("change", (event) => { state.feasibility = Number(event.target.value); renderResults(); });
  $("#risk-filter").addEventListener("change", (event) => { state.risk = Number(event.target.value); renderResults(); });
  $("#cost-filter").addEventListener("change", (event) => { state.cost = event.target.value; renderResults(); });
  $("#status-filter").addEventListener("change", (event) => { state.status = event.target.value; renderResults(); });
  $("#sort-select").addEventListener("change", (event) => { state.sort = event.target.value; renderResults(); });
  $("#clear-compare").addEventListener("click", () => { state.compared.clear(); renderAll(); });
  $("#open-compare").addEventListener("click", openComparison);
  $$('[data-open-scenarios]').forEach((button) => button.addEventListener("click", () => setActiveView("scenarios")));
  $$('[data-open-organisation]').forEach((button) => button.addEventListener("click", () => setActiveView("organisation")));
  $$('[data-open-account]').forEach((button) => button.addEventListener("click", () => setActiveView("account")));
  $$('[data-open-proposer]').forEach((button) => button.addEventListener("click", () => setActiveView("proposer")));
  $$('[data-open-reviewer]').forEach((button) => button.addEventListener("click", () => setActiveView("reviewer")));
  $$('[data-return-overview]').forEach((button) => button.addEventListener("click", () => setActiveView("manager")));
  $$('[data-open-shortlist]').forEach((button) => button.addEventListener("click", () => setActiveView("shortlist")));
  $("[data-close-dialog]").addEventListener("click", () => compareDialog.close());
  $("[data-close-review]").addEventListener("click", () => reviewDialog.close());
  $("#save-note").addEventListener("click", saveReview);
  [compareDialog, reviewDialog].forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      setActiveView("manager");
      $("#proposal-search").focus();
    }
  });
}

loadStoredEvaluations();
configureTestMode();
bindEvents();
renderAll();
setActiveView(TEST_MODE ? "tests" : state.activeView);

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
  const staff = Math.max(1, numberOr(scenario && scenario.staff, organisation.staff));
  return { projects, budget, staff, ...calculateScenario(projects, budget, staff) };
}

function renderShortlistWorkspace() {
  const workspace = $("#shortlist-workspace");
  if (!workspace) return;
  const evaluated = proposals.filter(isEvaluated);
  const selected = selectedProposals();
  workspace.innerHTML = `<div class="shortlist-toolbar"><label class="search-box search-box--compact"><span aria-hidden="true">⌕</span><input id="shortlist-search" type="search" placeholder="Search evaluated projects" value="${escapeHTML(state.shortlistQuery || "")}" /></label><div><strong>${selected.length}/4 selected</strong><button type="button" class="solid-button" data-continue-comparison ${selected.length >= 2 && selected.length <= 4 ? "" : "disabled"}>Continue to detailed comparison</button></div></div>
    <div class="shortlist-selected-summary">${selected.length ? selected.map((proposal) => `<button type="button" data-shortlist-remove="${escapeHTML(proposal.id)}" aria-label="Remove ${escapeHTML(proposal.title)} from shortlist" title="Remove from shortlist"><span>${escapeHTML(proposal.title)}</span><small>${money(proposal.cost)} · ${proposal.staff} FTE</small><i>×</i></button>`).join("") : "<p>No projects selected yet. Choose two to four evaluated projects.</p>"}</div>
    <div class="shortlist-card-grid">${evaluated.filter((proposal) => !state.shortlistQuery || `${proposal.title} ${proposal.owner} ${proposal.objective}`.toLowerCase().includes(state.shortlistQuery.toLowerCase())).map((proposal) => `<article class="shortlist-card ${state.compared.has(proposal.id) ? "is-selected" : ""}"><div><span class="objective-tag">${escapeHTML(proposal.objective)}</span><h4>${escapeHTML(proposal.title)}</h4><p>${escapeHTML(proposal.owner)} · ${escapeHTML(proposal.duration)}</p></div><dl><div><dt>Cost</dt><dd>${money(proposal.cost)}</dd></div><div><dt>Staff</dt><dd>${proposal.staff} FTE</dd></div></dl>${assessmentProfile(proposal)}<div class="shortlist-card-actions"><button type="button" class="outline-button" data-view-shortlist-detail="${escapeHTML(proposal.id)}">View Details</button><button type="button" class="${state.compared.has(proposal.id) ? "text-button" : "solid-button"}" data-shortlist-toggle="${escapeHTML(proposal.id)}">${state.compared.has(proposal.id) ? "Remove from shortlist" : "Add to shortlist"}</button></div></article>`).join("") || '<div class="workspace-empty"><h4>No evaluated projects found.</h4><p>Complete a reviewer evaluation or change the search.</p></div>'}</div>`;
  $("#shortlist-search").addEventListener("input", (event) => { state.shortlistQuery = event.target.value; renderShortlistWorkspace(); });
  workspace.querySelectorAll("[data-shortlist-toggle]").forEach((button) => button.addEventListener("click", () => toggleShortlist(button.dataset.shortlistToggle, !state.compared.has(button.dataset.shortlistToggle))));
  workspace.querySelectorAll("[data-shortlist-remove]").forEach((button) => button.addEventListener("click", () => toggleShortlist(button.dataset.shortlistRemove, false)));
  workspace.querySelectorAll("[data-view-shortlist-detail]").forEach((button) => button.addEventListener("click", () => { state.selectedId = button.dataset.viewShortlistDetail; setActiveView("insights"); }));
  workspace.querySelector("[data-continue-comparison]").addEventListener("click", openComparison);
}

function renderInsightsWorkspace() {
  const workspace = $("#insights-workspace");
  if (!workspace) return;
  const evaluated = proposals.filter(isEvaluated);
  if (!evaluated.length) {
    workspace.innerHTML = '<div class="workspace-empty"><h4>No evaluated projects yet.</h4><p>Complete a reviewer evaluation before opening criterion insights.</p><button type="button" class="solid-button" data-open-reviewer>Open reviewer queue</button></div>';
    workspace.querySelector("[data-open-reviewer]").addEventListener("click", () => setActiveView("reviewer"));
    return;
  }
  let proposal = evaluated.find((item) => item.id === state.selectedId) || evaluated[0];
  workspace.innerHTML = `<div class="insights-selector"><label>Selected project<select id="insights-project-select">${evaluated.map((item) => `<option value="${escapeHTML(item.id)}" ${item.id === proposal.id ? "selected" : ""}>${escapeHTML(item.title)}</option>`).join("")}</select></label><button type="button" class="outline-button" data-back-comparison>Back to Detailed Comparison</button></div>
    <section class="insights-project-summary"><div><p class="section-kicker">Project profile</p><h4>${escapeHTML(proposal.title)}</h4><p>${escapeHTML(proposal.summary)}</p></div><dl><div><dt>Cost</dt><dd>${money(proposal.cost)}</dd></div><div><dt>Staff</dt><dd>${proposal.staff} FTE</dd></div><div><dt>Timeline</dt><dd>${escapeHTML(proposal.duration)}</dd></div><div><dt>Owner</dt><dd>${escapeHTML(proposal.owner)}</dd></div></dl></section>
    <div class="insights-profile-grid"><div class="single-radar">${radarSVG([proposal])}</div><div class="criterion-insight-list">${CRITERIA.map((criterion) => `<article><header><h4>${escapeHTML(criterion.label)}</h4><strong class="${scoreClass(proposal.scores[criterion.key])}">${proposal.scores[criterion.key]}/5</strong></header><p>${escapeHTML(proposal.rationales[criterion.key])}</p></article>`).join("")}</div></div>
    <div class="evidence-grid"><article><span>Expected benefits</span><p>${escapeHTML(proposal.benefits)}</p></article><article><span>Risks and constraints</span><p>${escapeHTML(proposal.risks)}</p></article><article><span>Overall reviewer notes</span><p>${escapeHTML(storage.get(`ppm-note-${proposal.id}`) || "No overall reviewer notes recorded.")}</p></article></div>`;
  $("#insights-project-select").addEventListener("change", (event) => { state.selectedId = event.target.value; renderInsightsWorkspace(); });
  workspace.querySelector("[data-back-comparison]").addEventListener("click", () => setActiveView("comparison"));
}

function renderComparisonWorkspace() {
  const workspace = $("#comparison-workspace");
  if (!workspace) return;
  const selected = selectedProposals();
  if (selected.length < 2) {
    workspace.innerHTML = '<div class="workspace-empty"><p class="section-kicker">Comparison set</p><h4>' + (selected.length || "No") + ' project' + (selected.length === 1 ? "" : "s") + ' selected</h4><p>Shortlist two to four evaluated proposals to begin a comparison.</p><button type="button" class="solid-button" data-open-shortlist>Open Compare &amp; Shortlist</button></div>';
    workspace.querySelector("[data-open-shortlist]").addEventListener("click", () => setActiveView("shortlist"));
    return;
  }
  const cards = selected.map((proposal) => '<article><span class="objective-tag">' + escapeHTML(proposal.objective) + '</span><h4>' + escapeHTML(proposal.title) + '</h4><p>' + money(proposal.cost) + ' · ' + proposal.staff + ' FTE · ' + scenarioLink(proposal) + '</p><button type="button" data-remove-comparison-project="' + escapeHTML(proposal.id) + '">Remove from shortlist</button></article>').join("");
  const strengths = CRITERIA.map((criterion) => {
    const highest = Math.max(...selected.map((proposal) => Number(proposal.scores[criterion.key])));
    const names = selected.filter((proposal) => Number(proposal.scores[criterion.key]) === highest).map((proposal) => proposal.title).join(", ");
    return '<li><span>' + escapeHTML(criterion.short) + '</span><strong>' + escapeHTML(names) + ' · ' + highest + '/5</strong></li>';
  }).join("");
  const legend = selected.map((proposal, index) => '<span><i class="legend-colour-' + index + '"></i>' + escapeHTML(proposal.title) + '</span>').join("");
  const header = CRITERIA.map((criterion) => '<th>' + escapeHTML(criterion.short) + '</th>').join("");
  const rows = selected.map((proposal) => '<tr><th>' + escapeHTML(proposal.title) + '</th>' + CRITERIA.map((criterion) => '<td><span class="score-cell ' + scoreClass(proposal.scores[criterion.key]) + '">' + proposal.scores[criterion.key] + '</span></td>').join("") + '<td>' + money(proposal.cost) + '</td><td>' + proposal.staff + ' FTE</td><td>' + escapeHTML(proposal.duration) + '</td><td>' + scenarioLink(proposal) + '</td></tr>').join("");
  workspace.innerHTML = '<div class="comparison-selected-strip">' + cards + '</div><div class="comparison-stage"><section class="comparison-radar-panel"><div class="comparison-panel-heading"><p class="section-kicker">Five-criterion profile</p><strong>Overlay view</strong></div><div class="workspace-radar">' + radarSVG(selected) + '</div><div class="workspace-legend">' + legend + '</div></section><aside class="comparison-tradeoffs"><p class="section-kicker">Recorded strengths</p><h4>Read the trade-offs, not a winner.</h4><p>The chart helps the Portfolio Manager discuss strengths, trade-offs, cost, timeline, resources, and reviewer evidence.</p><ul>' + strengths + '</ul></aside></div><div class="comparison-score-table"><div class="comparison-panel-heading"><p class="section-kicker">Side-by-side detail</p><button type="button" class="text-button" data-open-shortlist>Change shortlist</button></div><div class="comparison-table-wrap"><table class="comparison-table"><thead><tr><th>Project</th>' + header + '<th>Cost</th><th>Staff</th><th>Timeline</th><th>Scenario</th></tr></thead><tbody>' + rows + '</tbody></table></div></div><div class="comparison-next-actions"><button type="button" class="outline-button" data-view-insights>View Criterion Details</button><button type="button" class="solid-button" data-open-scenarios>Add Selected Projects to Portfolio Scenario</button><button type="button" class="text-button" data-open-shortlist>Back</button></div>';
  workspace.querySelectorAll("[data-remove-comparison-project]").forEach((button) => button.addEventListener("click", () => toggleShortlist(button.dataset.removeComparisonProject, false)));
  workspace.querySelectorAll("[data-open-shortlist]").forEach((button) => button.addEventListener("click", () => setActiveView("shortlist")));
  workspace.querySelector("[data-open-scenarios]").addEventListener("click", () => { state.scenarioDraft = new Set(selected.map((proposal) => proposal.id)); setActiveView("scenarios"); });
  workspace.querySelector("[data-view-insights]").addEventListener("click", () => { state.selectedId = selected[0].id; setActiveView("insights"); });
  workspace.querySelectorAll("[data-open-project-scenario]").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    const name = link.dataset.openProjectScenario;
    setActiveView("scenarios");
    requestAnimationFrame(() => Array.from(document.querySelectorAll("[data-scenario-card]")).find((card) => card.dataset.scenarioCard === name)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }));
}

function renderScenarioWorkspace() {
  const workspace = $("#scenario-workspace");
  if (!workspace) return;
  if (!state.scenarioDraft.size && state.compared.size) state.scenarioDraft = new Set(selectedProposals().map((proposal) => proposal.id));
  const available = selectedProposals();
  const selected = proposals.filter((proposal) => state.scenarioDraft.has(proposal.id) && isEvaluated(proposal));
  const totals = calculateScenario(selected);
  const availableCards = available.length ? available.map((proposal) => `<article class="scenario-builder-project ${state.scenarioDraft.has(proposal.id) ? "is-selected" : ""}"><div><strong>${escapeHTML(proposal.title)}</strong><small>${escapeHTML(proposal.objective)} · ${money(proposal.cost)} · ${proposal.staff} FTE</small></div><button type="button" data-toggle-scenario-project="${escapeHTML(proposal.id)}">${state.scenarioDraft.has(proposal.id) ? "Remove from scenario" : "Add to scenario"}</button></article>`).join("") : '<div class="workspace-list-empty">No shortlisted projects yet. Use Compare &amp; Shortlist first.</div>';
  const selectedCards = selected.length ? selected.map((proposal) => `<article><span>${escapeHTML(proposal.title)}</span><strong>${money(proposal.cost)} · ${proposal.staff} FTE</strong><button type="button" data-toggle-scenario-project="${escapeHTML(proposal.id)}" aria-label="Remove ${escapeHTML(proposal.title)} from scenario" title="Remove from scenario">×</button></article>`).join("") : '<p class="workspace-list-empty">Add projects from the shortlist to build this scenario.</p>';
  const scenarioCards = Object.entries(state.scenarios || {}).map(([name, scenario]) => {
    const summary = scenarioSummary(scenario);
    const status = summary.budgetOk && summary.staffOk ? "Within limits" : "Needs revision";
    return `<article class="saved-scenario-card ${summary.budgetOk && summary.staffOk ? "is-feasible" : "is-warning"}" data-scenario-card="${escapeHTML(name)}"><p class="section-kicker">Saved scenario</p><h4>${escapeHTML(name)}</h4><dl><div><dt>Projects</dt><dd>${summary.projects.length}</dd></div><div><dt>Cost</dt><dd>${money(summary.totalCost)}</dd></div><div><dt>Staff</dt><dd>${summary.totalStaff} FTE</dd></div><div><dt>Status</dt><dd>${status}</dd></div></dl><button type="button" class="text-button" data-load-scenario="${escapeHTML(name)}">Load for comparison</button></article>`;
  }).join("") || '<div class="workspace-list-empty">No saved scenarios yet.</div>';
  workspace.innerHTML = `<div class="scenario-builder-grid"><section class="scenario-builder-source"><p class="section-kicker">Available shortlist</p><h4>Add or remove evaluated projects</h4>${availableCards}<button type="button" class="text-button" data-open-shortlist>Change shortlist</button></section><section class="scenario-builder-canvas"><label>Scenario name<input id="scenario-name" maxlength="80" placeholder="e.g. Service Improvement Plan" value="${escapeHTML(state.scenarioDraftName)}" /></label><div class="scenario-builder-selected">${selectedCards}</div><div class="scenario-builder-totals"><article><span>Total cost</span><strong>${money(totals.totalCost)}</strong><small>${totals.budgetOk ? `Within ${money(organisation.budget)}` : `${money(totals.totalCost - organisation.budget)} over budget`}</small></article><article><span>Required staff</span><strong>${totals.totalStaff} FTE</strong><small>${totals.staffOk ? `Within ${organisation.staff} FTE` : `${totals.totalStaff - organisation.staff} FTE over capacity`}</small></article></div><div class="constraint-result ${selected.length && totals.budgetOk && totals.staffOk ? "is-feasible" : selected.length ? "is-warning" : ""}">${!selected.length ? "Add projects to check constraints." : totals.budgetOk && totals.staffOk ? "<strong>Within current constraints</strong><span>This is a feasibility signal, not an automatic recommendation.</span>" : "<strong>Constraint warning</strong><span>Revise the project mix or resource limits before deciding.</span>"}</div><div class="form-action-row"><button type="button" class="solid-button" data-save-scenario ${selected.length ? "" : "disabled"}>Save scenario</button><button type="button" class="outline-button" data-open-reports>Continue to Portfolio Overview</button><p id="scenario-save-message" class="save-message" role="status"></p></div></section></div><section class="saved-scenario-section"><div><p class="section-kicker">Saved in this browser</p><h4>Candidate portfolio scenarios</h4></div><div class="scenario-saved-grid">${scenarioCards}</div></section>`;
  $("#scenario-name").addEventListener("input", (event) => { state.scenarioDraftName = event.target.value; });
  workspace.querySelectorAll("[data-toggle-scenario-project]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.toggleScenarioProject;
    if (state.scenarioDraft.has(id)) state.scenarioDraft.delete(id); else state.scenarioDraft.add(id);
    renderScenarioWorkspace();
  }));
  workspace.querySelector("[data-save-scenario]")?.addEventListener("click", () => {
    const name = state.scenarioDraftName.trim();
    if (!name) { $("#scenario-save-message").textContent = "Enter a scenario name before saving."; $("#scenario-name").focus(); return; }
    state.scenarios[name] = { projectIds: [...state.scenarioDraft], budget: organisation.budget, staff: organisation.staff };
    storage.set(STORAGE.scenarios, JSON.stringify(state.scenarios));
    renderAll();
    renderScenarioWorkspace();
    $("#scenario-save-message").textContent = `“${name}” saved in this browser.`;
  });
  workspace.querySelector("[data-open-shortlist]").addEventListener("click", () => setActiveView("shortlist"));
  workspace.querySelector("[data-open-reports]").addEventListener("click", () => setActiveView("reports"));
  workspace.querySelectorAll("[data-load-scenario]").forEach((button) => button.addEventListener("click", () => {
    const scenario = state.scenarios[button.dataset.loadScenario];
    state.compared = new Set((scenario?.projectIds || []).filter((id) => proposals.some((proposal) => proposal.id === id && isEvaluated(proposal))));
    setActiveView("comparison");
  }));
}

function renderDecisionWorkspace() {
  const workspace = $("#decision-workspace");
  if (!workspace) return;
  const outcomes = ["Approved", "Deferred", "Rejected"];
  const columns = outcomes.map((outcome) => { const records = proposals.filter((proposal) => state.decisions[proposal.id] && state.decisions[proposal.id].decision === outcome); const cards = records.map((proposal) => '<article><p class="section-kicker">Scenario ' + escapeHTML(state.decisions[proposal.id].scenario || "—") + '</p><h4>' + escapeHTML(proposal.title) + '</h4><p>' + escapeHTML(proposal.summary) + '</p><button type="button" class="text-button" data-open-decision-project="' + escapeHTML(proposal.id) + '">Review rationale</button></article>').join("") || '<div class="decision-empty">No ' + outcome.toLowerCase() + ' projects recorded yet.</div>'; return '<section class="decision-column"><header><span class="status-pill">' + outcome + '</span><strong>' + records.length + '</strong></header>' + cards + '</section>'; }).join("");
  workspace.innerHTML = '<div class="decision-status-row"><article><span>Defined scenarios</span><strong>' + Object.keys(state.scenarios || {}).length + '</strong><small>available for decision context</small></article><article><span>Recorded decisions</span><strong>' + Object.keys(state.decisions || {}).length + '</strong><small>kept in this browser</small></article><article><span>Next step</span><strong>Review evidence</strong><small>then make a human decision</small></article></div><div class="decision-board">' + columns + '</div><div class="decision-audit-note"><p class="section-kicker">Decision trail</p><p>Decisions stay connected to the reviewer rationale and assigned scenario. The final outcome remains human-led.</p><button type="button" class="outline-button" data-open-overview>Open portfolio overview</button></div>';
  workspace.querySelectorAll("[data-open-decision-project]").forEach((button) => button.addEventListener("click", () => { state.selectedId = button.dataset.openDecisionProject; setActiveView("manager"); }));
  workspace.querySelector("[data-open-overview]").addEventListener("click", () => setActiveView("manager"));
}

function renderReportWorkspace() {
  const workspace = $("#report-workspace");
  if (!workspace) return;
  const evaluated = proposals.filter(isEvaluated);
  const objectives = [...new Set(proposals.map((proposal) => proposal.objective).filter(Boolean))];
  const scenarios = Object.entries(state.scenarios || {}).map(([name, scenario]) => { const summary = scenarioSummary(scenario); return '<article><p class="section-kicker">Scenario ' + escapeHTML(name) + '</p><strong>' + (summary.budgetOk && summary.staffOk ? "Within limits" : "Needs revision") + '</strong><span>' + summary.projects.length + ' projects · ' + money(summary.totalCost) + ' · ' + summary.totalStaff + ' FTE</span></article>'; }).join("") || '<article><p class="section-kicker">Portfolio scenarios</p><strong>Not configured</strong><span>Scenario definitions are not available.</span></article>';
  workspace.innerHTML = '<div class="report-metrics"><article><span>Proposals</span><strong>' + proposals.length + '</strong><small>' + evaluated.length + ' evaluated</small></article><article><span>Strategic objectives</span><strong>' + objectives.length + '</strong><small>' + escapeHTML(objectives.join(" · ") || "Not set") + '</small></article><article><span>Organisation limits</span><strong>' + money(organisation.budget) + '</strong><small>' + organisation.staff + ' FTE available</small></article></div><div class="report-scenarios"><div><p class="section-kicker">Defined scenario check</p><h4>Portfolio discussion notes</h4></div>' + scenarios + '</div><div class="report-note"><p class="section-kicker">What this page does</p><p>A compact local snapshot for the team discussion. It does not calculate an automatic recommendation or replace reviewer rationale.</p><button type="button" class="solid-button" data-open-scenarios>Review scenarios</button></div>';
  workspace.querySelector("[data-open-scenarios]").addEventListener("click", () => setActiveView("scenarios"));
}

function renderSettingsWorkspace() {
  const workspace = $("#settings-workspace");
  if (!workspace) return;
  workspace.innerHTML = `<section><p class="section-kicker">Active account</p><h4>${escapeHTML(activeAccount?.displayName || "Not selected")}</h4><p>${escapeHTML(activeAccount?.role || "Choose a prototype role")}</p><button type="button" class="outline-button" data-open-account>Manage account</button></section><section><p class="section-kicker">Investment context</p><h4>${escapeHTML(organisation.name)}</h4><p>${activeObjectives().length} objectives · ${money(organisation.budget)} · ${organisation.staff} FTE</p><button type="button" class="outline-button" data-open-organisation>Update context</button></section><section><p class="section-kicker">Prototype scope</p><h4>Browser-local data</h4><p>Authentication, role permissions, enterprise integration, and production deployment are not included in this MVP.</p></section>`;
  workspace.querySelector("[data-open-account]").addEventListener("click", () => setActiveView("account"));
  workspace.querySelector("[data-open-organisation]").addEventListener("click", () => setActiveView("organisation"));
}

function openComparison() {
  if (selectedProposals().length < 2) { window.alert("Choose two to four evaluated projects before comparing them."); return; }
  setActiveView("comparison");
}

function setActiveView(view) {
  const knownViews = ["account", "organisation", "proposer", "reviewer", "manager", "shortlist", "comparison", "insights", "scenarios", "decisions", "reports", "settings", "help", "tests"];
  if (!knownViews.includes(view)) return;
  state.activeView = view;
  $$('[data-workspace-view]').forEach((section) => { section.hidden = section.dataset.workspaceView !== view; });
  $$('[data-workspace-view-button]').forEach((button) => { if (button.dataset.workspaceViewButton === view) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current"); });
  const testButton = $("#open-test-mode"); if (testButton) testButton.setAttribute("aria-pressed", String(view === "tests"));
  if (view === "manager") renderAll();
  if (view === "account") renderAccount();
  if (view === "reviewer") renderReviewQueue();
  if (view === "organisation") { renderOrganisationForm(); renderObjectiveSuggestions(); }
  if (view === "proposer") populateObjectives();
  if (view === "shortlist") renderShortlistWorkspace();
  if (view === "comparison") renderComparisonWorkspace();
  if (view === "insights") renderInsightsWorkspace();
  if (view === "scenarios") renderScenarioWorkspace();
  if (view === "decisions") renderDecisionWorkspace();
  if (view === "reports") renderReportWorkspace();
  if (view === "settings") renderSettingsWorkspace();
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
  if (!window.confirm("Delete proposal “" + proposal.title + "” from this browser? This also removes its local evaluation, shortlist and scenario references, and recorded decision.")) return;
  proposals.splice(index, 1);
  ppmRemovedProposalIds.add(id);
  state.compared.delete(id);
  if (state.selectedId === id) state.selectedId = null;
  Object.entries(state.scenarios || {}).forEach(([name, scenario]) => {
    const ids = Array.isArray(scenario && scenario.projectIds) ? scenario.projectIds : [];
    state.scenarios[name] = { ...scenario, projectIds: ids.filter((projectId) => projectId !== id) };
  });
  delete state.decisions[id];
  persistCustomProposals();
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
      actions.append(ppmRemoveButton("Delete proposal", "data-ppm-remove-proposal", id, "Delete proposal"));
    }
  });
  $$(".review-queue-card").forEach((card) => {
    const title = card.querySelector("h4") && card.querySelector("h4").textContent;
    const proposal = proposals.find((item) => item.title === title);
    const actions = card.querySelector(".review-queue-actions");
    if (proposal && actions && !actions.querySelector("[data-delete-proposal], [data-ppm-remove-proposal]")) {
      actions.append(ppmRemoveButton("Delete proposal", "data-ppm-remove-proposal", proposal.id, "Delete proposal"));
    }
  });
  const detailActions = $(".insight-header > div:last-child");
  if (detailActions && state.selectedId && !detailActions.querySelector("[data-delete-proposal], [data-ppm-remove-proposal]")) {
    detailActions.append(ppmRemoveButton("Delete proposal", "data-ppm-remove-proposal", state.selectedId, "Delete proposal"));
  }
}

function applyPersistedProposalRemovals() {
  if (!ppmRemovedProposalIds.size) return;
  for (let index = proposals.length - 1; index >= 0; index -= 1) {
    if (ppmRemovedProposalIds.has(proposals[index].id)) proposals.splice(index, 1);
  }
  state.compared = new Set([...state.compared].filter((id) => proposals.some((proposal) => proposal.id === id)));
  Object.entries(state.scenarios || {}).forEach(([name, scenario]) => {
    const ids = Array.isArray(scenario && scenario.projectIds) ? scenario.projectIds : [];
    state.scenarios[name] = { ...scenario, projectIds: ids.filter((id) => proposals.some((proposal) => proposal.id === id)) };
  });
  if (!proposals.some((proposal) => proposal.id === state.selectedId)) state.selectedId = null;
  persistCustomProposals();
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
