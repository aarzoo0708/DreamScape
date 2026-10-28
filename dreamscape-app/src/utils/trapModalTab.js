export function trapModalTab(event, container) {
  if (event.key !== "Tab" || !container) return;

  const focusable = [...container.querySelectorAll(
    'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => element.getAttribute("aria-hidden") !== "true");
  if (!focusable.length) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
}
