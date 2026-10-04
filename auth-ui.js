(() => {
  "use strict";

  const USERS_KEY = "ppm-local-users-v1";
  const ACTIVE_KEY = "ppm-local-active-user-v1";
  const APP_ACCOUNTS_KEY = "ppm-v2-prototype-accounts";
  const APP_ACTIVE_KEY = "ppm-v2-active-account";
  const ITERATIONS = 210000;
  const $ = (selector) => document.querySelector(selector);

  function readUsers() {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      return Array.isArray(users) ? users : [];
    } catch {
      return [];
    }
  }

  function currentUser() {
    const activeId = localStorage.getItem(ACTIVE_KEY);
    const user = readUsers().find((entry) => entry.id === activeId);
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  function syncWorkspaceProfile(user) {
    if (!user) {
      localStorage.removeItem(APP_ACTIVE_KEY);
      return;
    }
    let accounts = [];
    try { accounts = JSON.parse(localStorage.getItem(APP_ACCOUNTS_KEY) || "[]"); } catch { accounts = []; }
    if (!Array.isArray(accounts)) accounts = [];
    const record = { id: user.id, displayName: user.name, role: user.role, createdAt: new Date().toISOString() };
    const index = accounts.findIndex((account) => account.id === user.id);
    if (index >= 0) accounts[index] = { ...accounts[index], ...record };
    else accounts.push(record);
    localStorage.setItem(APP_ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.setItem(APP_ACTIVE_KEY, JSON.stringify(user.id));
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

  function renderAuthSlot(slot) {
    const user = currentUser();
    if (!user) {
      slot.innerHTML = `<a class="auth-sign-in-link" href="${authURL()}">Sign in</a>`;
      return;
    }
    slot.innerHTML = `<div class="profile-control"><button class="profile-avatar" type="button" aria-label="${escapeHTML(user.name)} account" aria-expanded="false"><span>${escapeHTML(avatarName(user.name))}</span></button><section class="profile-menu" hidden aria-label="Signed-in account"><button class="profile-menu-close" type="button" aria-label="Close account menu">×</button><div class="profile-summary"><span class="profile-avatar profile-avatar-large">${escapeHTML(avatarName(user.name))}</span><div><strong>${escapeHTML(user.name)}</strong><span>${escapeHTML(user.email)}</span><small>${escapeHTML(user.role)}</small></div></div><a class="profile-menu-action" href="${authURL("login")}"><span aria-hidden="true">＋</span> Add another account</a><button class="profile-menu-action profile-signout" type="button"><span aria-hidden="true">↪</span> Sign out</button><p class="profile-menu-note">Saved in this browser</p></section></div>`;
    const trigger = slot.querySelector(".profile-avatar[aria-expanded]");
    const menu = slot.querySelector(".profile-menu");
    const close = () => { menu.hidden = true; trigger.setAttribute("aria-expanded", "false"); };
    trigger.addEventListener("click", () => {
      menu.hidden = !menu.hidden;
      trigger.setAttribute("aria-expanded", String(!menu.hidden));
    });
    slot.querySelector(".profile-menu-close").addEventListener("click", close);
    slot.querySelector(".profile-signout").addEventListener("click", () => {
      localStorage.removeItem(ACTIVE_KEY);
      syncWorkspaceProfile(null);
      window.location.assign("./index.html");
    });
    document.addEventListener("click", (event) => { if (!slot.contains(event.target)) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
  }

  function initHeader() {
    syncWorkspaceProfile(currentUser());
    document.querySelectorAll(".auth-slot").forEach(renderAuthSlot);
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
    for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    return difference === 0;
  }

  function initAuthPage() {
    const form = $("#auth-form");
    if (!form) return;
    const params = new URLSearchParams(location.search);
    const requestedReturn = params.get("return") || "workplace.html";
    const returnTo = requestedReturn === "index.html" || requestedReturn === "workplace.html" ? requestedReturn : "workplace.html";
    let signup = params.get("mode") === "signup";
    const title = $("#auth-title");
    const subtitle = $("#auth-subtitle");
    const message = $("#auth-message");
    const submit = $("#auth-submit");
    const switchCopy = $("#auth-switch-copy");
    const switchButton = $("#auth-switch");
    const signupFields = document.querySelectorAll(".auth-signup-only");
    const password = $("#auth-password");

    function setMode() {
      title.textContent = signup ? "Create your account" : "Sign in";
      subtitle.textContent = signup ? "Create a PPM profile for this browser." : "Use your PPM account to enter the workplace.";
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

  window.PPMAuth = { currentUser, syncWorkspaceProfile };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => { initHeader(); initAuthPage(); }, { once: true });
  else { initHeader(); initAuthPage(); }
})();
