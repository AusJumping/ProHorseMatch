import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Check, ChevronDown, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Horse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useMobile } from "@/hooks/use-mobile";
import { formatPrice, getMaxPrice } from "@/lib/currencyConverter";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: any;
  onApplyFilters: (filters: any) => void;
  horseCount?: number;
}

interface FilterConstants {
  disciplines?: string[];
  sexes?: string[];
  countries?: string[];
  levels?: Record<string, string[]>;
}

const breedOptions = [
  "Warmblood",
  "Warmblood Cross",
  "Thoroughbred",
  "Thoroughbred Cross",
  "Stock Horse",
  "Stock Horse Cross",
  "Riding Pony",
  "Other",
];

const fallbackCountries = [
  "Australia",
  "New Zealand",
  "North America",
  "Northern Europe",
  "Central Europe",
  "Southern Europe",
  "United Kingdom and Ireland",
];

function FilterSection({
  title,
  children,
  action,
  className = "",
}: {
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-[#dedbd2] py-5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-accent text-sm font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ChoiceChips({
  options,
  selected,
  onSelect,
  label,
}: {
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label={label}>
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option)}
            className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e] focus-visible:ring-offset-2 ${
              active
                ? "border-[#2b2b2b] bg-[#2b2b2b] text-white"
                : "border-[#d9d7d0] bg-white text-[#34332f] hover:border-[#cdac6e]"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function SearchableChoice({
  label,
  value,
  placeholder,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => options.filter((option) => option.toLowerCase().includes(search.trim().toLowerCase())),
    [options, search],
  );

  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) setSearch("");
    }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="h-11 w-full justify-between rounded-none border-0 border-b border-[#dedbd2] bg-transparent px-0 text-left font-normal text-foreground shadow-none hover:bg-transparent"
        >
          <span className={value ? "truncate" : "truncate text-muted-foreground"}>{value || placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="z-[70] w-[var(--radix-popover-trigger-width)] rounded-xl border-[#dedbd2] bg-white p-2 shadow-lg"
      >
        <Input
          autoFocus
          type="search"
          role="searchbox"
          aria-label={`Search ${label.toLowerCase()}`}
          placeholder={`Search ${label.toLowerCase()}…`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mb-2 h-10 rounded-none border-0 border-b border-[#dedbd2] bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div role="listbox" aria-label={label} className="max-h-52 overflow-y-auto">
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => {
              onSelect("");
              setOpen(false);
              setSearch("");
            }}
            className="flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm text-muted-foreground hover:bg-[#f2f0e9]"
          >
            {placeholder}
            {!value ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
          </button>
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={value === option}
              onClick={() => {
                onSelect(option);
                setOpen(false);
                setSearch("");
              }}
              className="flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm text-foreground hover:bg-[#f2f0e9]"
            >
              {option}
              {value === option ? <Check className="h-4 w-4 text-[#8b713c]" aria-hidden="true" /> : null}
            </button>
          ))}
          {!filtered.length ? <p className="px-3 py-5 text-center text-sm text-muted-foreground">No matches</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BloodlineSearch({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1 block text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        id={id}
        type="search"
        list={`${id}-suggestions`}
        placeholder={`Search ${label.toLowerCase()}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-none border-0 border-b border-[#dedbd2] bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <datalist id={`${id}-suggestions`}>
        {options.map((name) => <option key={name} value={name} />)}
      </datalist>
    </div>
  );
}

function RangeSlider({
  label,
  values,
  min,
  max,
  step,
  display,
  onChange,
  disabled = false,
}: {
  label: string;
  values: [number, number];
  min: number;
  max: number;
  step: number;
  display: (value: number, index: number) => string;
  onChange: (values: [number, number]) => void;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "space-y-4 opacity-50" : "space-y-4"}>
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-foreground">
        <span>{display(values[0], 0)}</span>
        <span className="text-muted-foreground">to</span>
        <span>{display(values[1], 1)}</span>
      </div>
      <SliderPrimitive.Root
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={0}
        value={values}
        onValueChange={(next) => {
          if (next.length === 2) onChange([next[0], next[1]]);
        }}
        disabled={disabled}
        aria-label={label}
        className="relative flex w-full touch-none select-none items-center py-2"
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[#e8e6df]">
          <SliderPrimitive.Range className="absolute h-full bg-[#2b2b2b]" />
        </SliderPrimitive.Track>
        {["Minimum", "Maximum"].map((bound) => (
          <SliderPrimitive.Thumb
            key={bound}
            aria-label={`${bound} ${label}`}
            aria-valuetext={display(values[bound === "Minimum" ? 0 : 1], bound === "Minimum" ? 0 : 1)}
            className="block h-6 w-6 rounded-full border-2 border-[#2b2b2b] bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e] focus-visible:ring-offset-2 disabled:pointer-events-none"
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  );
}

const emptyFilters = () => ({
  disciplines: [],
  breeds: [],
  sexes: [],
  levels: [],
  other_disciplines: [],
  location_country: null,
  location_radius_km: null,
  age_min: null,
  age_max: null,
  height_min: null,
  height_max: null,
  price_min: null,
  price_max: null,
  currency: "AUD",
  sire: null,
  dam_sire: null,
});

const asNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const FilterPanel = ({
  isOpen,
  onClose,
  activeFilters,
  onApplyFilters,
  horseCount = 0,
}: FilterPanelProps) => {
  const isMobile = useMobile();
  const [filters, setFilters] = useState(activeFilters);
  const [previewFilters, setPreviewFilters] = useState(activeFilters);
  const dragStartY = useRef<number | null>(null);
  const { currentCurrency, setCurrentCurrency } = useCurrency();
  const { data: constants } = useQuery<FilterConstants>({ queryKey: ["/api/constants"] });
  const { data: horsesForBloodlines = [] } = useQuery<Horse[]>({
    queryKey: ["/api/horses/bloodline-suggestions"],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await fetch("/api/horses");
      if (!response.ok) throw new Error("Could not load bloodline suggestions");
      return response.json();
    },
  });

  useEffect(() => setFilters(activeFilters), [activeFilters]);
  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewFilters(filters), 250);
    return () => window.clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    if (currentCurrency && filters.currency !== currentCurrency) {
      setFilters((previous: any) => ({ ...previous, currency: currentCurrency }));
    }
  }, [currentCurrency]);

  const change = (key: string, value: any) => {
    setFilters((previous: any) => ({ ...previous, [key]: value }));
    if (key === "currency") setCurrentCurrency(value);
  };

  const resultPreview = useQuery({
    queryKey: ["/api/horses/filter-result-count", previewFilters],
    enabled: isOpen,
    staleTime: 5_000,
    queryFn: async () => {
      const params = new URLSearchParams();
      previewFilters.disciplines?.forEach((value: string) => params.append("disciplines", value));
      previewFilters.breeds?.forEach((value: string) => params.append("breeds", value));
      previewFilters.sexes?.forEach((value: string) => params.append("sexes", value));
      previewFilters.levels?.forEach((value: string) => params.append("levels", value));
      if (previewFilters.location_country) params.append("location_country", previewFilters.location_country);
      if (previewFilters.age_min !== null) params.append("min_age", previewFilters.age_min?.toString() || "0");
      if (previewFilters.age_max !== null) params.append("max_age", previewFilters.age_max?.toString() || "999");
      if (previewFilters.height_min !== null) params.append("min_height", previewFilters.height_min?.toString() || "0");
      if (previewFilters.height_max !== null) params.append("max_height", previewFilters.height_max?.toString() || "999");
      if (previewFilters.price_min !== null) params.append("min_price", previewFilters.price_min?.toString() || "0");
      if (previewFilters.price_max !== null) params.append("max_price", previewFilters.price_max?.toString() || "999999999");
      if (previewFilters.currency) params.append("currency", previewFilters.currency);
      if (previewFilters.sire) params.append("sire", previewFilters.sire);
      if (previewFilters.dam_sire) params.append("dam_sire", previewFilters.dam_sire);
      const query = params.toString();
      const response = await fetch(`/api/horses${query ? `?${query}` : ""}`);
      if (!response.ok) throw new Error("Could not count matching horses");
      const horses = await response.json();
      return Array.isArray(horses) ? horses.length : 0;
    },
  });

  const selectSingle = (key: string, value: string) => {
    const selected = filters[key]?.[0] ?? "";
    change(key, selected === value ? [] : [value]);
  };

  const toggleMultiple = (key: string, value: string) => {
    const selected: string[] = filters[key] ?? [];
    change(key, selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const currency = filters.currency || currentCurrency || "AUD";
  const priceMax = getMaxPrice(currency);
  const priceValues: [number, number] = [
    Math.max(0, Math.min(priceMax, asNumber(filters.price_min, 0))),
    Math.max(0, Math.min(priceMax, asNumber(filters.price_max, priceMax))),
  ];
  const ageValues: [number, number] = [
    Math.max(-1, Math.min(16, asNumber(filters.age_min, -1))),
    Math.max(0, Math.min(17, asNumber(filters.age_max, 17))),
  ];
  const heightIsYoungHorse = filters.height_min === "young_horse" || filters.height_max === "young_horse";
  const heightValues: [number, number] = [
    Math.max(12.9, Math.min(16.3, asNumber(filters.height_min, 12.9))),
    Math.max(13, Math.min(17.1, asNumber(filters.height_max, 17.1))),
  ];
  const sexes = Array.from(new Set<string>([
    "Colt",
    "Filly",
    ...(constants?.sexes ?? []),
  ]));
  const countries: string[] = constants?.countries?.length ? constants.countries : fallbackCountries;
  const levels: string[] = filters.disciplines?.[0]
    ? Array.from(new Set([
      "Unbroken",
      "Not Competing",
      "Young Horse",
      ...(constants?.levels?.[filters.disciplines[0]] ?? []),
    ]))
    : [];
  const bloodlineSuggestions = Array.from(new Set(
    horsesForBloodlines
      .flatMap((horse) => [horse.sire, horse.dam_sire])
      .filter((name): name is string => Boolean(name?.trim()))
      .map((name) => name.trim()),
  )).sort((a, b) => a.localeCompare(b));
  const mainDisciplines = ["Jumping", "Dressage", "Eventing"];
  const otherDisciplines = mainDisciplines.filter((item) => item !== filters.disciplines?.[0]);

  const apply = () => {
    const filtersToApply = { ...filters };
    if (filtersToApply.disciplines?.includes("all_disciplines")) filtersToApply.disciplines = [];
    if (filtersToApply.breeds?.includes("all_breeds")) filtersToApply.breeds = [];
    if (filtersToApply.sexes?.includes("any_sex")) filtersToApply.sexes = [];
    if (filtersToApply.location_country === "any_location" || !filtersToApply.location_country) {
      filtersToApply.location_country = null;
    }
    if (filtersToApply.location_radius_km === "any_radius") filtersToApply.location_radius_km = null;
    onApplyFilters(filtersToApply);
    onClose();
    const url = new URL(window.location.href);
    if (filtersToApply.disciplines?.length) url.searchParams.set("discipline", filtersToApply.disciplines[0]);
    else url.searchParams.delete("discipline");
    window.history.replaceState(null, "", url.toString());
  };

  const clearAll = () => {
    const reset = emptyFilters();
    setFilters(reset);
    setCurrentCurrency("AUD");
  };

  const resultLabel = `${horseCount} ${horseCount === 1 ? "horse" : "horses"}`;

  const heightLabel = (value: number, index: number) => {
    if (index === 0 && value <= 12.9) return "Any height";
    if (index === 1 && value >= 17.1) return "Any height";
    return `${value.toFixed(1)}hh`;
  };

  const ageLabel = (value: number, index: number) => {
    if (index === 0 && value < 0) return "Any age";
    if (index === 1 && value >= 17) return "Any age";
    if (value === 0) return "Weanling";
    if (value === 1) return "Yearling";
    return `${value} years`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`fixed z-50 flex max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-[#dedbd2] bg-white p-0 shadow-2xl duration-300 [&>button:last-child]:hidden data-[state=open]:slide-in-from-left-0 data-[state=closed]:slide-out-to-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0 ${
          isMobile
            ? "bottom-0 left-0 right-0 top-auto h-[min(92dvh,56rem)] max-h-[92dvh] w-full rounded-t-[1.5rem] border-t data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full"
            : "bottom-0 left-auto right-0 top-0 h-dvh w-[min(36vw,31rem)] rounded-none border-l data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full"
        }`}
        onTouchStart={(event) => {
          const target = event.target as HTMLElement;
          const scrollArea = event.currentTarget.querySelector<HTMLElement>("#filter-panel-scroll");
          if (
            isMobile &&
            (target.closest("[data-filter-drag-zone]") ||
              (scrollArea?.scrollTop === 0 && !target.closest("input, button, [role='slider']")))
          ) {
            dragStartY.current = event.touches[0]?.clientY ?? null;
          }
        }}
        onTouchEnd={(event) => {
          const startY = dragStartY.current;
          dragStartY.current = null;
          const scrollArea = event.currentTarget.querySelector<HTMLElement>("#filter-panel-scroll");
          if (isMobile && startY !== null && scrollArea?.scrollTop === 0 && event.changedTouches[0].clientY - startY > 80) onClose();
        }}
      >
        {isMobile ? (
          <div data-filter-drag-zone className="flex h-7 shrink-0 touch-pan-y items-center justify-center" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-[#d4d1c8]" />
          </div>
        ) : null}
        <DialogHeader className="relative shrink-0 border-b border-[#e3e0d8] px-5 pb-3 text-left sm:px-7 sm:pt-5">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl font-semibold text-foreground">Filters</DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close filters"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-[#eeece5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div id="filter-panel-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7">
          <FilterSection title="Discipline" className="border-t-0">
            <ChoiceChips
              label="Discipline"
              options={mainDisciplines}
              selected={filters.disciplines ?? []}
              onSelect={(value) => selectSingle("disciplines", value)}
            />
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Also consider</p>
              <ChoiceChips
                label="Other disciplines"
                options={otherDisciplines}
                selected={filters.other_disciplines ?? []}
                onSelect={(value) => toggleMultiple("other_disciplines", value)}
              />
            </div>
          </FilterSection>

          <FilterSection title="Level">
            {levels.length ? (
              <SearchableChoice
                label="Level"
                value={filters.levels?.[0] ?? ""}
                placeholder="Any level"
                options={levels}
                onSelect={(value) => change("levels", value ? [value] : [])}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Choose a discipline to see its levels.</p>
            )}
          </FilterSection>

          <FilterSection
            title="Price range"
            action={(
              <CurrencySelector
                key={currency}
                defaultValue={currency}
                onChange={(value) => change("currency", value)}
                showLabel={false}
                className="w-[5.5rem] shrink-0 [&_button]:h-8 [&_button]:rounded-full [&_button]:border-0 [&_button]:bg-transparent [&_button]:px-2 [&_button]:text-xs"
              />
            )}
          >
            <RangeSlider
              label="Price range"
              values={priceValues}
              min={0}
              max={priceMax}
              step={5000}
              display={(value, index) => {
                const unbounded = index === 0 ? value <= 0 : value >= priceMax;
                return unbounded ? "Any price" : formatPrice(value, currency);
              }}
              onChange={([minimum, maximum]) => {
                change("price_min", minimum <= 0 ? null : minimum);
                change("price_max", maximum >= priceMax ? null : maximum);
              }}
            />
          </FilterSection>

          <FilterSection title="Age">
            <RangeSlider
              label="Age range"
              values={ageValues}
              min={-1}
              max={17}
              step={1}
              display={ageLabel}
              onChange={([minimum, maximum]) => {
                change("age_min", minimum < 0 ? null : minimum);
                change("age_max", maximum >= 17 ? null : maximum);
              }}
            />
          </FilterSection>

          <FilterSection title="Height">
            <RangeSlider
              label="Height range"
              values={heightValues}
              min={12.9}
              max={17.1}
              step={0.1}
              display={heightLabel}
              disabled={heightIsYoungHorse}
              onChange={([minimum, maximum]) => {
                change("height_min", minimum <= 12.9 ? null : Number(minimum.toFixed(1)));
                change("height_max", maximum >= 17.1 ? null : Number(maximum.toFixed(1)));
              }}
            />
            <button
              type="button"
              aria-pressed={heightIsYoungHorse}
              onClick={() => {
                if (heightIsYoungHorse) {
                  if (filters.height_min === "young_horse") change("height_min", null);
                  if (filters.height_max === "young_horse") change("height_max", null);
                } else {
                  change("height_min", "young_horse");
                  change("height_max", "young_horse");
                }
              }}
              className={`mt-4 min-h-9 rounded-full border px-3 text-xs font-medium ${
                heightIsYoungHorse ? "border-[#2b2b2b] bg-[#2b2b2b] text-white" : "border-[#dedbd2] bg-white text-foreground"
              }`}
            >
              Young horse
            </button>
          </FilterSection>

          <FilterSection title="Sex">
            <ChoiceChips
              label="Sex"
              options={sexes}
              selected={filters.sexes ?? []}
              onSelect={(value) => selectSingle("sexes", value)}
            />
          </FilterSection>

          <FilterSection title="Bloodlines">
            <div className="space-y-4">
              <BloodlineSearch
                id="filter-sire"
                label="Sire"
                value={filters.sire ?? ""}
                options={bloodlineSuggestions}
                onChange={(value) => change("sire", value || null)}
              />
              <BloodlineSearch
                id="filter-dam-sire"
                label="Dam Sire"
                value={filters.dam_sire ?? ""}
                options={bloodlineSuggestions}
                onChange={(value) => change("dam_sire", value || null)}
              />
            </div>
          </FilterSection>

          <FilterSection title="Breed">
            <SearchableChoice
              label="Breed"
              value={filters.breeds?.[0] ?? ""}
              placeholder="Any breed"
              options={breedOptions}
              onSelect={(value) => change("breeds", value ? [value] : [])}
            />
          </FilterSection>

          <FilterSection title="Country">
            <SearchableChoice
              label="Country"
              value={filters.location_country ?? ""}
              placeholder="Any country"
              options={countries}
              onSelect={(value) => change("location_country", value || null)}
            />
          </FilterSection>
          <div className="h-5" aria-hidden="true" />
        </div>

        <footer className="flex shrink-0 items-center gap-4 border-t border-[#e3e0d8] bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-7">
          <Button
            type="button"
            variant="ghost"
            onClick={clearAll}
            className="h-11 shrink-0 px-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
          <Button
            type="button"
            onClick={apply}
            className="h-12 flex-1 rounded-full bg-[#2b2b2b] text-base font-semibold text-white hover:bg-[#1c1c1c]"
          >
            Show {resultPreview.data ?? horseCount} {(resultPreview.data ?? horseCount) === 1 ? "horse" : "horses"}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
};

export default FilterPanel;
