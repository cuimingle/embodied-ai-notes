/* Keep the custom header compatible with Material's native drawer and search. */
(() => {
  const surfaces = {
    drawer: document.querySelector('.md-sidebar--primary'),
    search: document.querySelector('[data-md-component="search"]')
  };
  for (const [name, surface] of Object.entries(surfaces)) {
    const button = document.querySelector(`[data-site-toggle="${name}"]`);
    const toggle = document.getElementById(`__${name}`);
    if (!button || !toggle || !surface) continue;
    surface.id = name === 'drawer' ? 'site-navigation' : 'site-search';
    const sync = () => button.setAttribute('aria-expanded', String(toggle.checked));
    button.addEventListener('click', () => {
      toggle.click();
      if (name === 'search' && toggle.checked) {
        surface.querySelector('input[type="text"]')?.focus();
      }
      sync();
    });
    toggle.addEventListener('change', sync);
    surface.addEventListener('click', () => queueMicrotask(sync));
    surface.addEventListener('focusin', () => queueMicrotask(sync));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && toggle.checked) {
        toggle.click();
        sync();
        if (name === 'search') surface.querySelector('input[type="text"]')?.blur();
        if (button.getClientRects().length) button.focus();
      }
      queueMicrotask(sync);
    });
    sync();
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
