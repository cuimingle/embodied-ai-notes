/* Use Material's toggles so the header, overlay, and keyboard share one state. */
(() => {
  const drawer = document.querySelector('.md-sidebar--primary');
  const drawerToggle = document.getElementById('__drawer');
  const drawerButtons = [...document.querySelectorAll('[data-site-toggle="drawer"]')];
  const desktopTree = window.matchMedia('(min-width: 64em)');

  if (drawer && drawerToggle && drawerButtons.length) {
    const close = drawer.querySelector('[data-close-tree]');
    let opener = drawerButtons[0];
    drawer.id = 'site-navigation';

    function visibleInTree(item) {
      // A closed details can still report layout boxes for its skipped children.
      return item && item.getClientRects().length && !item.closest('details:not([open]) > :not(summary)');
    }

    function syncDrawer() {
      const open = !desktopTree.matches && drawerToggle.checked;
      drawerButtons.forEach(button => button.setAttribute('aria-expanded', String(open)));
      const focusWasInside = drawer.contains(document.activeElement);
      if (!desktopTree.matches && !open && focusWasInside) opener.focus({ preventScroll: true });
      drawer.inert = !desktopTree.matches && !open;
      if (open) close?.focus({ preventScroll: true });
    }

    function closeDrawer() {
      if (drawerToggle.checked) drawerToggle.click();
      if (opener.getClientRects().length) opener.focus({ preventScroll: true });
    }

    for (const button of drawerButtons) {
      button.addEventListener('click', () => {
        if (desktopTree.matches) return;
        opener = button;
        drawerToggle.click();
      });
    }
    close?.addEventListener('click', closeDrawer);
    drawerToggle.addEventListener('change', syncDrawer);
    document.querySelector('label.md-overlay[for="__drawer"]')?.addEventListener('click', () => {
      if (drawerToggle.checked) opener.focus({ preventScroll: true });
    });

    document.addEventListener('keydown', event => {
      if (desktopTree.matches || !drawerToggle.checked) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
      } else if (event.key === 'Tab') {
        // The page underneath the modal drawer is outside the visible focus order.
        const items = [...drawer.querySelectorAll('button, a[href], summary')].filter(visibleInTree);
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
    desktopTree.addEventListener('change', () => {
      const previous = document.activeElement;
      if (drawerToggle.checked) drawerToggle.click();
      syncDrawer();
      if (desktopTree.matches && (previous === close || drawerButtons.includes(previous))) {
        const current = drawer.querySelector('[aria-current="page"]');
        const target = visibleInTree(current) ? current : drawer.querySelector('summary, a[href]');
        target?.focus({ preventScroll: true });
      }
    });
    syncDrawer();
  }

  const search = document.querySelector('[data-md-component="search"]');
  const searchToggle = document.getElementById('__search');
  const searchButton = document.querySelector('[data-site-toggle="search"]');
  if (search && searchButton && searchToggle) {
    search.id = 'site-search';
    const input = search.querySelector('input[type="text"]');
    const syncSearch = () => searchButton.setAttribute('aria-expanded', String(searchToggle.checked));
    searchButton.addEventListener('click', () => {
      searchToggle.click();
      if (searchToggle.checked) input?.focus();
      syncSearch();
    });
    searchToggle.addEventListener('change', syncSearch);
    search.addEventListener('click', () => queueMicrotask(syncSearch));
    search.addEventListener('focusin', () => queueMicrotask(syncSearch));
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !searchToggle.checked) return;
      searchToggle.click();
      input?.blur();
      if (searchButton.getClientRects().length) searchButton.focus();
      syncSearch();
    });
    syncSearch();
  }

  const sections = document.querySelector('.site-links');
  const activeSection = sections?.querySelector('.is-active, [aria-current]');
  if (activeSection) {
    const compactHeader = window.matchMedia('(max-width: 76.234375em)');
    function revealActiveSection() {
      if (!compactHeader.matches || sections.scrollWidth <= sections.clientWidth) return;
      const viewport = sections.getBoundingClientRect();
      const active = activeSection.getBoundingClientRect();
      if (active.left < viewport.left) sections.scrollLeft += active.left - viewport.left;
      else if (active.right > viewport.right) sections.scrollLeft += active.right - viewport.right;
    }
    requestAnimationFrame(revealActiveSection);
    compactHeader.addEventListener('change', revealActiveSection);
  }

  for (const outline of document.querySelectorAll('details.mobile-outline')) {
    outline.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      outline.open = false;
      const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (heading) {
        requestAnimationFrame(() => {
          if (!heading.hasAttribute('tabindex')) {
            heading.tabIndex = -1;
            heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
          }
          heading.focus({ preventScroll: true });
        });
      }
    });
    outline.addEventListener('keydown', event => {
      if (event.key === 'Escape' && outline.open) {
        outline.open = false;
        outline.querySelector('summary')?.focus();
      }
    });
  }
  for (const label of document.querySelectorAll('[data-md-component="palette"] label[for]')) {
    label.tabIndex = 0;
    label.setAttribute('role', 'button');
    label.setAttribute('aria-label', label.title);
    label.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        label.click();
        const active = label.closest('form').querySelector('label:not([hidden])');
        active?.focus();
      }
    });
  }
})();
