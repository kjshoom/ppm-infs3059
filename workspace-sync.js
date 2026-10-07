(() => {
  "use strict";

  const OWNER_KEY = "ppm-v2-workspace-owner";
  const PENDING_KEY = "ppm-v2-workspace-pending";
  const EXACT_KEYS = new Set([
    "ppm-organisation", "ppm-v2-custom-proposals", "ppm-v2-evaluation-comments",
    "ppm-v2-shortlist", "ppm-v2-scenarios", "ppm-v2-decisions",
    "ppm-v2-scenario-decisions", "ppm-v2-removed-proposals"
  ]);
  const status = document.querySelector("#workspace-sync-status");
  const message = document.querySelector("#workspace-sync-message");
  const action = document.querySelector("#workspace-sync-action");
  let userId = "";
  let version = 0;
  let ready = false;
  let conflict = false;
  let timer = 0;
  let polling = 0;
  let busy = false;
  let latestRemote = null;

  function isWorkspaceKey(key) {
    return EXACT_KEYS.has(key) || key.startsWith("ppm-evaluation-") || key.startsWith("ppm-note-");
  }

  function snapshot() {
    const entries = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && isWorkspaceKey(key)) entries.push([key, localStorage.getItem(key)]);
    }
    entries.sort(([left], [right]) => left.localeCompare(right));
    return Object.fromEntries(entries);
  }

  function stableJSON(data) {
    return JSON.stringify(Object.fromEntries(Object.entries(data || {}).sort(([left], [right]) => left.localeCompare(right))));
  }

  function clearWorkspace() {
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && isWorkspaceKey(key)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  }

  function applySnapshot(data) {
    clearWorkspace();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (isWorkspaceKey(key) && typeof value === "string") localStorage.setItem(key, value);
    });
  }

  function setStatus(text, state = "synced", actionText = "") {
    if (!status) return;
    status.hidden = false;
    status.dataset.state = state;
    message.textContent = text;
    action.hidden = !actionText;
    action.textContent = actionText;
  }

  function hideStatus() {
    if (status) status.hidden = true;
  }

  function context() {
    const auth = window.PPMAuth;
    const user = auth?.currentUser?.();
    const token = auth?.token?.();
    const base = auth?.apiBase?.();
    return user && user.id && token && base ? { user, token, base, request: auth.request } : null;
  }

  function parsePending() {
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
      return pending && pending.userId === userId && pending.data && typeof pending.data === "object" ? pending : null;
    } catch { return null; }
  }

  function savePending(data, expectedVersion) {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ userId, expectedVersion, data }));
  }

  async function requestWithTimeout(path, options) {
    const request = context()?.request;
    if (!request) throw new Error("Sign in to sync this workspace.");
    let timeout;
    try {
      return await Promise.race([
        request(path, options),
        new Promise((_, reject) => { timeout = window.setTimeout(() => reject(new Error("The workspace service is waking up. Your changes remain saved on this device.")), 12000); })
      ]);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function readRemote() {
    return requestWithTimeout("/api/workspace", { token: context()?.token });
  }

  async function writeRemote(data, expectedVersion) {
    return requestWithTimeout("/api/workspace", {
      method: "PUT",
      token: context()?.token,
      body: { data, expectedVersion }
    });
  }

  async function load() {
    const signedIn = context();
    if (!signedIn) { hideStatus(); return false; }
    userId = signedIn.user.id;
    const previousOwner = localStorage.getItem(OWNER_KEY) || "";
    let localData = snapshot();
    let pending = parsePending();
    if (previousOwner && previousOwner !== userId) {
      clearWorkspace();
      localStorage.removeItem(PENDING_KEY);
      localData = {};
      pending = null;
    }
    setStatus("Loading your shared workspace…", "loading");

    try {
      const remote = await readRemote();
      version = Number(remote.version) || 0;
      latestRemote = remote.data && typeof remote.data === "object" ? remote.data : {};

      if (pending) {
        const expectedVersion = Number.isInteger(pending.expectedVersion) ? pending.expectedVersion : 0;
        if (version > 0 && stableJSON(latestRemote) === stableJSON(pending.data)) {
          localData = pending.data;
          localStorage.removeItem(PENDING_KEY);
          setStatus("Changes synced", "synced");
        } else try {
          const saved = await writeRemote(pending.data, expectedVersion);
          version = Number(saved.version) || version;
          localData = pending.data;
          localStorage.removeItem(PENDING_KEY);
          latestRemote = localData;
          setStatus("Changes synced", "synced");
        } catch (error) {
          if (error instanceof Error && error.message.includes("changed on another device")) {
            conflict = true;
            localData = pending.data;
            setStatus("Another device has newer changes. Choose which copy to use.", "conflict", "Use shared version");
          } else {
            localData = pending.data;
            setStatus("Saved here · waiting to sync", "offline", "Retry");
          }
        }
        applySnapshot(localData);
      } else if (version > 0 && Object.keys(latestRemote).length) {
        applySnapshot(latestRemote);
      } else if (Object.keys(localData).length && (!previousOwner || previousOwner === userId)) {
        const migrated = await writeRemote(localData, 0);
        version = Number(migrated.version) || 1;
        latestRemote = localData;
        setStatus("This device's workspace has been synced", "synced");
      } else {
        applySnapshot(latestRemote);
      }
      localStorage.setItem(OWNER_KEY, userId);
      ready = true;
      if (!conflict && status?.dataset.state !== "offline") setStatus("All changes synced", "synced");
      startPolling();
      return true;
    } catch (error) {
      ready = false;
      setStatus("Workspace service unavailable · changes stay on this device", "offline", "Retry");
      return false;
    }
  }

  async function syncNow() {
    if (busy || conflict || !userId || !context()) return;
    busy = true;
    window.clearTimeout(timer);
    const data = snapshot();
    if (ready) savePending(data, version);
    setStatus("Syncing changes…", "saving");
    try {
      if (!ready) {
        const remote = await readRemote();
        const remoteVersion = Number(remote.version) || 0;
        const pending = parsePending();
        const expected = pending ? Number(pending.expectedVersion) || 0 : remoteVersion;
        if (remoteVersion !== expected) throw new Error("This workspace changed on another device.");
        version = remoteVersion;
      }
      const result = await writeRemote(data, version);
      version = Number(result.version) || version + 1;
      latestRemote = data;
      ready = true;
      localStorage.setItem(OWNER_KEY, userId);
      localStorage.removeItem(PENDING_KEY);
      setStatus("All changes synced", "synced");
    } catch (error) {
      if (error instanceof Error && error.message.includes("changed on another device")) {
        conflict = true;
        setStatus("Another device has newer changes. Choose which copy to use.", "conflict", "Use shared version");
      } else {
        setStatus("Saved here · waiting to sync", "offline", "Retry");
      }
    } finally {
      busy = false;
      startPolling();
    }
  }

  function changed() {
    if (!context() || !userId || window.PPMGuestDemo) return;
    if (conflict) return;
    localStorage.setItem(OWNER_KEY, userId);
    const data = snapshot();
    savePending(data, version);
    setStatus("Saving changes…", "saving");
    window.clearTimeout(timer);
    timer = window.setTimeout(syncNow, 800);
  }

  async function pollForChanges() {
    if (!ready || !userId || busy || document.visibilityState !== "visible" || !context()) return;
    try {
      const remote = await readRemote();
      const remoteVersion = Number(remote.version) || 0;
      if (remoteVersion <= version) return;
      const remoteData = remote.data && typeof remote.data === "object" ? remote.data : {};
      if (stableJSON(remoteData) === stableJSON(snapshot())) {
        version = remoteVersion;
        latestRemote = remoteData;
        localStorage.removeItem(PENDING_KEY);
        setStatus("All changes synced", "synced");
        return;
      }
      conflict = true;
      latestRemote = remoteData;
      setStatus("A newer shared version is available.", "conflict", "Refresh workspace");
    } catch { /* Brief network interruptions do not interrupt active work. */ }
  }

  function startPolling() {
    if (polling || !ready) return;
    polling = window.setInterval(pollForChanges, 45000);
    window.addEventListener("focus", pollForChanges);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") pollForChanges();
    });
  }

  action?.addEventListener("click", () => {
    if (conflict) {
      if (!window.confirm("Use the version saved by the other device? Any changes that have not synced from this device will be discarded.")) return;
      localStorage.removeItem(PENDING_KEY);
      window.location.reload();
      return;
    }
    if (!ready) load().then((loaded) => { if (loaded) syncNow(); });
    else syncNow();
  });

  window.PPMWorkspaceSync = { load, changed, syncNow };
})();
