(() => {
  "use strict";

  const USERS_KEY = "ppm-local-users-v1";
  const ACTIVE_KEY = "ppm-local-active-user-v1";
  const APP_ACCOUNTS_KEY = "ppm-v2-prototype-accounts";
  const APP_ACTIVE_KEY = "ppm-v2-active-account";
  const REMOTE_TOKEN_KEY = "ppm-auth-session-v1";
  const REMOTE_USER_KEY = "ppm-auth-user-v1";
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
    if (localStorage.getItem("ppm-v2-workspace-owner") === userId) {
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

  function authURL(mode = "login", returnTo = "workplace.html") {
    const params = new URLSearchParams({ mode, return: returnTo });
    return `./login.html?${params.toString()}`;
  }

  function renderAuthSlot(slot, user, serviceUnavailable = false) {
    if (!user) {
      slot.innerHTML = `<a class="auth-sign-in-link" href="${authURL()}"${serviceUnavailable ? ' title="Account service unavailable"' : ""}>${serviceUnavailable ? "Sign in" : "Sign in"}</a>`;
      return;
    }
    const shared = Boolean(apiBase());
    slot.innerHTML = `<div class="profile-control"><button class="profile-avatar" type="button" aria-label="${escapeHTML(user.name)} account" aria-expanded="false"><span>${escapeHTML(avatarName(user.name))}</span></button><section class="profile-menu" hidden aria-label="Signed-in account"><button class="profile-menu-close" type="button" aria-label="Close account menu">×</button><div class="profile-summary"><span class="profile-avatar profile-avatar-large">${escapeHTML(avatarName(user.name))}</span><div><strong>${escapeHTML(user.name)}</strong><span>${escapeHTML(user.email)}</span><small>${escapeHTML(user.role)}</small></div></div><a class="profile-menu-action" href="./account.html"><span aria-hidden="true">⚙</span> Manage your PPM account</a><a class="profile-menu-action" href="${authURL("login")}"><span aria-hidden="true">＋</span> Add another account</a><button class="profile-menu-action profile-signout" type="button"><span aria-hidden="true">↪</span> Sign out</button><p class="profile-menu-note">${shared ? "Account available on your other devices" : "Saved in this browser"}</p></section></div>`;
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
      window.location.assign("./index.html");
    });
    document.addEventListener("click", (event) => { if (!slot.contains(event.target)) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
  }

  async function initHeader() {
    const slots = [...document.querySelectorAll(".auth-slot")];
    if (!apiBase()) {
      const user = localUser();
      syncWorkspaceProfile(user);
      slots.forEach((slot) => renderAuthSlot(slot, user));
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
    return user;
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

  function initAccountPage(user) {
    const form = $("#account-profile-form");
    if (!form) return;
    if (!user) {
      window.location.replace(authURL("login", "account.html"));
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
        window.location.assign("./index.html");
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
    let signup = params.get("mode") === "signup";
    const title = $("#auth-title");
    const subtitle = $("#auth-subtitle");
    const message = $("#auth-message");
    const submit = $("#auth-submit");
    const switchCopy = $("#auth-switch-copy");
    const switchButton = $("#auth-switch");
    const signupFields = document.querySelectorAll(".auth-signup-only");
    const password = $("#auth-password");
    const storageNote = $("#auth-storage-note");

    if (storageNote) {
      storageNote.innerHTML = sharedAccounts
        ? "<strong>Shared account</strong><p>Sign in with the same account on another device to open your synced proposals, evaluations, comments, and portfolio.</p>"
        : "<strong>Prototype account storage</strong><p>Until a shared account service is connected, accounts are saved in this browser only. They will not work in another browser or on another device.</p>";
    }

    function setMode() {
      title.textContent = signup ? "Create your account" : "Sign in";
      subtitle.textContent = signup
        ? (sharedAccounts ? "Create an account you can use on your other devices." : "Create a PPM profile for this browser.")
        : (sharedAccounts ? "Use your PPM account to enter the workplace." : "Use your PPM account to enter the workplace.");
      submit.textContent = signup ? "Create account" : "Continue";
      switchCopy.textContent = signup ? "Already have an account?" : "New to this prototype?";
      switchButton.textContent = signup ? "Sign in" : "Create account";
      signupFields.forEach((field) => { field.hidden = !signup; });
      $("#auth-name").required = signup;
      $("#auth-role").required = signup;
      password.autocomplete = signup ? "new-password" : "current-password";
      form.dataset.mode = signup ? "signup" : "login";
      message.textContent = "";
    }

    switchButton.addEventListener("click", () => { signup = !signup; setMode(); });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.textContent = "";
      if (!form.reportValidity()) return;
      submit.disabled = true;
      submit.textContent = signup ? "Creating account…" : "Checking account…";
      try {
        const email = $("#auth-email").value.trim().toLocaleLowerCase();
        const passphrase = password.value;
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
          } else {
            const user = users.find((entry) => entry.email.toLocaleLowerCase() === email);
            if (!user) throw new Error("We couldn't find an account for that email in this browser.");
            const verifier = await passwordVerifier(passphrase, user.salt);
            if (!constantTimeEqual(verifier, user.verifier)) throw new Error("That password doesn't match this account.");
            localStorage.setItem(ACTIVE_KEY, user.id);
            syncWorkspaceProfile({ id: user.id, name: user.name, email: user.email, role: user.role });
          }
        }
        window.location.assign(`./${returnTo}`);
      } catch (error) {
        message.textContent = error instanceof Error ? error.message : "We couldn't save the account. Check browser storage and try again.";
      } finally {
        submit.disabled = false;
        submit.textContent = signup ? "Create account" : "Continue";
      }
    });
    setMode();
  }

  window.PPMAuth = { currentUser, syncWorkspaceProfile, apiBase, request: apiRequest, token: remoteToken };
  window.PPMAuthReady = new Promise((resolve) => {
    const start = () => {
      initAuthPage();
      initHeader().then(initAccountPage).catch(() => {}).finally(resolve);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  });
})();
