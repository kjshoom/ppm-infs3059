(() => {
  "use strict";

  const mount = document.querySelector("#workplace-mount");
  const loading = document.querySelector("#workplace-loading");

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.body.append(script);
    });
  }

  async function openWorkplace() {
    try {
      const testMode = new URLSearchParams(window.location.search).has("mvpTest");
      window.PPMTestMode = testMode;
      await (window.PPMAuthReady || Promise.resolve());
      const user = testMode ? null : window.PPMAuth?.currentUser();
      window.PPMGuestDemo = !testMode && (window.PPMAuth?.isDemoMode() || !user || !["Project Proposer", "Reviewer", "Portfolio Manager"].includes(user.role));
      if (window.PPMGuestDemo && !window.PPMAuth?.demoRole()) {
        window.location.replace(window.PPMAuth.roleSelectURL);
        return;
      }
      if (window.PPMGuestDemo && !window.PPMAuth?.isDemoMode()) {
        window.PPMAuth?.setDemoMode(true);
        window.PPMAuth?.refreshHeader();
      }
      document.body.classList.toggle("guest-demo", window.PPMGuestDemo);
      document.querySelector("#guest-demo-banner").hidden = !window.PPMGuestDemo;
      if (!window.PPMGuestDemo && !testMode) await window.PPMWorkspaceSync?.load();
      const response = await fetch("./index.html", { cache: "no-store" });
      if (!response.ok) throw new Error("The workplace template could not be loaded.");
      const source = new DOMParser().parseFromString(await response.text(), "text/html");
      const workspace = source.querySelector("#workspace");
      if (!workspace) throw new Error("The workplace section is missing from the page template.");
      const content = workspace.cloneNode(true);
      content.removeAttribute("hidden");
      content.removeAttribute("tabindex");
      mount.replaceChildren(content);
      source.querySelectorAll("dialog.modal").forEach((dialog) => document.body.append(dialog.cloneNode(true)));
      loading.hidden = true;

      await loadScript("./app.js?v=20261029-init-order-fix-v1");
      if (window.PPMGuestDemo) await loadScript("./guest-demo.js?v=20261023-help-labels-v1");
      await loadScript("./public/test-feedback.js?v=20261012-demo-mvp-v1");
      await loadScript("./guided-tour.js?v=20261023-help-labels-v1");
      window.PPMTour?.init();
    } catch (error) {
      loading.hidden = false;
      loading.textContent = error instanceof Error ? error.message : "The workplace could not be opened. Reload and try again.";
      loading.classList.add("has-error");
    }
  }

  openWorkplace();
})();
