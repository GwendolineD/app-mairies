"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formFieldClassName, Input } from "@/components/ui/form-field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { BanFeature } from "@/lib/ban/client";
import { searchMunicipalities } from "@/lib/ban/client";
import { formatMunicipalityDisplay } from "@/lib/ban/display";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  placeholder: string;
  onSelect: (feature: BanFeature) => void;
  value?: string;
  disabled?: boolean;
};

export function CommuneSelectPopover({
  label,
  placeholder,
  onSelect,
  value,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<BanFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverContentRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchResults = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const items = await searchMunicipalities(trimmed, 20);
      setResults(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      popoverContentRef.current
        ?.querySelector<HTMLInputElement>("input")
        ?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
      setLoading(false);
      clearTimeout(debounceRef.current);
    }
  }, [open]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  function handleSearchChange(text: string) {
    setSearch(text);
    clearTimeout(debounceRef.current);

    if (text.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void fetchResults(text);
    }, 300);
  }

  function clearSearch() {
    setSearch("");
    setResults([]);
    setLoading(false);
    clearTimeout(debounceRef.current);
    popoverContentRef.current
      ?.querySelector<HTMLInputElement>("input")
      ?.focus();
  }

  function selectCommune(feature: BanFeature) {
    onSelect(feature);
    setOpen(false);
  }

  const showEmpty =
    search.trim().length >= 3 && !loading && results.length === 0;

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-xs font-semibold text-text">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <Button
              type="button"
              variant="secondary"
              disabled={disabled}
              className={cn(
                formFieldClassName,
                "h-auto w-full cursor-pointer justify-between gap-2 px-4 py-2.5 font-medium md:py-2",
                !value && "text-subtle",
              )}
            />
          }
        >
          <span className="flex min-w-0 items-center gap-2">
            <MapPin
              className="size-[18px] shrink-0 text-subtle"
              aria-hidden
            />
            <span className="truncate">{value ?? placeholder}</span>
          </span>
          <ChevronDown className="size-[18px] shrink-0 text-subtle" aria-hidden />
        </PopoverTrigger>

        <PopoverContent
          ref={popoverContentRef}
          align="start"
          sideOffset={4}
          className="w-[var(--anchor-width)] min-w-[var(--anchor-width)] gap-0 p-0"
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
                aria-hidden
              />
              <Input
                type="search"
                autoComplete="off"
                placeholder="Rechercher une commune..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-9 pl-9 pr-9"
              />
              {search.length > 0 ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-subtle hover:bg-warm hover:text-text"
                  aria-label="Effacer la recherche"
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Recherche...
              </div>
            ) : null}

            {!loading && search.trim().length < 3 ? (
              <p className="px-3 py-6 text-center text-xs font-medium text-muted">
                Saisissez au moins 3 caractères pour rechercher
              </p>
            ) : null}

            {showEmpty ? (
              <p className="px-3 py-6 text-center text-xs font-medium text-muted">
                Aucune commune trouvée
              </p>
            ) : null}

            {!loading && results.length > 0 ? (
              <ul role="listbox" className="py-1">
                {results.map((feature) => {
                  const text = formatMunicipalityDisplay(feature);
                  return (
                    <li key={`${feature.citycode}-${feature.label}`}>
                      <button
                        type="button"
                        role="option"
                        className="w-full cursor-pointer px-3 py-2.5 text-left text-sm hover:bg-warm"
                        onClick={() => selectCommune(feature)}
                      >
                        {text}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
