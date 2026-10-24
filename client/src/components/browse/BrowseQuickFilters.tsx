import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrency } from "@/contexts/CurrencyContext";

export interface QuickFilterValues {
  disciplines: string[];
  price_min: number | null;
  price_max: number | null;
  height_min: number | null;
  height_max: number | null;
  age_min: number | null;
  age_max: number | null;
  currency: string | null;
}

type RangeKey = "price" | "height" | "age";
type Range = [number, number];

interface BrowseQuickFiltersProps {
  activeFilters: QuickFilterValues;
  onDisciplineToggle: (discipline: string) => void;
  onApplyRange: (key: RangeKey, range: [number | null, number | null] | null) => void;
}

const quickDisciplines = [
  { label: "Jumping", value: "Jumping" },
  { label: "Dressage", value: "Dressage" },
  { label: "Eventing", value: "Eventing" },
];

const rangeConfig: Record<RangeKey, { title: string; minimum: number; maximum: number; step: number; suffix: string }> = {
  price: { title: "Price range", minimum: 0, maximum: 500000, step: 5000, suffix: "" },
  height: { title: "Height", minimum: 12, maximum: 18, step: 0.1, suffix: " hh" },
  age: { title: "Age", minimum: 0, maximum: 30, step: 1, suffix: " years" },
};

