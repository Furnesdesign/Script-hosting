(function () {
  "use strict";

  const CONFIG = {
    selectors: {
      list: '[data-filter="list"]',
      item: '[data-filter="item"]',

      // NEW: two counters
      countTotal: '[data-filter="count-total"]',
      countShowing: '[data-filter="count-showing"]',

      loader: '[data-filter="loader"]',
      liveSearch: "[data-filter-live-search]",
      searchSource: '[data-filter-source="live-search"]',

      dropdownWrapper: '[data-filter-dropdown="wrapper"]',
      dropdownButton: '[data-filter-dropdown="button"]',
      dropdownToggleLabel: '[data-filter-dropdown="toggle-label"]',
      dropdownToggleTag: '[data-filter-dropdown="toggle-tag"]',
      dropdownToggleTagLabel: '[data-filter-dropdown="toggle-tag-label"]',
      dropdownToggleTagClose: '[data-filter-dropdown="toggle-tag-close"]',
      dropdownList: '[data-filter-dropdown="list"]',
      dropdownTag: "[data-filter-dropdown-tag]",
      sourceTag: "[data-filter-source-tag]",
      iconCheck: '[data-filter-dropdown="icon-checked"]',
      iconUncheck: '[data-filter-dropdown="icon-unchecked"]',
      dropdownLabel: '[data-filter-dropdown="label"]',
    },
    debounceDelay: 150,
  };

  const state = {
    searchQuery: "",
    dropdownSelections: new Map(),
    items: [],
    dropdownWrappers: [],
  };

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function init() {
    state.items = Array.from(document.querySelectorAll(CONFIG.selectors.item));
    state.dropdownWrappers = Array.from(
      document.querySelectorAll(CONFIG.selectors.dropdownWrapper)
    );

    state.dropdownSelections.clear();
    state.dropdownWrappers.forEach((_, index) => {
      state.dropdownSelections.set(index, new Set());
    });

    setupLiveSearch();
    setupDropdowns();
    setupToggleTagClose();
    applyFilters();
  }

  function setupLiveSearch() {
    const searchInput = document.querySelector(CONFIG.selectors.liveSearch);
    if (!searchInput) return;

    const debouncedSearch = debounce((value) => {
      state.searchQuery = normalizeText(value);
      applyFilters();
    }, CONFIG.debounceDelay);

    searchInput.addEventListener("input", (e) => {
      debouncedSearch(e.target.value);
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchInput.value = "";
        state.searchQuery = "";
        applyFilters();
      }
    });
  }

  function setupDropdowns() {
    state.dropdownWrappers.forEach((wrapper, wrapperIndex) => {
      wrapper.addEventListener("click", (e) => {
        const tagElement = e.target.closest(CONFIG.selectors.dropdownTag);
        if (!tagElement) return;

        e.preventDefault();
        e.stopPropagation();

        const slug = tagElement.getAttribute("data-filter-dropdown-tag");
        toggleDropdownSelection(wrapperIndex, slug, tagElement, wrapper);
      });
    });
  }

function toggleDropdownSelection(wrapperIndex, slug, tagElement, wrapper) {
  const selections = state.dropdownSelections.get(wrapperIndex);
  if (!selections || !slug) return;

  if (selections.has(slug)) {
    selections.delete(slug);
    updateTagVisuals(tagElement, false);
  } else {
    selections.clear();
    clearAllTagVisualsInWrapper(wrapper);
    selections.add(slug);
    updateTagVisuals(tagElement, true);
  }

  updateToggleTag(wrapper, wrapperIndex, tagElement);
  applyFilters();

  // Close dropdown after selecting a tag
  closeDropdown(wrapper);
}
  function closeDropdown(wrapper) {
    const button = wrapper.querySelector(CONFIG.selectors.dropdownButton);
    if (!button) return;

    const isOpen =
      wrapper.classList.contains("w--open") || wrapper.querySelector(".w--open");
    if (isOpen) button.click();
  }

  function updateToggleTag(wrapper, wrapperIndex, tagElement) {
    const toggleLabel = wrapper.querySelector(CONFIG.selectors.dropdownToggleLabel);
    const toggleTag = wrapper.querySelector(CONFIG.selectors.dropdownToggleTag);
    const toggleTagLabel = wrapper.querySelector(
      CONFIG.selectors.dropdownToggleTagLabel
    );

    const selections = state.dropdownSelections.get(wrapperIndex);

    if (!selections || selections.size === 0) {
      if (toggleLabel) toggleLabel.style.display = "";
      if (toggleTag) toggleTag.style.display = "none";
    } else {
      if (toggleLabel) toggleLabel.style.display = "none";
      if (toggleTag) toggleTag.style.display = "flex";

      if (toggleTagLabel && tagElement) {
        const labelElement = tagElement.querySelector(CONFIG.selectors.dropdownLabel);
        if (labelElement) {
          toggleTagLabel.textContent = labelElement.textContent;
        } else {
          const selectedSlug = Array.from(selections)[0];
          toggleTagLabel.textContent = selectedSlug;
        }
      }
    }
  }

  function setupToggleTagClose() {
    state.dropdownWrappers.forEach((wrapper, wrapperIndex) => {
      const closeButton = wrapper.querySelector(
        CONFIG.selectors.dropdownToggleTagClose
      );

      if (!closeButton) return;

      closeButton.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const selections = state.dropdownSelections.get(wrapperIndex);
          if (selections) selections.clear();

          clearAllTagVisualsInWrapper(wrapper);

          const toggleLabel = wrapper.querySelector(
            CONFIG.selectors.dropdownToggleLabel
          );
          const toggleTag = wrapper.querySelector(CONFIG.selectors.dropdownToggleTag);

          if (toggleLabel) toggleLabel.style.display = "";
          if (toggleTag) toggleTag.style.display = "none";

          applyFilters();
          closeDropdown(wrapper);
        },
        true
      );
    });
  }

  function updateTagVisuals(tagElement, isSelected) {
    const iconCheck = tagElement.querySelector(CONFIG.selectors.iconCheck);
    const iconUncheck = tagElement.querySelector(CONFIG.selectors.iconUncheck);

    if (iconCheck) iconCheck.style.display = isSelected ? "block" : "none";
    if (iconUncheck) iconUncheck.style.display = isSelected ? "none" : "block";
  }

  function clearAllTagVisualsInWrapper(wrapper) {
    wrapper.querySelectorAll(CONFIG.selectors.dropdownTag).forEach((tag) => {
      updateTagVisuals(tag, false);
    });
  }

  function applyFilters() {
    state.items.forEach((item) => {
      const passesSearch = checkSearchFilter(item);
      const passesDropdowns = checkDropdownFilters(item);
      item.style.display = passesSearch && passesDropdowns ? "" : "none";
    });

    updateCount();

    document.dispatchEvent(
      new CustomEvent("filterApplied", {
        detail: {
          searchQuery: state.searchQuery,
          dropdownSelections: Object.fromEntries(state.dropdownSelections),
          visibleCount: state.items.filter((item) => item.style.display !== "none")
            .length,
          totalCount: state.items.length,
        },
      })
    );
  }

  // NEW: total + showing + hide/show parent of count-showing
  function updateCount() {
    const totalEl = document.querySelector(CONFIG.selectors.countTotal);
    const showingEl = document.querySelector(CONFIG.selectors.countShowing);

    const totalCount = state.items.length;
    const showingCount = state.items.filter((item) => item.style.display !== "none")
      .length;

    if (totalEl) totalEl.textContent = totalCount;
    if (showingEl) showingEl.textContent = showingCount;

    const hasDropdownFilter = Array.from(state.dropdownSelections.values()).some(
      (set) => set && set.size > 0
    );
    const hasSearchFilter = !!state.searchQuery;
    const isFilterActive = hasSearchFilter || hasDropdownFilter;

    // Hide/show the PARENT element of count-showing (as requested)
    if (showingEl && showingEl.parentElement) {
      showingEl.parentElement.style.display = isFilterActive ? "flex" : "none";
    }
  }

  function checkSearchFilter(item) {
    if (!state.searchQuery) return true;

    const searchableElements = item.querySelectorAll(CONFIG.selectors.searchSource);
    for (const element of searchableElements) {
      const text = normalizeText(element.textContent);
      if (text.includes(state.searchQuery)) return true;
    }
    return false;
  }

  function checkDropdownFilters(item) {
    const itemSourceTags = Array.from(item.querySelectorAll(CONFIG.selectors.sourceTag))
      .map((el) => el.getAttribute("data-filter-source-tag"))
      .filter(Boolean);

    for (const [, selections] of state.dropdownSelections) {
      if (!selections || selections.size === 0) continue;

      if (itemSourceTags.length === 0) return false;

      const hasMatchingTag = Array.from(selections).some((slug) =>
        itemSourceTags.includes(slug)
      );
      if (!hasMatchingTag) return false;
    }
    return true;
  }

  // Public API (optional, but kept from your version)
  window.WebflowFilter = {
    reset: function () {
      const searchInput = document.querySelector(CONFIG.selectors.liveSearch);
      if (searchInput) {
        searchInput.value = "";
        state.searchQuery = "";
      }

      state.dropdownWrappers.forEach((wrapper, index) => {
        const set = state.dropdownSelections.get(index);
        if (set) set.clear();

        clearAllTagVisualsInWrapper(wrapper);

        const toggleLabel = wrapper.querySelector(CONFIG.selectors.dropdownToggleLabel);
        const toggleTag = wrapper.querySelector(CONFIG.selectors.dropdownToggleTag);
        if (toggleLabel) toggleLabel.style.display = "";
        if (toggleTag) toggleTag.style.display = "none";
      });

      applyFilters();
    },

    getState: function () {
      return {
        searchQuery: state.searchQuery,
        dropdownSelections: Object.fromEntries(
          Array.from(state.dropdownSelections.entries()).map(([k, v]) => [
            k,
            Array.from(v),
          ])
        ),
        visibleItems: state.items.filter((item) => item.style.display !== "none").length,
        totalItems: state.items.length,
      };
    },

    setSearch: function (query) {
      const searchInput = document.querySelector(CONFIG.selectors.liveSearch);
      if (searchInput) searchInput.value = query;
      state.searchQuery = normalizeText(query);
      applyFilters();
    },

    selectTag: function (wrapperIndex, slug) {
      const wrapper = state.dropdownWrappers[wrapperIndex];
      if (!wrapper) return;

      const tagElement = wrapper.querySelector(
        `[data-filter-dropdown-tag="${slug}"]`
      );
      if (tagElement) toggleDropdownSelection(wrapperIndex, slug, tagElement, wrapper);
    },

    reinit: function () {
      init();
    },
  };

  let initialized = false;

  function bootstrap() {
    if (initialized) return;
    initialized = true;
    setTimeout(init, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }

  window.Webflow = window.Webflow || [];
  window.Webflow.push(() => {
    if (!initialized) {
      initialized = true;
      setTimeout(init, 100);
    }
  });

  // Finsweet CMS Load integration
  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push([
    "cmsload",
    (listInstances) => {
      listInstances.forEach((list) => {
        list.on("renderitems", () => {
          state.items = Array.from(document.querySelectorAll(CONFIG.selectors.item));
          applyFilters();
        });
      });
    },
  ]);

  // Loader + continuous refresh
  function ensureLoader() {
    const loader = document.querySelector(CONFIG.selectors.loader);
    if (!loader) return null;

    if (!document.querySelector("#filter-loader-style")) {
      const style = document.createElement("style");
      style.id = "filter-loader-style";
      style.textContent =
        "@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}";
      document.head.appendChild(style);
    }

    loader.style.animation = "spin 1s linear infinite";
    loader.style.display = "";
    return loader;
  }

  let loaderEl = null;
  let stableChecks = 0;
  let totalChecks = 0;
  const minChecksBeforeHide = 10;
  const stableChecksRequired = 5;

  function startWatcherOnce() {
    if (startWatcherOnce._started) return;
    startWatcherOnce._started = true;

    loaderEl = ensureLoader();

    setInterval(() => {
      totalChecks++;

      const currentItems = document.querySelectorAll(CONFIG.selectors.item);
      const currentCount = currentItems.length;

      if (currentCount !== state.items.length) {
        state.items = Array.from(currentItems);
        applyFilters();
        stableChecks = 0;
      } else {
        stableChecks++;
      }

      if (
        loaderEl &&
        totalChecks >= minChecksBeforeHide &&
        stableChecks >= stableChecksRequired &&
        loaderEl.style.display !== "none"
      ) {
        loaderEl.style.animation = "";
        loaderEl.style.display = "none";
      }
    }, 1000);
  }

  // Start watcher after init has run (ensures loader exists)
  const _origInit = init;
  init = function () {
    _origInit();
    startWatcherOnce();
  };
})();
