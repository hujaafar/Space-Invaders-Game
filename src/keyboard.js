export function ignoreGameShortcut(event) {
  return Boolean(event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey ||
    event.target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
}
