"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [query, setQuery] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<BanFeature[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  function handleChange(text: string) {
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(text);
      setSuggestions(results);
      setOpen(results.length > 0);
    }, 300);
  }

  async function handleFocus() {
    if (query.trim().length >= 2) {
      const results = await fetchSuggestions(query);
      setSuggestions(results);
      setOpen(results.length > 0);
      return;
    }
    if (suggestions.length > 0) setOpen(true);
  }

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
          type="text"
          name="autocomplete"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => void handleFocus()}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={cn(
            "w-full rounded-sm border border-border bg-surface py-3.5 text-sm text-text outline-none placeholder:text-subtle focus:border-purple disabled:cursor-not-allowed disabled:opacity-50 md:py-2.5",
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
      {open && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-sm border border-border bg-surface shadow-elevated">
          {suggestions.map((s) => {
            const label = formatSuggestion?.(s) ?? s.label;
            return (
            <li key={`${s.citycode}-${s.label}`}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-warm"
                onMouseDown={() => {
                  setQuery(label);
                  onSelect(s);
                  setOpen(false);
                }}
              >
                {label}
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
