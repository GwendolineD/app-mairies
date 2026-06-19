"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
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
}: Props) {
  const listboxId = useId();
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<BanFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const listRef = useRef<HTMLUListElement>(null);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (value !== undefined && !isFocusedRef.current) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.querySelector("button")?.scrollIntoView({ block: "nearest" });
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
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(text);
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIndex(-1);
    }, 300);
  }

  async function handleFocus() {
    if (query.trim().length >= 2) {
      const results = await fetchSuggestions(query);
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIndex(-1);
      return;
    }
    if (suggestions.length > 0) {
      setOpen(true);
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

  return (
    <div className="relative w-full">
      {hideLabel ? null : (
        <label className="mb-1.5 block text-xs font-semibold text-text">
          {label}
        </label>
      )}
      <div className="relative">
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
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
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
            setTimeout(() => closeList(), 150);
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
      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-1200 mt-1 max-h-56 w-full overflow-auto rounded-sm border border-border bg-surface shadow-elevated"
        >
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
                  <span className="block text-sm font-medium text-text">{streetLine}</span>
                  {locationLine ? (
                    <span className="mt-0.5 block text-xs font-medium text-muted">
                      {locationLine}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
