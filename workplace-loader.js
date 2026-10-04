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
      await (window.PPMAuthReady || Promise.resolve());
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

      await loadScript("./app.js?v=20261004-workplace-v2");
      await loadScript("./public/test-feedback.js?v=20261004-workplace-v1");
      await loadScript("./guided-tour.js?v=20261004-tour-v2");
      window.PPMTour?.init();
    } catch (error) {
      loading.hidden = false;
      loading.textContent = error instanceof Error ? error.message : "The workplace could not be opened. Reload and try again.";
      loading.classList.add("has-error");
    }
  }

  openWorkplace();
})();
