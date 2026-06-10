"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { BanFeature } from "@/lib/ban/client";

type Props = {
  label: string;
  placeholder: string;
  fetchSuggestions: (query: string) => Promise<BanFeature[]>;
  onSelect: (feature: BanFeature) => void;
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
  value,
  disabled,
  inputClassName,
  hideLabel,
  leadingIcon: LeadingIcon,
  showChevron,
  formatSuggestion,
}: Props) {
  const listboxId = useId();
  const [suggestions, setSuggestions] = useState<BanFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const queryRef = useRef(value ?? "");

  useEffect(() => {
    if (value === undefined) return;
    queryRef.current = value;
    if (inputRef.current) {
      inputRef.current.value = value;
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
    const nextQuery = suggestionLabel(feature, formatSuggestion);
    queryRef.current = nextQuery;
    if (inputRef.current) {
      inputRef.current.value = nextQuery;
    }
    onSelect(feature);
    closeList();
  }

  function handleChange(text: string) {
    queryRef.current = text;
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
    const query = queryRef.current;
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
        <input
          ref={inputRef}
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
          defaultValue={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => void handleFocus()}
          onBlur={() => setTimeout(() => closeList(), 150)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full rounded-sm border border-border bg-surface py-2.5 text-sm text-text outline-none placeholder:text-subtle focus:border-purple disabled:cursor-not-allowed disabled:opacity-50 md:py-2",
            LeadingIcon ? "pl-10" : "px-4",
            showChevron ? "pr-10" : LeadingIcon ? "pr-4" : "px-4",
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
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-sm border border-border bg-surface shadow-elevated"
        >
          {suggestions.map((feature, index) => {
            const text = suggestionLabel(feature, formatSuggestion);
            const isActive = index === activeIndex;
            return (
              <li key={`${feature.citycode}-${feature.label}`} role="presentation">
                <button
                  type="button"
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    "w-full cursor-pointer px-4 py-2.5 text-left text-sm hover:bg-warm",
                    isActive && "bg-warm",
                  )}
                  onMouseDown={() => selectSuggestion(feature)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {text}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
