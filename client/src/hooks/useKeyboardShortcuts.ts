import { useEffect, useCallback } from "react";

/**
 * Unified keyboard shortcut system for OmniScope.
 *
 * Standard shortcuts across all list views:
 *   S  → Toggle select mode
 *   /  → Focus search input
 *   Esc → Exit select mode / close modals / clear search
 *   A  → Select all (when in select mode)
 *   Delete / Backspace → Delete selected items (when in select mode)
 *
 * Usage:
 *   useKeyboardShortcuts({
 *     onToggleSelect: () => setIsSelectMode(prev => !prev),
 *     onFocusSearch: () => searchRef.current?.focus(),
 *     onEscape: () => { setIsSelectMode(false); setSearch(""); },
 *     onSelectAll: () => setSelectedIds(allIds),
 *     onDelete: () => handleBulkDelete(),
 *     isSelectMode: isSelectMode,
 *     hasSelection: selectedIds.size > 0,
 *     enabled: true,
 *   });
 */

interface KeyboardShortcutOptions {
  /** Toggle select mode on/off */
  onToggleSelect?: () => void;
  /** Focus the search input */
  onFocusSearch?: () => void;
  /** Escape handler — exit select, close modal, clear search */
  onEscape?: () => void;
  /** Select all items (only fires when in select mode) */
  onSelectAll?: () => void;
  /** Delete selected items (only fires when in select mode with selection) */
  onDelete?: () => void;
  /** Whether select mode is currently active */
  isSelectMode?: boolean;
  /** Whether there are selected items */
  hasSelection?: boolean;
  /** Master enable/disable — set false when modals are open, inputs focused, etc. */
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: KeyboardShortcutOptions) {
  const {
    onToggleSelect,
    onFocusSearch,
    onEscape,
    onSelectAll,
    onDelete,
    isSelectMode = false,
    hasSelection = false,
    enabled = true,
  } = options;

  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't intercept when user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Escape always works, even in inputs
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }

      // All other shortcuts are suppressed when typing in inputs
      if (isInput) return;

      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          onToggleSelect?.();
          break;

        case "/":
          e.preventDefault();
          onFocusSearch?.();
          break;

        case "a":
          if (isSelectMode) {
            e.preventDefault();
            onSelectAll?.();
          }
          break;

        case "delete":
        case "backspace":
          if (isSelectMode && hasSelection) {
            e.preventDefault();
            onDelete?.();
          }
          break;
      }
    },
    [enabled, isSelectMode, hasSelection, onToggleSelect, onFocusSearch, onEscape, onSelectAll, onDelete]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler, enabled]);
}

export default useKeyboardShortcuts;
