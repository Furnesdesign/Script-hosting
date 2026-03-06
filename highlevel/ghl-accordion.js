(() => {
  const DURATION = 300;

  // Find the element we animate (inner wrapper usually has the real height)
  function getPanel(contentEl) {
    return contentEl.querySelector(".vertical.inner") || contentEl.querySelector(".inner") || contentEl;
  }

  function setClosed(panel) {
    panel.style.overflow = "hidden";
    panel.style.height = "0px";
    panel.style.transition = `height ${DURATION}ms ease`;
    panel.style.willChange = "height";
  }

  function measure(panel) {
    // If panel is height:auto, scrollHeight is still ok.
    return panel.scrollHeight;
  }

  function animateTo(panel, px) {
    panel.style.height = `${px}px`;
  }

  function open(item, panel) {
    item.dataset.open = "true";

    // Start from current px height (0px), then animate to measured height
    const target1 = measure(panel);
    animateTo(panel, target1);

    // IMPORTANT: content may grow after open (fonts, lazy rendering, etc.)
    // Keep syncing height while open to avoid the end-jump.
    const ro = new ResizeObserver(() => {
      if (item.dataset.open !== "true") return;

      // If we already switched to auto, keep it pinned to px to prevent jumps
      const next = measure(panel);
      panel.style.height = `${next}px`;
    });

    ro.observe(panel);
    item._accRO = ro;

    // After transition, keep it in px (not auto) so growth is animated smoothly
    // If you prefer auto, you can switch after a delay, but px is the no-jump option.
  }

  function close(item, panel) {
    item.dataset.open = "false";

    // Stop observing size changes
    if (item._accRO) {
      item._accRO.disconnect();
      item._accRO = null;
    }

    // Pin current height, then animate to 0
    const current = measure(panel);
    panel.style.height = `${current}px`;
    void panel.offsetHeight; // reflow
    animateTo(panel, 0);
  }

  function init() {
    document.querySelectorAll(".data-accordion-item").forEach((item) => {
      const btn = item.querySelector(".data-accordion-button");
      const content = item.querySelector(".data-accordion-content");
      if (!btn || !content) return;

      const panel = getPanel(content);

      if (item.dataset.accInit === "1") return;
      item.dataset.accInit = "1";
      item.dataset.open = "false";

      setClosed(panel);
      btn.style.cursor = "pointer";

      btn.addEventListener("click", (e) => {
        e.preventDefault();

        const isOpen = item.dataset.open === "true";
        if (isOpen) close(item, panel);
        else open(item, panel);
      });
    });
  }

  init();

  // GHL can re-render DOM; re-init safely
  const mo = new MutationObserver(init);
  mo.observe(document.documentElement, { childList: true, subtree: true });

  console.log("[Accordion] loaded (no-jump version)");
})();
