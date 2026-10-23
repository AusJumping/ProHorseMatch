import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import FilterPanel from "@/components/FilterPanel";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import type { Horse, Match } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";
import BrowseHorseGrid from "@/components/browse/BrowseHorseGrid";
import BrowseQuickFilters from "@/components/browse/BrowseQuickFilters";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";

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

export default function Home() {
  const isMobile = useMobile();
  const [location] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
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
    console.log("Filter visibility effect - location:", location, "isMobile:", isMobile);
    
    // Check for show_filters URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const showFiltersParam = urlParams.get('show_filters');
    
    if (location === "/discover") {
      console.log("Setting showFilter to true for discover route");
      setShowFilter(true);
    } else if (location === "/filter" && showFiltersParam === "true") {
      // User clicked "Find Horses" in navigation - show filters
      console.log("Setting showFilter to true for mobile filter route with show_filters=true");
      setShowFilter(isMobile);
      setIsFilterOpen(!isMobile);
    } else if (location === "/filter" && isMobile) {
      // Mobile users on filter route without show_filters param (like "Get Started") - show horses first
      console.log("Setting showFilter to false for mobile filter route (horses first)");
      setShowFilter(false);
    } else if (location === "/filter") {
      // Keep the browse grid full-width until advanced filters are requested.
      setShowFilter(false);
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
  }, [location, isMobile, search]);
  
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
    setActiveFilters((prev) => ({
      ...prev,
      disciplines: prev.disciplines.includes(discipline)
        ? prev.disciplines.filter((item) => item !== discipline)
        : [discipline],
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
      setShowFilter(false);
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
    if (isMobile) {
      // On mobile, toggle the main showFilter state to show/hide the filter sidebar
      setShowFilter(!showFilter);
    } else {
      // On desktop, use the separate mobile filter panel state
      setIsFilterOpen(!isFilterOpen);
    }
  };
  
  return (
    <Layout 
      pageTitle="" 
      browseMode
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-12 pt-6 sm:px-7 sm:pt-10 lg:px-10">
        <div className="mb-7 flex flex-col gap-2 sm:mb-9">
          <p className="font-accent text-[0.68rem] font-bold uppercase tracking-[0.2em] text-secondary">The collection</p>
          <h1 className="font-display text-3xl leading-tight text-foreground sm:text-[2.65rem]">Find your next great horse.</h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Thoughtfully matched performance horses, ready for what comes next.
          </p>
        </div>

        <BrowseQuickFilters
          activeFilters={activeFilters}
          onDisciplineToggle={toggleQuickDiscipline}
          onApplyRange={applyQuickRange}
        />

        {(!isMobile && isFilterOpen || isMobile && showFilter) ? (
          <div className="mb-8 rounded-[1.25rem] border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <FilterPanel
              isOpen={true}
              onClose={() => { setIsFilterOpen(false); setShowFilter(false); }}
              activeFilters={activeFilters}
              onApplyFilters={handleApplyFilters}
              horseCount={horses?.length || 0}
            />
          </div>
        ) : null}

        <div className="mb-5 flex min-h-6 items-baseline justify-between gap-3">
          <p className="font-accent text-sm font-semibold text-foreground" aria-live="polite">
            {isLoading ? "Finding horses…" : isError ? "Listings unavailable" : `${horses?.length ?? 0} ${horses?.length === 1 ? "horse" : "horses"}`}
          </p>
          <Button type="button" variant="outline" className={`rounded-full ${isMobile ? "h-9 px-3 text-xs" : ""}`} onClick={toggleFilterPanel} aria-expanded={isFilterOpen}>
            <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
            All filters
          </Button>
        </div>

        <BrowseHorseGrid
          horses={horses}
          matches={matches}
          pendingSaveIds={pendingSaveIds}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => { void refetchHorses(); }}
          onToggleSaved={handleToggleSaved}
          currentUserId={user?.id}
          isBuyer={Boolean(user?.is_searching)}
        />

        {isMobile && (
          <FilterPanel
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            activeFilters={activeFilters}
            onApplyFilters={handleApplyFilters}
            horseCount={horses?.length || 0}
          />
        )}
      </div>
    </Layout>
  );
}
