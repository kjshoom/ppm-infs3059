(() => {
  "use strict";

  const USERS_KEY = "ppm-local-users-v1";
  const ACTIVE_KEY = "ppm-local-active-user-v1";
  const APP_ACCOUNTS_KEY = "ppm-v2-prototype-accounts";
  const APP_ACTIVE_KEY = "ppm-v2-active-account";
  const REMOTE_TOKEN_KEY = "ppm-auth-session-v1";
  const REMOTE_USER_KEY = "ppm-auth-user-v1";
  const DEMO_ROLE_KEY = "ppm-demo-role-v1";
  const DEMO_MODE_KEY = "ppm-demo-mode-v1";
  const PAGE_VERSION = "20261029-team-workspace-v1";
  const ROLE_SELECT_URL = pageURL("role-select.html");
  const ASSISTED_MODE_PREFIX = "ppm-assisted-mode-v1:";
  const ITERATIONS = 210000;
  const $ = (selector) => document.querySelector(selector);

  function apiBase() {
    return String(window.PPM_CONFIG?.apiBaseUrl || "").trim().replace(/\/+$/, "");
  }

  function remoteToken() {
    try { return sessionStorage.getItem(REMOTE_TOKEN_KEY) || ""; } catch { return ""; }
  }

  function readCachedRemoteUser() {
    try {
      const user = JSON.parse(sessionStorage.getItem(REMOTE_USER_KEY) || "null");
      return user && user.id && user.name && user.email ? user : null;
    } catch { return null; }
  }

  async function apiRequest(path, { method = "GET", body, token } = {}) {
    if (!apiBase()) throw new Error("The shared account service has not been configured yet.");
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    let response;
    try {
      response = await fetch(`${apiBase()}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      throw new Error("The account service could not be reached. Try again in a moment.");
    }
    let payload = {};
    try { payload = await response.json(); } catch { /* A status-based message is used below. */ }
    if (!response.ok) {
      if (response.status === 401) throw new Error(payload.message || "Email or password is incorrect.");
      if (response.status === 409) throw new Error(payload.message || "An account with this email already exists.");
      throw new Error(payload.message || `The account service returned an error (${response.status}).`);
    }
    return payload;
  }

  function readUsers() {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      return Array.isArray(users) ? users : [];
    } catch { return []; }
  }

  function localUser() {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    const user = readUsers().find((entry) => entry.id === activeId);
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  function currentUser() {
    return apiBase() ? readCachedRemoteUser() : localUser();
  }

  function demoRole() {
    try {
      const role = sessionStorage.getItem(DEMO_ROLE_KEY);
      return ["Project Proposer", "Reviewer", "Portfolio Manager"].includes(role) ? role : "";
    } catch { return ""; }
  }

  function isDemoMode() {
    try { return sessionStorage.getItem(DEMO_MODE_KEY) === "true"; } catch { return false; }
  }

  function setDemoMode(enabled) {
    try { sessionStorage.setItem(DEMO_MODE_KEY, String(Boolean(enabled))); } catch { /* Role selection reports storage failure. */ }
  }

  function setDemoRole(role) {
    if (!["Project Proposer", "Reviewer", "Portfolio Manager"].includes(role)) throw new Error("Choose one of the available roles.");
    sessionStorage.setItem(DEMO_ROLE_KEY, role);
    setDemoMode(true);
  }

  function assistanceProfileId() {
    return isDemoMode() ? "demo" : currentUser()?.id || "demo";
  }

  function isAssistedMode(profileId = assistanceProfileId()) {
    try { return localStorage.getItem(`${ASSISTED_MODE_PREFIX}${profileId}`) !== "false"; } catch { return true; }
  }

  function setAssistedMode(enabled, profileId = assistanceProfileId()) {
    localStorage.setItem(`${ASSISTED_MODE_PREFIX}${profileId}`, enabled ? "true" : "false");
    window.dispatchEvent(new CustomEvent("ppm:assisted-mode-changed", { detail: { enabled: Boolean(enabled) } }));
  }

  function syncWorkspaceProfile(user) {
    if (!user) {
      localStorage.removeItem(APP_ACTIVE_KEY);
      return;
    }
    let accounts = [];
    try { accounts = JSON.parse(localStorage.getItem(APP_ACCOUNTS_KEY) || "[]"); } catch { accounts = []; }
    if (!Array.isArray(accounts)) accounts = [];
    const record = {
      id: user.id,
      displayName: user.name,
      role: user.role,
      email: user.email,
      createdAt: user.createdAt || new Date().toISOString()
    };
    const index = accounts.findIndex((account) => account.id === user.id);
    if (index >= 0) accounts[index] = { ...accounts[index], ...record };
    else accounts.push(record);
    localStorage.setItem(APP_ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.setItem(APP_ACTIVE_KEY, JSON.stringify(user.id));
  }

  function removeWorkspaceProfile(userId) {
    let accounts = [];
    try { accounts = JSON.parse(localStorage.getItem(APP_ACCOUNTS_KEY) || "[]"); } catch { accounts = []; }
    if (Array.isArray(accounts)) {
      localStorage.setItem(APP_ACCOUNTS_KEY, JSON.stringify(accounts.filter((account) => account.id !== userId)));
    }
    if (localStorage.getItem(APP_ACTIVE_KEY) === JSON.stringify(userId)) localStorage.removeItem(APP_ACTIVE_KEY);
    const workspaceOwner = localStorage.getItem("ppm-v2-workspace-owner") || "";
    if (workspaceOwner === userId || workspaceOwner.startsWith(`${userId}|`)) {
      const exactWorkspaceKeys = new Set([
        "ppm-organisation", "ppm-v2-custom-proposals", "ppm-v2-evaluation-comments",
        "ppm-v2-shortlist", "ppm-v2-scenarios", "ppm-v2-decisions",
        "ppm-v2-scenario-decisions", "ppm-v2-removed-proposals"
      ]);
      const workspaceKeys = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && (exactWorkspaceKeys.has(key) || key.startsWith("ppm-evaluation-") || key.startsWith("ppm-note-"))) workspaceKeys.push(key);
      }
      workspaceKeys.forEach((key) => localStorage.removeItem(key));
      localStorage.removeItem("ppm-v2-workspace-owner");
      localStorage.removeItem("ppm-v2-workspace-pending");
    }
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function avatarName(name) {
    const firstName = String(name || "?").trim().split(/\s+/)[0] || "?";
    return firstName.length > 8 ? `${firstName.slice(0, 7)}…` : firstName;
  }

  function pageURL(page) {
    return `./${page}?v=${PAGE_VERSION}`;
  }

  function authURL(mode = "login", returnTo = "workplace.html") {
    const params = new URLSearchParams({ mode, return: returnTo, v: PAGE_VERSION });
    return `./login.html?${params.toString()}`;
  }

  function renderAuthSlot(slot, user, serviceUnavailable = false) {
    const role = demoRole();
    if (isDemoMode() && role) {
      slot.hidden = false;
      slot.innerHTML = `<div class="profile-control"><button class="profile-avatar demo-profile-trigger" type="button" aria-label="Account menu" title="Account" aria-expanded="false"><svg viewBox="0 0 34 34" fill="currentColor" aria-hidden="true" focusable="false"><g transform="translate(2 -1.8)"><circle cx="11" cy="8" r="5.2"/><path d="M11 15c-5.3 0-9.5 3.9-9.5 8.7V25h13a9.6 9.6 0 0 1 4.8-9.4A14.5 14.5 0 0 0 11 15Z"/><path class="demo-profile-gear" fill-rule="evenodd" d="M29.73 21.63L30.06 22.71L31.88 22.61L31.88 25.39L30.06 25.29L29.73 26.37L29.20 27.38L30.55 28.59L28.59 30.55L27.38 29.20L26.37 29.73L25.29 30.06L25.39 31.88L22.61 31.88L22.71 30.06L21.63 29.73L20.62 29.20L19.41 30.55L17.45 28.59L18.80 27.38L18.27 26.37L17.94 25.29L16.12 25.39L16.12 22.61L17.94 22.71L18.27 21.63L18.80 20.62L17.45 19.41L19.41 17.45L20.62 18.80L21.63 18.27L22.71 17.94L22.61 16.12L25.39 16.12L25.29 17.94L26.37 18.27L27.38 18.80L28.59 17.45L30.55 19.41L29.20 20.62Z M27.1 24a3.1 3.1 0 1 0-6.2 0a3.1 3.1 0 1 0 6.2 0Z"/></g></svg></button><section class="profile-menu" hidden aria-label="Demo settings"><button class="profile-menu-close" type="button" aria-label="Close settings">×</button><div class="profile-summary"><div><strong>Sample workspace</strong><span>Read-only demo</span><small>${escapeHTML(role)}</small></div></div><label class="profile-mode-toggle"><input type="checkbox" data-assisted-mode-toggle ${isAssistedMode("demo") ? "checked" : ""}><span><strong>Assisted mode</strong><small>Show guidance for the current step.</small></span></label><a class="profile-menu-action" href="${ROLE_SELECT_URL}"><span aria-hidden="true">↔</span> Change demo role</a><a class="profile-menu-action" href="${user ? pageURL("workplace.html") : authURL("login")}" data-use-account-sign-in><span aria-hidden="true">↗</span> ${user ? "Return to your workplace" : "Sign in"}</a></section></div>`;
      slot.querySelector(".profile-mode-toggle")?.remove();
      const trigger = slot.querySelector(".profile-avatar[aria-expanded]");
      const menu = slot.querySelector(".profile-menu");
      const close = () => { menu.hidden = true; trigger.setAttribute("aria-expanded", "false"); };
      trigger.addEventListener("click", () => {
        menu.hidden = !menu.hidden;
        trigger.setAttribute("aria-expanded", String(!menu.hidden));
      });
      slot.querySelector(".profile-menu-close").addEventListener("click", close);
      slot.querySelector("[data-use-account-sign-in]").addEventListener("click", () => setDemoMode(false));
      document.addEventListener("click", (event) => { if (!slot.contains(event.target)) close(); });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
      return;
    }
    if (!user) {
      slot.hidden = false;
      slot.innerHTML = `<a class="auth-sign-in-link" href="${authURL("login")}">Sign in</a>`;
      slot.querySelector("a").addEventListener("click", () => setDemoMode(false));
      return;
    }
    slot.hidden = false;
    const shared = Boolean(apiBase());
    slot.innerHTML = `<div class="profile-control"><button class="profile-avatar" type="button" aria-label="${escapeHTML(user.name)} account" aria-expanded="false"><span>${escapeHTML(avatarName(user.name))}</span></button><section class="profile-menu" hidden aria-label="Signed-in account"><button class="profile-menu-close" type="button" aria-label="Close account menu">×</button><div class="profile-summary"><span class="profile-avatar profile-avatar-large">${escapeHTML(avatarName(user.name))}</span><div><strong>${escapeHTML(user.name)}</strong><span>${escapeHTML(user.email)}</span><small>${escapeHTML(user.role)}</small></div></div><label class="profile-mode-toggle"><input type="checkbox" data-assisted-mode-toggle ${isAssistedMode(user.id) ? "checked" : ""}><span><strong>Assisted mode</strong><small>Show guidance for the current step.</small></span></label><a class="profile-menu-action" href="${pageURL("account.html")}"><span aria-hidden="true">⚙</span> Manage your PPM account</a><a class="profile-menu-action" href="${ROLE_SELECT_URL}"><span aria-hidden="true">↗</span> Explore the sample demo</a><a class="profile-menu-action" href="${authURL("login")}"><span aria-hidden="true">＋</span> Add another account</a><button class="profile-menu-action profile-signout" type="button"><span aria-hidden="true">↪</span> Sign out</button><p class="profile-menu-note">${shared ? "Account available on your other devices" : "Saved in this browser"}</p></section></div>`;
    slot.querySelector(".profile-mode-toggle")?.remove();
    const trigger = slot.querySelector(".profile-avatar[aria-expanded]");
    const menu = slot.querySelector(".profile-menu");
    const close = () => { menu.hidden = true; trigger.setAttribute("aria-expanded", "false"); };
    trigger.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
      trigger.setAttribute("aria-expanded", String(!menu.hidden));
    });
    slot.querySelector(".profile-menu-close").addEventListener("click", close);
    slot.querySelector(".profile-signout").addEventListener("click", async () => {
      const token = remoteToken();
      if (apiBase() && token) {
        try { await apiRequest("/api/auth/logout", { method: "POST", token }); } catch { /* Sign out locally even when offline. */ }
        try { sessionStorage.removeItem(REMOTE_TOKEN_KEY); sessionStorage.removeItem(REMOTE_USER_KEY); } catch { /* Ignore unavailable session storage. */ }
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
      syncWorkspaceProfile(null);
      setDemoMode(false);
      window.location.assign(pageURL("index.html"));
    });
    document.addEventListener("click", (event) => { if (!slot.contains(event.target)) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
  }

  async function initHeader() {
    const slots = [...document.querySelectorAll(".auth-slot")];
    if (new URLSearchParams(window.location.search).has("mvpTest")) {
      slots.forEach((slot) => { slot.hidden = true; });
      return null;
    }
    if (!apiBase()) {
      const user = localUser();
      syncWorkspaceProfile(user);
      slots.forEach((slot) => renderAuthSlot(slot, user));
      routeWorkplaceLinks(user);
      return user;
    }
    let user = null;
    let serviceUnavailable = false;
    const token = remoteToken();
    if (token) {
      try {
        user = await apiRequest("/api/auth/me", { token });
        sessionStorage.setItem(REMOTE_USER_KEY, JSON.stringify(user));
        syncWorkspaceProfile(user);
      } catch (error) {
        serviceUnavailable = error instanceof Error && error.message.includes("could not be reached");
        if (!serviceUnavailable) {
          sessionStorage.removeItem(REMOTE_TOKEN_KEY);
          sessionStorage.removeItem(REMOTE_USER_KEY);
          syncWorkspaceProfile(null);
        }
        user = serviceUnavailable ? readCachedRemoteUser() : null;
      }
    } else {
      syncWorkspaceProfile(null);
    }
    slots.forEach((slot) => renderAuthSlot(slot, user, serviceUnavailable));
    routeWorkplaceLinks(user);
    return user;
  }

  function routeWorkplaceLinks(user = currentUser()) {
    const hasWorkplace = user && ["Project Proposer", "Reviewer", "Portfolio Manager"].includes(user.role) && !isDemoMode();
    document.querySelectorAll("[data-enter-workplace]").forEach((link) => { link.href = hasWorkplace ? pageURL("workplace.html") : ROLE_SELECT_URL; });
  }

  function refreshHeader() {
    document.querySelectorAll(".auth-slot").forEach((slot) => renderAuthSlot(slot, currentUser()));
    routeWorkplaceLinks();
  }

  function updateLocalProfile(user, { name, email, role }) {
    const users = readUsers();
    const index = users.findIndex((entry) => entry.id === user.id);
    if (index < 0) throw new Error("This browser account could not be found. Please sign in again.");
    if (users.some((entry) => entry.id !== user.id && entry.email.toLocaleLowerCase() === email)) {
      throw new Error("An account with this email already exists in this browser.");
    }
    const updated = { ...users[index], name, email, role };
    users.splice(index, 1, updated);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(ACTIVE_KEY, updated.id);
    return { id: updated.id, name: updated.name, email: updated.email, role: updated.role, createdAt: updated.createdAt };
  }

  function setTeamMessage(text, state = "") {
    const message = $("#team-message");
    if (!message) return;
    message.textContent = text;
    message.dataset.state = state;
  }

  function renderTeam(team, user) {
    const loading = $("#team-loading");
    const empty = $("#team-no-membership");
    const current = $("#team-current");
    loading.hidden = true;
    empty.hidden = Boolean(team);
    current.hidden = !team;
    $("#team-count-pill").hidden = !team;
    if (!team) return;

    $("#team-name-display").textContent = team.name;
    $("#team-role-display").textContent = team.role === "OWNER" ? "Owner" : "Member";
    $("#team-count-pill").textContent = `${team.memberCount} ${team.memberCount === 1 ? "member" : "members"}`;
    $("#team-member-count").textContent = String(team.memberCount);
    const inviteURL = new URL("./account.html", window.location.href);
    inviteURL.searchParams.set("join", team.inviteCode);
    $("#team-invite-link").value = inviteURL.href;
    $("#team-member-list").innerHTML = (team.members || []).map((member) =>
      `<li><span><strong>${escapeHTML(member.name)}</strong><small>${escapeHTML(member.email)}</small></span><em>${member.role === "OWNER" ? "Owner" : "Member"}</em></li>`).join("");

    const transferForm = $("#team-transfer-form");
    const transferSelect = $("#team-transfer-member");
    const otherMembers = (team.members || []).filter((member) => member.id !== user.id);
    transferForm.hidden = team.role !== "OWNER" || otherMembers.length === 0;
    transferSelect.innerHTML = '<option value="">Choose a member</option>' + otherMembers
      .map((member) => `<option value="${escapeHTML(member.email)}">${escapeHTML(member.name)} · ${escapeHTML(member.email)}</option>`).join("");
    $("#team-leave-note").textContent = team.role === "OWNER" && otherMembers.length
      ? "Transfer ownership to another member before leaving."
      : team.role === "OWNER"
        ? "Leaving as the only member deletes this empty team. Your personal workspace remains saved."
        : "Your personal workspace will remain saved if you leave this team.";
  }

  async function initTeamSettings(user) {
    const card = $("#account-team-card");
    if (!card) return;
    const createForm = $("#team-create-form");
    const joinNote = card.querySelector(".team-join-note");
    if (!apiBase()) {
      $("#team-loading").hidden = true;
      $("#team-no-membership").hidden = false;
      createForm.hidden = true;
      joinNote.textContent = "Team workspaces are available after signing in through the connected PPM account service.";
      setTeamMessage("The shared account service is not configured in this browser.", "error");
      return;
    }
    const token = remoteToken();
    if (!token) {
      setTeamMessage("Your session has expired. Sign in again to manage a team.", "error");
      return;
    }

    const loadTeam = async () => {
      const state = await apiRequest("/api/team", { token });
      const team = state.team || null;
      renderTeam(team, user);
      return team;
    };
    const url = new URL(window.location.href);
    const invitation = url.searchParams.get("join") || "";
    if (invitation) {
      url.searchParams.delete("join");
      history.replaceState(null, "", url.href);
      $("#team-loading").hidden = false;
      $("#team-no-membership").hidden = true;
      try {
        const team = await apiRequest("/api/team/join", { method: "POST", body: { inviteCode: invitation }, token });
        renderTeam(team, user);
        setTeamMessage(`You joined ${team.name}. Open the workplace to see the team’s shared projects.`, "success");
      } catch (error) {
        setTeamMessage(error instanceof Error ? error.message : "We couldn’t join this team.", "error");
        try { await loadTeam(); } catch { /* Keep the invitation error visible if team lookup also fails. */ }
      }
    } else {
      try { await loadTeam(); }
      catch (error) {
        $("#team-loading").hidden = true;
        $("#team-no-membership").hidden = false;
        createForm.hidden = true;
        setTeamMessage(error instanceof Error ? error.message : "We couldn’t load team settings.", "error");
      }
    }

    createForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!createForm.reportValidity()) return;
      const button = $("#team-create-submit");
      button.disabled = true;
      button.textContent = "Creating…";
      setTeamMessage("");
      try {
        const team = await apiRequest("/api/team", { method: "POST", body: { name: $("#team-name").value.trim() }, token });
        renderTeam(team, user);
        setTeamMessage("Your shared workspace is ready. Copy the invitation link to your teammates.", "success");
      } catch (error) {
        setTeamMessage(error instanceof Error ? error.message : "We couldn’t create this team.", "error");
      } finally {
        button.disabled = false;
        button.textContent = "Create shared workspace";
      }
    });

    $("#team-copy-invite").addEventListener("click", async () => {
      const field = $("#team-invite-link");
      try {
        await navigator.clipboard.writeText(field.value);
      } catch {
        field.focus();
        field.select();
        document.execCommand("copy");
      }
      const button = $("#team-copy-invite");
      button.textContent = "Copied";
      window.setTimeout(() => { button.textContent = "Copy link"; }, 1600);
    });

    $("#team-transfer-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = $("#team-transfer-submit");
      const email = $("#team-transfer-member").value;
      if (!email) return;
      button.disabled = true;
      button.textContent = "Transferring…";
      try {
        const team = await apiRequest("/api/team/transfer", { method: "POST", body: { email }, token });
        renderTeam(team, user);
        setTeamMessage("Team ownership has been transferred.", "success");
      } catch (error) {
        setTeamMessage(error instanceof Error ? error.message : "We couldn’t transfer ownership.", "error");
      } finally {
        button.disabled = false;
        button.textContent = "Transfer ownership";
      }
    });

    $("#team-leave-button").addEventListener("click", async () => {
      const teamName = $("#team-name-display").textContent;
      if (!window.confirm(`Leave ${teamName}? Your personal workspace will stay saved.`)) return;
      const button = $("#team-leave-button");
      button.disabled = true;
      setTeamMessage("");
      try {
        await apiRequest("/api/team", { method: "DELETE", token });
        renderTeam(null, user);
        setTeamMessage("You left the team. Your personal workspace is active again when you open the workplace.", "success");
      } catch (error) {
        setTeamMessage(error instanceof Error ? error.message : "We couldn’t leave this team.", "error");
      } finally {
        button.disabled = false;
      }
    });
  }

  function initAccountPage(user) {
    const form = $("#account-profile-form");
    if (!form) return;
    if (!user) {
      const invitation = new URLSearchParams(window.location.search).get("join");
      const signInURL = new URL(authURL("login", "account.html"), window.location.href);
      if (invitation) signInURL.searchParams.set("join", invitation);
      window.location.replace(signInURL.href);
      return;
    }

    const nameField = $("#account-display-name");
    const emailField = $("#account-email");
    const roleField = $("#account-role");
    const message = $("#account-message");
    const submit = $("#account-save");
    const avatar = $("#account-avatar");
    const storageNote = $("#account-storage-note");
    nameField.value = user.name;
    emailField.value = user.email;
    roleField.value = user.role;
    avatar.textContent = avatarName(user.name);
    if (storageNote) {
      storageNote.textContent = apiBase()
        ? "Your profile and workplace data are saved to this account and sync when you sign in on another device."
        : "Changes are saved in this browser only. They will not sync to another device until a shared account service is connected.";
    }
    initTeamSettings(user);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const profile = {
        name: nameField.value.trim(),
        email: emailField.value.trim().toLocaleLowerCase(),
        role: roleField.value
      };
      message.textContent = "";
      message.dataset.state = "";
      submit.disabled = true;
      submit.textContent = "Saving…";
      try {
        if (profile.name.length < 2 || profile.name.length > 80) throw new Error("Enter a name between 2 and 80 characters.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) throw new Error("Enter a valid email address.");
        if (!["Portfolio Manager", "Project Proposer", "Reviewer"].includes(profile.role)) throw new Error("Choose one of the available workspace roles.");
        let updated;
        if (apiBase()) {
          const token = remoteToken();
          if (!token) throw new Error("Your session has expired. Please sign in again.");
          updated = await apiRequest("/api/auth/profile", { method: "PATCH", body: profile, token });
          sessionStorage.setItem(REMOTE_USER_KEY, JSON.stringify(updated));
        } else {
          updated = updateLocalProfile(user, profile);
        }
        syncWorkspaceProfile(updated);
        message.dataset.state = "success";
        message.textContent = "Your account information has been updated.";
        window.setTimeout(() => window.location.reload(), 500);
      } catch (error) {
        message.dataset.state = "error";
        message.textContent = error instanceof Error ? error.message : "We couldn't save your account information.";
        submit.disabled = false;
        submit.textContent = "Save changes";
      }
    });

    const deleteDialog = $("#account-delete-dialog");
    const deleteForm = $("#account-delete-form");
    const deleteOpen = $("#account-delete-open");
    const deleteInput = $("#account-delete-confirm");
    const deleteSubmit = $("#account-delete-submit");
    const deleteMessage = $("#account-delete-message");
    deleteForm.addEventListener("submit", (event) => event.preventDefault());
    const closeDeleteDialog = () => {
      deleteDialog.close();
      deleteForm.reset();
      deleteSubmit.disabled = true;
      deleteSubmit.textContent = "Delete account";
      deleteMessage.textContent = "";
      deleteMessage.dataset.state = "";
    };

    deleteOpen.addEventListener("click", () => {
      deleteDialog.showModal();
      deleteInput.focus();
    });
    $("#account-delete-close").addEventListener("click", closeDeleteDialog);
    $("#account-delete-cancel").addEventListener("click", closeDeleteDialog);
    deleteDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDeleteDialog();
    });
    deleteDialog.addEventListener("click", (event) => {
      if (event.target === deleteDialog) closeDeleteDialog();
    });
    deleteInput.addEventListener("input", () => {
      deleteSubmit.disabled = deleteInput.value !== "DELETE";
      deleteMessage.textContent = "";
      deleteMessage.dataset.state = "";
    });
    deleteSubmit.addEventListener("click", async () => {
      if (deleteInput.value !== "DELETE" || deleteSubmit.disabled) return;
      deleteSubmit.disabled = true;
      deleteOpen.disabled = true;
      deleteSubmit.textContent = "Deleting…";
      deleteMessage.textContent = "";
      try {
        if (apiBase()) {
          const token = remoteToken();
          if (!token) throw new Error("Your session has expired. Please sign in again.");
          await apiRequest("/api/auth/account", { method: "DELETE", token });
          sessionStorage.removeItem(REMOTE_TOKEN_KEY);
          sessionStorage.removeItem(REMOTE_USER_KEY);
        } else {
          const remainingUsers = readUsers().filter((entry) => entry.id !== user.id);
          localStorage.setItem(USERS_KEY, JSON.stringify(remainingUsers));
          if (localStorage.getItem(ACTIVE_KEY) === user.id) localStorage.removeItem(ACTIVE_KEY);
        }
        removeWorkspaceProfile(user.id);
        window.location.assign(pageURL("index.html"));
      } catch (error) {
        deleteMessage.dataset.state = "error";
        deleteMessage.textContent = error instanceof Error ? error.message : "We couldn't delete your account. Please try again.";
        deleteSubmit.disabled = false;
        deleteOpen.disabled = false;
        deleteSubmit.textContent = "Delete account";
      }
    });
  }

  function randomHex(size) {
    const bytes = crypto.getRandomValues(new Uint8Array(size));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function passwordVerifier(password, saltHex) {
    if (!crypto.subtle) throw new Error("Secure browser storage is unavailable. Open the public HTTPS site or localhost.");
    const salt = Uint8Array.from(saltHex.match(/.{2}/g) || [], (part) => parseInt(part, 16));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, key, 256);
    return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function constantTimeEqual(left, right) {
    if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    return difference === 0;
  }

  function initAuthPage() {
    const form = $("#auth-form");
    if (!form) return;
    const params = new URLSearchParams(location.search);
    const requestedReturn = params.get("return") || "workplace.html";
    const returnTo = requestedReturn === "index.html" || requestedReturn === "workplace.html" || requestedReturn === "account.html" ? requestedReturn : "workplace.html";
    const sharedAccounts = Boolean(apiBase());
    let mode = params.get("mode") === "reset" ? "reset" : params.get("mode") === "forgot" ? "forgot" : params.get("mode") === "signup" ? "signup" : "login";
    const resetToken = params.get("token") || new URLSearchParams(location.hash.replace(/^#/, "")).get("token") || "";
    if (mode === "reset" && resetToken) history.replaceState(null, "", `${location.pathname}?mode=reset`);
    const title = $("#auth-title");
    const subtitle = $("#auth-subtitle");
    const message = $("#auth-message");
    const submit = $("#auth-submit");
    const switchCopy = $("#auth-switch-copy");
    const switchButton = $("#auth-switch");
    const switchRow = $(".auth-mode-switch");
    const forgotButton = $("#auth-forgot-password");
    const backToSignIn = $("#auth-reset-signin");
    const emailField = $("#auth-email-field");
    const passwordField = $("#auth-password-field");
    const confirmField = $("#auth-password-confirm-field");
    const confirmPassword = $("#auth-password-confirm");
    const signupFields = document.querySelectorAll(".auth-signup-only");
    const password = $("#auth-password");
    const storageNote = $("#auth-storage-note");

    if (storageNote) {
      storageNote.innerHTML = sharedAccounts
        ? "<strong>Shared account</strong><p>Sign in with the same account on another device to open your synced proposals, evaluations, comments, and portfolio.</p>"
        : "<strong>Prototype account storage</strong><p>Until a shared account service is connected, accounts are saved in this browser only. They will not work in another browser or on another device.</p>";
    }

    function setMode(nextMode = mode) {
      mode = nextMode;
      const signup = mode === "signup";
      const forgot = mode === "forgot";
      const reset = mode === "reset";
      const complete = mode === "reset-complete";
      title.textContent = signup ? "Create your account" : forgot ? "Reset your password" : reset ? "Choose a new password" : complete ? "Password updated" : "Sign in";
      subtitle.textContent = signup
        ? (sharedAccounts ? "Create an account you can use on your other devices." : "Create a PPM profile for this browser.")
        : forgot
          ? "Enter the email for your PPM account. If it matches, we’ll send a one-time reset link."
          : reset
            ? "Choose a new password for your PPM account. Reset links expire after 30 minutes."
            : complete
              ? "Your password has been changed. Sign in with your new password."
              : "Use your PPM account to enter the workplace.";
      submit.textContent = signup ? "Create account" : forgot ? "Send reset link" : reset ? "Save new password" : "Continue";
      switchCopy.textContent = signup ? "Already have an account?" : "New to this prototype?";
      switchButton.textContent = signup ? "Sign in" : "Create account";
      switchRow.hidden = forgot || reset || complete;
      forgotButton.hidden = mode !== "login";
      backToSignIn.hidden = !(forgot || reset || complete);
      backToSignIn.textContent = complete || reset ? "← Back to sign in" : "← Cancel";
      backToSignIn.href = complete || reset ? "./login.html" : `./login.html?mode=login&return=${encodeURIComponent(returnTo)}`;
      emailField.hidden = reset || complete;
      passwordField.hidden = forgot || complete;
      confirmField.hidden = !reset;
      signupFields.forEach((field) => { field.hidden = !signup; });
      $("#auth-name").required = signup;
      $("#auth-role").required = signup;
      $("#auth-email").required = !reset && !complete;
      password.required = !forgot && !complete;
      confirmPassword.required = reset;
      password.autocomplete = signup || reset ? "new-password" : "current-password";
      form.dataset.mode = mode;
      form.hidden = complete;
      storageNote.hidden = forgot || reset || complete;
      if (!reset) message.textContent = "";
      if (reset && !resetToken) {
        submit.disabled = true;
        message.dataset.state = "error";
        message.textContent = "This reset link is incomplete. Request a new one.";
      } else {
        submit.disabled = false;
      }
    }

    switchButton.addEventListener("click", () => setMode(mode === "signup" ? "login" : "signup"));
    forgotButton.addEventListener("click", () => setMode("forgot"));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.textContent = "";
      if (!form.reportValidity()) return;
      submit.disabled = true;
      const signup = mode === "signup";
      const forgot = mode === "forgot";
      const reset = mode === "reset";
      submit.textContent = signup ? "Creating account…" : forgot ? "Sending…" : reset ? "Updating…" : "Checking account…";
      try {
        const email = $("#auth-email").value.trim().toLocaleLowerCase();
        const passphrase = password.value;
        if (forgot) {
          await apiRequest("/api/auth/password-reset/request", { method: "POST", body: { email } });
          message.dataset.state = "success";
          message.textContent = "If an account is linked to that email, reset instructions will be sent.";
          submit.textContent = "Request sent";
          return;
        }
        if (reset) {
          if (passphrase !== confirmPassword.value) throw new Error("The passwords do not match.");
          await apiRequest("/api/auth/password-reset/confirm", {
            method: "POST",
            body: { token: resetToken, password: passphrase }
          });
          message.dataset.state = "success";
          message.textContent = "Your password has been changed.";
          setMode("reset-complete");
          return;
        }
        if (sharedAccounts) {
          const payload = signup
            ? { name: $("#auth-name").value.trim(), email, password: passphrase, role: $("#auth-role").value }
            : { email, password: passphrase };
          if (signup && passphrase.length < 8) throw new Error("Use at least 8 characters for your password.");
          const result = await apiRequest(signup ? "/api/auth/register" : "/api/auth/login", { method: "POST", body: payload });
          if (!result.token || !result.user) throw new Error("The account service returned an incomplete sign-in response.");
          sessionStorage.setItem(REMOTE_TOKEN_KEY, result.token);
          sessionStorage.setItem(REMOTE_USER_KEY, JSON.stringify(result.user));
          syncWorkspaceProfile(result.user);
          setDemoMode(false);
        } else {
          let users = readUsers();
          if (signup) {
            const name = $("#auth-name").value.trim();
            if (passphrase.length < 8) throw new Error("Use at least 8 characters for your password.");
            if (users.some((user) => user.email.toLocaleLowerCase() === email)) throw new Error("An account with this email already exists in this browser. Sign in instead.");
            const salt = randomHex(16);
            const verifier = await passwordVerifier(passphrase, salt);
            const user = { id: `ppm-${randomHex(12)}`, name, email, role: $("#auth-role").value, salt, verifier, createdAt: new Date().toISOString() };
            users = [...users, user];
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            localStorage.setItem(ACTIVE_KEY, user.id);
            syncWorkspaceProfile({ id: user.id, name: user.name, email: user.email, role: user.role });
            setDemoMode(false);
          } else {
            const user = users.find((entry) => entry.email.toLocaleLowerCase() === email);
            if (!user) throw new Error("We couldn't find an account for that email in this browser.");
            const verifier = await passwordVerifier(passphrase, user.salt);
            if (!constantTimeEqual(verifier, user.verifier)) throw new Error("That password doesn't match this account.");
            localStorage.setItem(ACTIVE_KEY, user.id);
            syncWorkspaceProfile({ id: user.id, name: user.name, email: user.email, role: user.role });
            setDemoMode(false);
          }
        }
        const destination = new URL(pageURL(returnTo), window.location.href);
        const invitation = params.get("join");
        if (returnTo === "account.html" && invitation) destination.searchParams.set("join", invitation);
        window.location.assign(destination.href);
      } catch (error) {
        message.dataset.state = "error";
        message.textContent = error instanceof Error ? error.message : "We couldn't save the account. Check browser storage and try again.";
      } finally {
        if (mode !== "reset-complete" && !(mode === "forgot" && message.dataset.state === "success")) {
          submit.disabled = false;
          submit.textContent = mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Save new password" : "Continue";
        }
      }
    });
    setMode();
  }

  window.PPMAuth = {
    currentUser,
    syncWorkspaceProfile,
    apiBase,
    request: apiRequest,
    token: remoteToken,
    demoRole,
    isDemoMode,
    setDemoRole,
    setDemoMode,
    refreshHeader,
    roleSelectURL: ROLE_SELECT_URL,
    pageURL,
    isAssistedMode,
    setAssistedMode
  };
  window.PPMAuthReady = new Promise((resolve) => {
    const start = () => {
      initAuthPage();
      initHeader().then(initAccountPage).catch(() => {}).finally(resolve);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  });
})();
