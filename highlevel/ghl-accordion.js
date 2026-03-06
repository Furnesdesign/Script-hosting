(() => {
  function getPanel(contentEl) {
    return contentEl.querySelector(".vertical.inner") || contentEl.querySelector(".inner") || contentEl;
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

      panel.style.overflow = "hidden";
      panel.style.height = "0px";

      btn.addEventListener("click", (e) => {
        e.preventDefault();

        const isOpen = item.dataset.open === "true";

        if (isOpen) {
          item.dataset.open = "false";
          panel.style.height = "0px";
        } else {
          item.dataset.open = "true";
          panel.style.height = panel.scrollHeight + "px";
        }
      });
    });
  }

  init();

  // Re-init if GHL re-renders
  const mo = new MutationObserver(init);
  mo.observe(document.documentElement, { childList: true, subtree: true });

  console.log("[Accordion] loaded (no transition)");
})();
