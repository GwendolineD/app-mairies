"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";
import type { BanFeature } from "@/lib/ban/client";

type Props = {
  label: string;
  placeholder: string;
  fetchSuggestions: (query: string) => Promise<BanFeature[]>;
  onSelect: (feature: BanFeature) => void;
  onInputChange?: (text: string) => void;
  value?: string;
  disabled?: boolean;
  inputClassName?: string;
  hideLabel?: boolean;
  leadingIcon?: LucideIcon;
  showChevron?: boolean;
  formatSuggestion?: (feature: BanFeature) => string;
  /** When true, suggestions render on a single line (e.g. municipality name + postcode). */
  singleLine?: boolean;
  autoFocus?: boolean;
  emptyMessage?: string;
  minCharsHint?: string;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

function suggestionLabel(
  feature: BanFeature,
  formatSuggestion?: (feature: BanFeature) => string,
) {
  return formatSuggestion?.(feature) ?? feature.label;
}

export function BanAutocomplete({
  label,
  placeholder,
  fetchSuggestions,
  onSelect,
  onInputChange,
  value,
  disabled,
  inputClassName,
  hideLabel,
  leadingIcon: LeadingIcon,
  showChevron,
  formatSuggestion,
  singleLine,
  autoFocus,
  emptyMessage = "Aucun résultat trouvé",
  minCharsHint = "Saisissez au moins 3 caractères pour rechercher",
}: Props) {
  const listboxId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<BanFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(
    null,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mountedRef = useRef(true);
  const listRef = useRef<HTMLUListElement>(null);
  const isFocusedRef = useRef(false);

  const updateDropdownPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (value !== undefined && !isFocusedRef.current) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(debounceRef.current);
      clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setDropdownPosition(null);
      return;
    }

    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [open, loading, suggestions.length, updateDropdownPosition]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function closeList() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function selectSuggestion(feature: BanFeature) {
    setQuery(suggestionLabel(feature, formatSuggestion));
    onSelect(feature);
    closeList();
  }

  function handleChange(text: string) {
    setQuery(text);
    onInputChange?.(text);
    setActiveIndex(-1);
    clearTimeout(debounceRef.current);

    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setLoading(false);
      setSuggestions([]);
      setOpen(isFocusedRef.current);
      return;
    }

    setLoading(true);
    setOpen(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(text);
        if (!mountedRef.current) return;
        setSuggestions(results);
        setOpen(true);
        setActiveIndex(-1);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }, 300);
  }

  async function handleFocus() {
    const trimmed = query.trim();
    if (trimmed.length >= 3) {
      setLoading(true);
      setOpen(true);
      try {
        const results = await fetchSuggestions(query);
        if (!mountedRef.current) return;
        setSuggestions(results);
        setOpen(true);
        setActiveIndex(-1);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
      return;
    }

    setOpen(true);
    if (suggestions.length > 0) {
      setActiveIndex(-1);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        closeList();
      }
      return;
    }

    if (e.key === "Tab") {
      closeList();
      return;
    }

    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      setActiveIndex((index) =>
        index < suggestions.length - 1 ? index + 1 : 0,
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(suggestions.length - 1);
        return;
      }
      setActiveIndex((index) =>
        index > 0 ? index - 1 : suggestions.length - 1,
      );
      return;
    }

    if (e.key === "Enter" && open && activeIndex >= 0) {
      e.preventDefault();
      const feature = suggestions[activeIndex];
      if (feature) selectSuggestion(feature);
    }
  }

  const activeOptionId =
    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  const trimmedQuery = query.trim();
  const showMinCharsHint = trimmedQuery.length < 3;
  const showEmpty =
    !loading && trimmedQuery.length >= 3 && suggestions.length === 0;
  const showResults = !loading && suggestions.length > 0;
  const showPanel =
    open &&
    dropdownPosition &&
    (loading || showMinCharsHint || showEmpty || showResults);

  const dropdown = showPanel ? (
    <div
      style={{
        position: "fixed",
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 1200,
      }}
      className="max-h-56 overflow-auto rounded-sm border border-border bg-surface shadow-elevated"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Recherche…
        </div>
      ) : null}

      {!loading && showMinCharsHint ? (
        <p className="px-4 py-6 text-center text-xs font-medium text-muted">
          {minCharsHint}
        </p>
      ) : null}

      {showEmpty ? (
        <p className="px-4 py-6 text-center text-xs font-medium text-muted">
          {emptyMessage}
        </p>
      ) : null}

      {showResults ? (
        <ul ref={listRef} id={listboxId} role="listbox" className="py-1">
          {suggestions.map((feature, index) => {
            const streetLine = suggestionLabel(feature, formatSuggestion);
            const locationLine = [feature.postcode?.trim(), feature.city?.trim()]
              .filter(Boolean)
              .join(" ");
            const isActive = index === activeIndex;
            return (
              <li key={`${feature.citycode}-${feature.label}-${index}`} role="presentation">
                <button
                  type="button"
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    "w-full cursor-pointer px-4 py-2.5 text-left hover:bg-warm",
                    isActive && "bg-warm",
                  )}
                  onPointerDown={() => selectSuggestion(feature)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {singleLine ? (
                    <span className="block truncate text-sm font-medium text-text">
                      {streetLine}
                    </span>
                  ) : (
                    <>
                      <span className="block text-sm font-medium text-text">{streetLine}</span>
                      {locationLine ? (
                        <span className="mt-0.5 block text-xs font-medium text-muted">
                          {locationLine}
                        </span>
                      ) : null}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="relative w-full">
      {hideLabel ? null : (
        <label className="mb-1.5 block text-xs font-semibold text-text">
          {label}
        </label>
      )}
      <div ref={anchorRef} className="relative">
        {LeadingIcon ? (
          <LeadingIcon
            className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle"
            aria-hidden
          />
        ) : null}
        <Input
          type="text"
          name="autocomplete"
          autoComplete="off"
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={Boolean(showPanel)}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-busy={loading}
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            isFocusedRef.current = true;
            void handleFocus();
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            if (value !== undefined && value !== query) {
              setQuery(value);
            }
            clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = setTimeout(() => closeList(), 150);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            LeadingIcon ? "pl-10" : undefined,
            showChevron ? "pr-10" : undefined,
            inputClassName,
          )}
        />
        {showChevron ? (
          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle"
            aria-hidden
          />
        ) : null}
      </div>
      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
