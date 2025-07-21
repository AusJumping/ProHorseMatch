import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import SwipeSection from "@/components/SwipeSection";
import HorseGrid from "@/components/HorseGrid";
import FilterPanel from "@/components/FilterPanel";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X, PlusCircle, Filter } from "lucide-react";
import { Horse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useCurrency } from "@/contexts/CurrencyContext";
import CurrencyRate from "@/components/ui/CurrencyRate";

interface Filter {
  disciplines: string[];
  breeds: string[];
  sexes: string[];
  levels: string[];
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
  const isTouchDevice = useIsTouchDevice();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { currentCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [currentHorseIndex, setCurrentHorseIndex] = useState<number>(0);
  const [activeFilters, setActiveFilters] = useState<Filter>({
    disciplines: [],  // Empty array for All Disciplines
    breeds: [],       // Empty array for All Breeds
    sexes: [],        // Empty array for Any Sex
    levels: [],       // Empty array for All Levels
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
    } else if (location === "/filter" && !isMobile) {
      console.log("Setting showFilter to true for desktop filter route");
      setShowFilter(true);
    } else if (location === "/filter" && isMobile && showFiltersParam === "true") {
      // User clicked "Find Horses" in navigation - show filters
      console.log("Setting showFilter to true for mobile filter route with show_filters=true");
      setShowFilter(true);
    } else if (location === "/filter" && isMobile) {
      // Mobile users on filter route without show_filters param (like "Get Started") - show horses first
      console.log("Setting showFilter to false for mobile filter route (horses first)");
      setShowFilter(false);
    } else if (location === "/filter") {
      // Fallback: ensure mobile filter route shows horses first by default
      console.log("Fallback: Setting showFilter to false for filter route");
      setShowFilter(false);
    }
    
    // Check if we have a discipline filter in localStorage or URL
    const urlDiscipline = urlParams.get('discipline');
    const storedDiscipline = localStorage.getItem('active_discipline_filter');
    
    // Use URL parameter first, then localStorage
    const disciplineFilter = urlDiscipline || storedDiscipline;
    
    if (disciplineFilter) {
      console.log("Found active discipline filter:", disciplineFilter);
      
      // Apply the filter from storage
      setActiveFilters(prev => ({
        ...prev,
        disciplines: [disciplineFilter]
      }));
    }
  }, [location, isMobile]);
  
  // This effect ensures that when filters change, we reset our swiping index and refresh data
  useEffect(() => {
    // Reset to the first horse when filters change
    setSwipingIndex(0);
    
    // Force data refresh when filters change
    queryClient.invalidateQueries({ queryKey: ['/api/horses'] });
  }, [activeFilters, queryClient]);

  // Debug log
  console.log("Home - Auth state:", { isAuthenticated, is_selling: user?.is_selling, is_searching: user?.is_searching, location, showFilter });

  const [swipingIndex, setSwipingIndex] = useState(0);

