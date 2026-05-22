"use client";

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
};

export function BanAutocomplete({
  label,
  placeholder,
  fetchSuggestions,
  onSelect,
  value,
  disabled,
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

  return (
    <div className="relative w-full">
      <label className="mb-1 block text-sm font-medium text-text">{label}</label>
      <input
        type="text"
        name="autocomplete"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-purple"
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-surface shadow-card">
          {suggestions.map((s) => (
            <li key={`${s.citycode}-${s.label}`}>
              <button
                type="button"
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm hover:bg-warm",
                )}
                onMouseDown={() => {
                  setQuery(s.label);
                  onSelect(s);
                  setOpen(false);
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
