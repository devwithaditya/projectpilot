(() => {
  const assetPrefix = document.body.dataset.appPrefix || (document.body.dataset.tool ? "../" : "");
  if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${assetPrefix}service-worker.js`, { scope: assetPrefix || "./" }).catch(() => {});
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (!isAndroid || isStandalone) return;

  let deferredPrompt = null;
  const banner = document.createElement("aside");
  banner.className = "install-app-banner";
  banner.setAttribute("aria-label", "Install ProjectPilot");
  banner.innerHTML = `<span class="install-app-icon"><img src="${document.body.dataset.tool ? "../" : ""}icon.svg" alt="" /></span><span class="install-app-copy"><strong>Take ProjectPilot with you</strong><small>Install the free Android app experience.</small></span><button class="install-app-action" type="button">Install app</button><button class="install-app-close" type="button" aria-label="Dismiss install message">×</button>`;
  document.body.appendChild(banner);

  const action = banner.querySelector(".install-app-action");
  const close = banner.querySelector(".install-app-close");
  const dismissedUntil = Number(localStorage.getItem("projectpilot-install-dismissed") || 0);
  if (dismissedUntil > Date.now()) return;
  requestAnimationFrame(() => banner.classList.add("is-visible"));

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
  });

  action.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.remove();
      return;
    }
    action.textContent = "Open Chrome menu ⋮";
    action.classList.add("is-help");
    banner.querySelector(".install-app-copy small").textContent = "Choose ‘Add to Home screen’ to install it from Chrome.";
  });

  close.addEventListener("click", () => {
    localStorage.setItem("projectpilot-install-dismissed", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    banner.classList.remove("is-visible");
    setTimeout(() => banner.remove(), 220);
  });

  window.addEventListener("appinstalled", () => banner.remove());
})();