  // Query for horses with filters
  const { data: horses, isLoading, isError } = useQuery<Horse[]>({
    queryKey: ['/api/horses', activeFilters],
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
      // Reset the active index to 0 whenever we get new data
      setSwipingIndex(0);
      return result;
    }
  });

  const handleLike = async (horseId: number) => {
    // Debug logging to help diagnose authentication issues
    console.log("Like horse - Auth state:", { isAuthenticated, user, userId: user?.id });
    
    // First try to get a current user from localStorage if React Query hasn't loaded it yet
    // This helps with mobile browsers that might have session issues
    let currentUser = user;
    if (!currentUser) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
          console.log("Using cached user from localStorage:", currentUser);
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
    
    // Now check if we have a valid user
    if (!currentUser || !currentUser.id) {
      toast({
        title: "Login Required",
        description: "Please log in to save this horse to your favorites.",
        variant: "default",
      });
      
      setSwipingIndex(prev => prev + 1);
      return;
    }
    
    // Now that we've verified the user is available, proceed with like
    if (!horseId) {
      toast({
        title: "Error",
        description: "Invalid horse selection. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Get auth token for API request
      const authToken = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Use fetch directly to get more control over the response
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer_id: currentUser.id,
          horse_id: horseId,
          is_liked: true
        }),
        credentials: 'include'
      });
      
      console.log("Like response status:", response.status);
      
      if (response.ok) {
        // Force an immediate invalidation of the matches cache so favorites page will update
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
        
        toast({
          title: "Horse Liked!",
          description: "This horse has been added to your favorites.",
          duration: 800, // Very brief notification (just under 1 second)
        });
        
        // Wait a brief moment before advancing to let the toast appear properly
        setTimeout(() => {
          setSwipingIndex(prev => prev + 1);
        }, 300);
      } else {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(errorText || "Failed to process like request");
      }
    } catch (error) {
      console.error("Error liking horse:", error);
      toast({
        title: "Error",
        description: "Failed to like horse. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDislike = async (horseId: number) => {
    // Debug logging to help diagnose authentication issues
    console.log("Dislike horse - Auth state:", { isAuthenticated, user, userId: user?.id });
    
    // First try to get a current user from localStorage if React Query hasn't loaded it yet
    let currentUser = user;
    if (!currentUser) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
          console.log("Using cached user from localStorage for dislike:", currentUser);
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
    
    // Check if user is authenticated
    if (!currentUser) {
      // For dislikes, we won't show a login message
      // Just advance to the next horse
      setSwipingIndex(prev => prev + 1);
      return;
    }
    
    if (!horseId) {
      setSwipingIndex(prev => prev + 1);
      return;
    }
    
    try {
      // Use fetch directly to get more control over the response
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: currentUser.id,
          horse_id: horseId,
          is_liked: false
        }),
        credentials: 'include'
      });
      
      console.log("Dislike response status:", response.status);
      
      // Any successful response means we can move to the next horse
      if (response.ok) {
        // Force an immediate invalidation of the matches cache so favorites page will update
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
        
        setSwipingIndex(prev => prev + 1);
      } else {
        const errorText = await response.text();
        console.error("API error on dislike:", errorText);
        throw new Error(errorText || "Failed to process dislike request");
      }
    } catch (error) {
      console.error("Error disliking horse:", error);
      toast({
        title: "Error",
        description: "Failed to dislike horse. Please try again.",
        variant: "destructive",
        duration: 800, // Very brief error notification to match the "Horse Liked!" toast
      });
    }
  };

  const handleShowMore = (horseId: number) => {
    navigate(`/horse/${horseId}`);
  };

  const removeFilter = (type: keyof Filter, value: string) => {
    setActiveFilters(prev => {
      // Handle array values
      if (Array.isArray(prev[type])) {
        return {
          ...prev,
          [type]: (prev[type] as string[]).filter(item => item !== value)
        };
      }
      // Handle single values
      return {
        ...prev,
        [type]: null
      };
    });
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
    // Reset the swiping index to show the first horse in the new filtered results
    setSwipingIndex(0);
    setActiveFilters(cleanFilters);
    setIsFilterOpen(false);
    
    // On mobile, ensure the filter panel doesn't automatically show after applying filters
    if (isMobile && location === "/filter") {
      setShowFilter(false);
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

  // Generate active filter pills from the activeFilters object
  const renderFilterPills = () => {
    const pills = [];

    activeFilters.disciplines.forEach(discipline => 
      pills.push({ type: 'disciplines', value: discipline }));
    
    activeFilters.breeds.forEach(breed => 
      pills.push({ type: 'breeds', value: breed }));
    
    activeFilters.sexes.forEach(sex => 
      pills.push({ type: 'sexes', value: sex }));

    if (activeFilters.location_country) {
      pills.push({ type: 'location_country', value: activeFilters.location_country });
    }

    return (
      <div className="mb-4 flex gap-2 flex-wrap">
        {pills.map((pill, index) => (
          <Badge key={index} variant="outline" className="flex items-center gap-1 px-3 py-1.5 rounded-full">
            <span>{pill.value}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 p-0 hover:bg-transparent" 
              onClick={() => removeFilter(pill.type as keyof Filter, pill.value)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full bg-primary bg-opacity-10 text-primary border-transparent text-xs"
          onClick={toggleFilterPanel}
        >
          Edit Filters
        </Button>
      </div>
    );
  };

  // Check if user has selling permission
  const isOwner = user?.is_selling === true;
  
  return (
    <Layout 
      pageTitle="" 
      showFilterButton 
      onFilterClick={toggleFilterPanel}
      showMobileFilterButton={isMobile}
      onMobileFilterClick={toggleFilterPanel}
      horseCount={horses?.length || 0}
      currentHorseIndex={currentHorseIndex}
    >
      <div className="flex w-full h-full">
        {/* Filter sidebar - desktop only or when explicitly showing filters */}
        {(!isMobile || showFilter) && (
          <div className={`${isMobile ? 'w-full' : 'w-72'} bg-white rounded-xl p-5 shadow-sm h-fit ${isMobile ? 'mb-6' : 'mr-6'}`}>
            <FilterPanel 
              isOpen={true} 
              onClose={() => {}} 
              activeFilters={activeFilters}
              onApplyFilters={handleApplyFilters}
              horseCount={horses?.length || 0}
            />
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center relative">
          {isTouchDevice ? (
            /* Horse swiping area for touch devices */
            <>

              {/* Add a manually filtered list of horses to handle filtering on mobile */}
              {horses && (
                <div>
                  {/* Removed yellow filter notification as requested */}
                  
                  {/* All filter indicators completely removed as requested */}
                  
                  {/* Create a key for the active discipline filter to force re-rendering */}
                  <SwipeSection 
                    key={`filter-${activeFilters.disciplines.join('-')}-${Date.now()}`} // Force component remount when filters change with unique timestamp
                    horses={horses || []}
                    isLoading={isLoading}
                    activeIndex={0} // Always start at the first horse when filters change
                    onShowMore={handleShowMore}
                    onLike={handleLike}
                    onIndexChange={setCurrentHorseIndex}
                  />
                </div>
              )}
            </>
          ) : (
            /* Horse grid for non-touch devices */
            <HorseGrid
              horses={horses || []}
              onShowMore={handleShowMore}
            />
          )}
        </div>



        {/* Mobile filter panel */}
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
