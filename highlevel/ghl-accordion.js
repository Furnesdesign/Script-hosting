// ghl-accordion-test.js
(() => {
  const DURATION = 250;

  function getPanel(contentEl) {
    // Your markup: contentEl contains a ".vertical.inner" wrapper
    return contentEl.querySelector(".vertical.inner") || contentEl.querySelector(".inner") || contentEl;
  }

  function close(panel) {
    panel.style.overflow = "hidden";
    panel.style.height = "0px";
    panel.style.transition = `height ${DURATION}ms ease`;
  }

  function open(panel) {
    panel.style.overflow = "hidden";
    panel.style.transition = `height ${DURATION}ms ease`;
    panel.style.height = panel.scrollHeight + "px";

    const onEnd = (e) => {
      if (e.propertyName !== "height") return;
      panel.style.height = "auto";
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
  }

  function init() {
    document.querySelectorAll(".data-accordion-item").forEach((item) => {
      const btn = item.querySelector(".data-accordion-button");
      const content = item.querySelector(".data-accordion-content");
      if (!btn || !content) return;

      const panel = getPanel(content);

      // init once per item
      if (item.dataset.accInit === "1") return;
      item.dataset.accInit = "1";
      item.dataset.open = "false";

      close(panel);
      btn.style.cursor = "pointer";

      btn.addEventListener("click", (e) => {
        e.preventDefault();

        const isOpen = item.dataset.open === "true";
        if (isOpen) {
          item.dataset.open = "false";
          // pin then animate down
          panel.style.height = panel.scrollHeight + "px";
          void panel.offsetHeight;
          close(panel);
        } else {
          item.dataset.open = "true";
          // if auto, reset then animate open
          if (getComputedStyle(panel).height === "auto") panel.style.height = "0px";
          open(panel);
        }
      });
    });
  }

  init();

  // Re-init if GHL re-renders
  const mo = new MutationObserver(init);
  mo.observe(document.documentElement, { childList: true, subtree: true });

  console.log("[Accordion test] loaded");
})();