export default function BrowseQuickFilters({
  activeFilters,
  onDisciplineToggle,
  onApplyRange,
}: BrowseQuickFiltersProps) {
  const [activeRange, setActiveRange] = useState<RangeKey | null>(null);
  const [draft, setDraft] = useState<Range>([0, 500000]);
  const { currentCurrency, formatPrice } = useCurrency();
  const filterCurrency = activeFilters.currency || currentCurrency;

  const boundsFor = (key: RangeKey): [number | null, number | null] => {
    const lower = activeFilters[`${key}_min`];
    const upper = activeFilters[`${key}_max`];
    return [
      typeof lower === "number" && Number.isFinite(lower) ? lower : null,
      typeof upper === "number" && Number.isFinite(upper) && upper < (key === "price" ? 999999999 : 999) ? upper : null,
    ];
  };
  const configFor = (key: RangeKey) => {
    const base = rangeConfig[key];
    const [lower, upper] = boundsFor(key);
    // Keep advanced-filter bounds editable even outside the quick slider's
    // normal range. The final slider position always represents no maximum.
    const increment = key === "height" ? 1 : base.step;
    return {
      ...base,
      minimum: key === "height" && lower !== null ? Math.min(base.minimum, lower - 1) : base.minimum,
      maximum: Math.max(base.maximum, upper === null ? base.maximum : upper + increment, lower === null ? base.maximum : lower + increment),
    };
  };
  const rangeFor = (key: RangeKey): Range | null => {
    const [lower, upper] = boundsFor(key);
    const config = configFor(key);
    return lower !== null || upper !== null ? [lower ?? config.minimum, upper ?? config.maximum] : null;
  };

  useEffect(() => {
    if (!activeRange) return;
    const config = configFor(activeRange);
    setDraft(rangeFor(activeRange) ?? [config.minimum, config.maximum]);
  }, [activeRange, activeFilters]);

  const rangeLabel = (key: RangeKey) => {
    const range = rangeFor(key);
    const [lower, upper] = boundsFor(key);
    const title = key === "price" ? "Price" : key === "height" ? "Height" : "Age";
    if (!range) return title;
    if (key === "price") {
      const minimum = lower === null ? "Any" : formatPrice(lower, filterCurrency);
      return `${title}: ${minimum} – ${upper === null ? "Any" : formatPrice(upper, filterCurrency)}`;
    }
    const suffix = rangeConfig[key].suffix;
    const minimum = lower === null ? "Any" : `${lower}${suffix}`;
    return `${title}: ${minimum} – ${upper === null ? "Any" : `${upper}${suffix}`}`;
  };

  const renderRangeChip = (key: RangeKey) => (
    <Button
      key={key}
      type="button"
      variant="outline"
      onClick={() => setActiveRange(key)}
      className={`h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${
        rangeFor(key)
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-border bg-card text-foreground hover:border-accent hover:bg-accent/10"
      }`}
      aria-haspopup="dialog"
    >
      {rangeLabel(key)}
      {rangeFor(key) ? <X className="ml-2 h-3.5 w-3.5" aria-hidden="true" /> : null}
    </Button>
  );

  const config = activeRange ? configFor(activeRange) : null;
  const heightUnits = (hands: number) => Math.floor(hands) * 4 + Math.round((hands % 1) * 10);
  const displayValue = (value: number) => {
    if (activeRange === "price") return formatPrice(value, filterCurrency);
    return `${value}${config?.suffix ?? ""}`;
  };

  return (
    <>
      <div className="mb-4 sm:mb-7">
        <div className="mb-2 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:mb-3 sm:text-xs sm:tracking-[0.14em]">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Refine your search
        </div>
        <div className="flex w-full flex-nowrap gap-2.5 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Quick horse filters">
          {quickDisciplines.map(({ label, value }) => {
            const selected = activeFilters.disciplines.includes(value);
            return (
              <Button
                key={value}
                type="button"
                variant="outline"
                aria-pressed={selected}
                onClick={() => onDisciplineToggle(value)}
                className={`h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-card text-foreground hover:border-accent hover:bg-accent/10"
                }`}
              >
                {label}
              </Button>
            );
          })}
          {renderRangeChip("price")}
          {renderRangeChip("height")}
          {renderRangeChip("age")}
        </div>
      </div>

      <Dialog open={activeRange !== null} onOpenChange={(open) => !open && setActiveRange(null)}>
        <DialogContent className="bottom-0 left-0 top-auto w-full max-w-none translate-x-0 translate-y-0 gap-7 rounded-t-[1.5rem] border-0 bg-background p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-18px_60px_rgba(42,36,25,0.18)] data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-left-0 data-[state=closed]:slide-out-to-left-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(92vw,32rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:p-8 sm:pb-8">
          {activeRange && config ? (
            <>
              <DialogHeader className="pr-8 text-left">
                <DialogTitle className="font-accent text-2xl">{config.title}</DialogTitle>
                <DialogDescription>Set a range to narrow the horses shown.</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 px-1">
                <div className="flex justify-between gap-4 font-accent text-sm font-semibold">
                  <span>{draft[0] === config.minimum ? "No minimum" : displayValue(draft[0])}</span>
                  <span>{draft[1] >= config.maximum ? "No maximum" : displayValue(draft[1])}</span>
                </div>
                <SliderPrimitive.Root
                  min={activeRange === "height" ? heightUnits(config.minimum) : config.minimum}
                  max={activeRange === "height" ? heightUnits(config.maximum) : config.maximum}
                  step={activeRange === "height" ? 1 : config.step}
                  minStepsBetweenThumbs={0}
                  value={activeRange === "height" ? draft.map(heightUnits) : draft}
                  onValueChange={(value) => {
                    const values = activeRange === "height"
                      ? value.map((inches) => Math.floor(inches / 4) + (inches % 4) / 10)
                      : value;
                    setDraft([values[0], values[1]]);
                  }}
                  className="relative flex w-full touch-none select-none items-center py-4"
                >
                  <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
                    <SliderPrimitive.Range className="absolute h-full bg-primary" />
                  </SliderPrimitive.Track>
                  {["Minimum", "Maximum"].map((bound) => (
                    <SliderPrimitive.Thumb
                      key={bound}
                      aria-label={`${bound} ${activeRange}`}
                      aria-valuetext={displayValue(draft[bound === "Minimum" ? 0 : 1])}
                      className="block h-6 w-6 rounded-full border-2 border-primary bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
                    />
                  ))}
                </SliderPrimitive.Root>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{displayValue(config.minimum)}</span>
                  <span>{activeRange === "price" ? "No maximum" : displayValue(config.maximum)}</span>
                </div>
              </div>
              <DialogFooter className="flex-row justify-between gap-3 border-t border-border pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    onApplyRange(activeRange, null);
                    setActiveRange(null);
                  }}
                  className="rounded-full"
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    onApplyRange(activeRange, [
                      draft[0] === config.minimum ? null : draft[0],
                      draft[1] === config.maximum ? null : draft[1],
                    ]);
                    setActiveRange(null);
                  }}
                  className="rounded-full px-7"
                >
                  Apply range
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
