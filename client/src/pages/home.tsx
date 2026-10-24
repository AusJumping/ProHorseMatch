import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import FilterPanel from "@/components/FilterPanel";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import type { Horse, Match } from "@shared/schema";
import { ownsHorse } from "@shared/horsePermissions";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";
import BrowseHorseGrid from "@/components/browse/BrowseHorseGrid";
import BrowseQuickFilters from "@/components/browse/BrowseQuickFilters";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { formatPrice } from "@/lib/currencyConverter";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Filter {
  disciplines: string[];
  breeds: string[];
  sexes: string[];
  levels: string[];
  other_disciplines: string[];
  location_country: string | null;
  location_radius_km: number | null;
  age_min: number | null;
  age_max: number | null;
  height_min: number | null;
  height_max: number | null;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
  sire: string | null;
  dam_sire: string | null;
}

function syncDisciplineQuery(selected: string[]) {
  const url = new URL(window.location.href);
  if (selected.length) url.searchParams.set("discipline", selected[0]);
  else url.searchParams.delete("discipline");
  window.history.replaceState(null, "", url.toString());
}

export default function Home() {
  const isMobile = useMobile();
  const [location] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { setCurrentCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hasLocalUser, setHasLocalUser] = useState(false);
  const [pendingSaveIds, setPendingSaveIds] = useState<Set<number>>(() => new Set());
  const pendingSaveIdsRef = useRef<Set<number>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Filter>({
    disciplines: [],  // Empty array for All Disciplines
    breeds: [],       // Empty array for All Breeds
    sexes: [],        // Empty array for Any Sex
    levels: [],       // Empty array for All Levels
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
  
  // Check if this is the discover route to show filter by default
  // For filter route, check URL parameters to determine if user wants to see filters
  useEffect(() => {
    // Check for show_filters URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const showFiltersParam = urlParams.get('show_filters');
    
    if (location === "/discover") {
      setIsFilterOpen(true);
    } else if (location === "/filter" && showFiltersParam === "true") {
      setIsFilterOpen(true);
    } else {
      setIsFilterOpen(false);
    }
    
    // Check if we have a discipline filter in localStorage or URL
    const urlDiscipline = urlParams.get('discipline');
    const storedDiscipline = localStorage.getItem('active_discipline_filter');
    
    // Use URL parameter first, then localStorage
    const disciplineFilter = urlDiscipline || storedDiscipline;
    
    if (disciplineFilter) {
      console.log("Found active discipline filter:", disciplineFilter);
      
      // Clear from localStorage after reading so it only applies once (one-time handoff from landing page)
      localStorage.removeItem('active_discipline_filter');
      
      // Apply the filter from storage, unless filters are already chosen (the filter panel
      // also writes the discipline into the URL, and that must not overwrite a multi-select)
      setActiveFilters(prev => prev.disciplines.length > 0 ? prev : ({
        ...prev,
        disciplines: [disciplineFilter]
      }));
    }
  }, [location, search]);
  
  useEffect(() => {
    try {
      setHasLocalUser(Boolean(localStorage.getItem("user")));
    } catch {
      setHasLocalUser(false);
    }
  }, []);

  // Query for horses with filters
  const { data: horses, isLoading, isError, refetch: refetchHorses } = useQuery<Horse[]>({
    queryKey: ['/api/horses', activeFilters],
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
    queryFn: async () => {
      // Build query parameters from activeFilters
      const params = new URLSearchParams();
      
      // Only add non-empty array filters or non-null values
      if (activeFilters.disciplines && activeFilters.disciplines.length > 0) {
        activeFilters.disciplines.forEach((d: string) => params.append('disciplines', d));
      }
      
      if (activeFilters.breeds && activeFilters.breeds.length > 0) {
        activeFilters.breeds.forEach((b: string) => params.append('breeds', b));
      }
      
      if (activeFilters.sexes && activeFilters.sexes.length > 0) {
        activeFilters.sexes.forEach((s: string) => params.append('sexes', s));
      }
      
      if (activeFilters.levels && activeFilters.levels.length > 0) {
        activeFilters.levels.forEach((l: string) => params.append('levels', l));
      }
      
      if (activeFilters.location_country) {
        params.append('location_country', activeFilters.location_country);
      }
      
      if (activeFilters.age_min !== null) {
        params.append('min_age', activeFilters.age_min?.toString() || '0');
      }
      
      if (activeFilters.age_max !== null) {
        params.append('max_age', activeFilters.age_max?.toString() || '999');
      }
      
      if (activeFilters.height_min !== null) {
        params.append('min_height', activeFilters.height_min?.toString() || '0');
      }
      
      if (activeFilters.height_max !== null) {
        params.append('max_height', activeFilters.height_max?.toString() || '999');
      }
      
      if (activeFilters.price_min !== null) {
        params.append('min_price', activeFilters.price_min?.toString() || '0');
      }
      
      if (activeFilters.price_max !== null) {
        params.append('max_price', activeFilters.price_max?.toString() || '999999999');
      }
      
      if (activeFilters.currency) {
        params.append('currency', activeFilters.currency);
      }
      
      // Add bloodline filters
      if (activeFilters.sire) {
        params.append('sire', activeFilters.sire);
      }
      
      if (activeFilters.dam_sire) {
        params.append('dam_sire', activeFilters.dam_sire);
      }
      
      console.log('Filter params:', params.toString());
      
      // Fetch horses with the filter parameters
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/horses${queryString}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch horses');
      }
      
      const result = await response.json();
      return result;
    }
  });

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ['/api/matches'],
    enabled: isAuthenticated || hasLocalUser,
  });

  // Refresh the horse list whenever the app comes back from the background
  // (e.g. a logged-in user reopening the installed PWA) so newly listed
  // horses always appear without a manual reload
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refetchHorses();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refetchHorses]);

  const handleToggleSaved = async (horseId: number, isSaved: boolean): Promise<boolean> => {
    if (pendingSaveIdsRef.current.has(horseId)) return false;
    let currentUser = user;
    if (!currentUser) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
        }
      } catch (e) {
        console.error("Error reading cached user:", e);
      }
    }

    if (!currentUser || !currentUser.id) {
      toast({
        title: "Login Required",
        description: "Please log in to save this horse to your favorites.",
        variant: "default",
      });
      return false;
    }

    const horse = horses?.find(item => item.id === horseId);
    if (horse && ownsHorse(currentUser.id, horse) && !isSaved) {
      toast({ title: "Cannot save your own horse", variant: "destructive" });
      return false;
    }

    if (!horseId) {
      toast({
        title: "Error",
        description: "Invalid horse selection. Please try again.",
        variant: "destructive",
      });
      return false;
    }

    pendingSaveIdsRef.current.add(horseId);
    setPendingSaveIds(new Set(pendingSaveIdsRef.current));
    try {
      const authToken = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/matches', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer_id: currentUser.id,
          horse_id: horseId,
          is_liked: !isSaved
        }),
        credentials: 'include'
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
        toast({
          title: isSaved ? "Removed from favorites" : "Horse saved",
          description: isSaved ? "This horse has been removed from your favorites." : "This horse has been added to your favorites.",
          duration: 1200,
        });
        return true;
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to process like request");
      }
    } catch (error) {
      console.error("Error updating saved horse:", error);
      toast({
        title: "Error",
        description: "Failed to update your saved horses. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      pendingSaveIdsRef.current.delete(horseId);
      setPendingSaveIds(new Set(pendingSaveIdsRef.current));
    }
  };

  const toggleQuickDiscipline = (discipline: string) => {
    const next = activeFilters.disciplines.includes(discipline)
      ? activeFilters.disciplines.filter((item) => item !== discipline)
      : [discipline];
    syncDisciplineQuery(next);
    setActiveFilters((prev) => ({
      ...prev,
      disciplines: next,
      levels: [],
    }));
  };

  const applyQuickRange = (
    key: "price" | "height" | "age",
    range: [number | null, number | null] | null,
  ) => {
    const fields = key === "price"
      ? ["price_min", "price_max"] as const
      : key === "height"
        ? ["height_min", "height_max"] as const
        : ["age_min", "age_max"] as const;
    setActiveFilters((prev) => ({
      ...prev,
      [fields[0]]: range?.[0] ?? null,
      [fields[1]]: range?.[1] ?? null,
    }));
  };

  const handleApplyFilters = (newFilters: Filter) => {
    // Create a clean copy of the filters to avoid mutation issues
    const cleanFilters = { ...newFilters };
    
    // Clean up the disciplines array - remove "all_disciplines" value if present
    if (cleanFilters.disciplines?.includes("all_disciplines")) {
      cleanFilters.disciplines = [];
    }
    
    // Clean up the breeds array - empty array means all breeds
    if (cleanFilters.breeds?.includes("all_breeds")) {
      cleanFilters.breeds = [];
    }
    
    // Clean up the sexes array - remove "any_sex" value if present
    if (cleanFilters.sexes?.includes("any_sex")) {
      cleanFilters.sexes = [];
    }
    
    // Handle location - "any_location" or null means no location filter
    if (cleanFilters.location_country === "any_location") {
      cleanFilters.location_country = null;
    }
    
    // Convert radius from string to number or null
    if (typeof cleanFilters.location_radius_km === 'string' && cleanFilters.location_radius_km === "any_radius") {
      cleanFilters.location_radius_km = null;
    }
    
    console.log('Applying filters:', cleanFilters);
    setActiveFilters(cleanFilters);
    setIsFilterOpen(false);
    
    // On mobile, ensure the filter panel doesn't automatically show after applying filters
    if (isMobile && location === "/filter") {
      // The "show filters" request is now done. Remove it from the URL, otherwise the next URL
      // change (the filter panel records the chosen discipline there) reopens the panel and the
      // person has to tap Apply Filters a second time.
      const url = new URL(window.location.href);
      if (url.searchParams.has('show_filters') || url.searchParams.has('t')) {
        url.searchParams.delete('show_filters');
        url.searchParams.delete('t');
        window.history.replaceState(null, "", url.toString());
      }
    }
  };

  const toggleFilterPanel = () => {
    setIsFilterOpen((open) => !open);
  };

  const removeActiveFilter = (key: string, value?: string) => {
    if (key === "disciplines") {
      syncDisciplineQuery(activeFilters.disciplines.filter((item) => item !== value));
    }
    setActiveFilters((previous) => {
      if (key === "price") return { ...previous, price_min: null, price_max: null };
      if (key === "age") return { ...previous, age_min: null, age_max: null };
      if (key === "height") return { ...previous, height_min: null, height_max: null };
      if (key === "height_young") return {
        ...previous,
        height_min: previous.height_min === "young_horse" ? null : previous.height_min,
        height_max: previous.height_max === "young_horse" ? null : previous.height_max,
      };
      if (key === "location_country") return { ...previous, location_country: null };
      if (key === "sire" || key === "dam_sire") return { ...previous, [key]: null };
      if (key === "disciplines" || key === "other_disciplines" || key === "sexes" || key === "breeds" || key === "levels") {
        const selected = previous[key] as string[];
        return { ...previous, [key]: selected.filter((item) => item !== value) };
      }
      return previous;
    });
  };

  const clearAllActiveFilters = () => {
    syncDisciplineQuery([]);
    setActiveFilters({
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
    setCurrentCurrency("AUD");
  };

  const activeFilterChips: { key: string; value?: string; label: string }[] = [];
  activeFilters.disciplines.forEach((value) => activeFilterChips.push({ key: "disciplines", value, label: value }));
  activeFilters.levels.forEach((value) => activeFilterChips.push({ key: "levels", value, label: value }));
  activeFilters.other_disciplines.forEach((value) => activeFilterChips.push({ key: "other_disciplines", value, label: `Also ${value}` }));
  activeFilters.sexes.forEach((value) => activeFilterChips.push({ key: "sexes", value, label: value }));
  activeFilters.breeds.forEach((value) => activeFilterChips.push({ key: "breeds", value, label: value }));
  if (activeFilters.price_min !== null && activeFilters.price_min > 0 || activeFilters.price_max !== null && activeFilters.price_max < 999999999) {
    const currency = activeFilters.currency || "AUD";
    const minimum = activeFilters.price_min && activeFilters.price_min > 0 ? formatPrice(activeFilters.price_min, currency) : "Any";
    const maximum = activeFilters.price_max && activeFilters.price_max < 999999999 ? formatPrice(activeFilters.price_max, currency) : "Any";
    activeFilterChips.push({ key: "price", label: `Price ${minimum} to ${maximum}` });
  }
  if (activeFilters.age_min !== null || activeFilters.age_max !== null && activeFilters.age_max < 999) {
    const minimum = activeFilters.age_min === null ? "Any" : activeFilters.age_min === 0 ? "Weanling" : `${activeFilters.age_min}+`;
    const maximum = activeFilters.age_max === null || activeFilters.age_max >= 999 ? "Any" : activeFilters.age_max === 0 ? "Weanling" : `${activeFilters.age_max}`;
    activeFilterChips.push({ key: "age", label: `Age ${minimum} to ${maximum}` });
  }
  if (activeFilters.height_min === "young_horse" || activeFilters.height_max === "young_horse") {
    activeFilterChips.push({ key: "height_young", label: "Young horse" });
  } else if (activeFilters.height_min !== null && activeFilters.height_min > 0 || activeFilters.height_max !== null && activeFilters.height_max < 999) {
    const formatHeight = (value: number | null) => value === null || value === 0 || value >= 999 ? "Any" : `${Number(value)}hh`;
    activeFilterChips.push({ key: "height", label: `Height ${formatHeight(activeFilters.height_min)} to ${formatHeight(activeFilters.height_max)}` });
  }
  if (activeFilters.location_country && activeFilters.location_country !== "any_location") {
    activeFilterChips.push({ key: "location_country", label: activeFilters.location_country });
  }
  if (activeFilters.sire) activeFilterChips.push({ key: "sire", label: `Sire: ${activeFilters.sire}` });
  if (activeFilters.dam_sire) activeFilterChips.push({ key: "dam_sire", label: `Dam sire: ${activeFilters.dam_sire}` });
  
  return (
    <Layout 
      pageTitle="" 
      browseMode
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-12 pt-3 sm:px-7 sm:pt-10 lg:px-10">
        <div className="mb-4 flex flex-col gap-1 sm:mb-9 sm:gap-2">
          <p className="font-accent text-[0.6rem] font-bold uppercase tracking-[0.16em] text-secondary sm:text-[0.68rem] sm:tracking-[0.2em]">The collection</p>
          <h1 className="font-display text-2xl leading-7 text-foreground sm:text-[2.65rem] sm:leading-tight">Find your next great horse.</h1>
          <p className="max-w-xl text-xs leading-4 text-muted-foreground sm:text-sm sm:leading-6">
            Thoughtfully matched performance horses, ready for what comes next.
          </p>
        </div>

        <BrowseQuickFilters
          activeFilters={activeFilters}
          onDisciplineToggle={toggleQuickDiscipline}
          onApplyRange={applyQuickRange}
        />

        <div className="mb-3 flex min-h-6 items-baseline justify-between gap-3 sm:mb-5">
          <p className="font-accent text-sm font-semibold text-foreground" aria-live="polite">
            {isLoading ? "Finding horses…" : isError ? "Listings unavailable" : `${horses?.length ?? 0} ${horses?.length === 1 ? "horse" : "horses"}`}
          </p>
          <Button type="button" variant="outline" className={`rounded-full ${isMobile ? "h-9 px-3 text-xs" : ""}`} onClick={toggleFilterPanel} aria-expanded={isFilterOpen}>
            <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
            Filters{activeFilterChips.length ? ` (${activeFilterChips.length})` : ""}
          </Button>
        </div>

        {activeFilterChips.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-2" aria-label="Active filters">
            {activeFilterChips.map((chip) => (
              <button
                key={`${chip.key}:${chip.value ?? ""}`}
                type="button"
                onClick={() => removeActiveFilter(chip.key, chip.value)}
                aria-label={`Remove ${chip.label} filter`}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#dedbd2] bg-white px-3 py-1 text-xs font-medium text-[#34332f] transition hover:border-[#cdac6e] hover:bg-[#f8f7f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e]"
              >
                {chip.label}<span aria-hidden="true" className="text-muted-foreground">×</span>
              </button>
            ))}
            <button
              type="button"
              onClick={clearAllActiveFilters}
              className="min-h-8 px-2 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e]"
            >
              Clear all
            </button>
          </div>
        ) : null}

        <BrowseHorseGrid
          currentUserId={user?.id}
          horses={horses}
          matches={matches}
          pendingSaveIds={pendingSaveIds}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => { void refetchHorses(); }}
          onToggleSaved={handleToggleSaved}
        />

        <FilterPanel
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          activeFilters={activeFilters}
          onApplyFilters={handleApplyFilters}
          horseCount={horses?.length || 0}
        />
      </div>
    </Layout>
  );
}
