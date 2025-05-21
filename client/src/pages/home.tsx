import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import SwipeSection from "@/components/SwipeSection";
import HorseGrid from "@/components/HorseGrid";
import FilterPanel from "@/components/FilterPanel";
import MobileFilterPanel from "@/components/MobileFilterPanel";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X, PlusCircle } from "lucide-react";
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
  location_country: string | null;
  location_radius_km: number | null;
  age_min: number | null;
  age_max: number | null;
  height_min: number | null;
  height_max: number | null;
  price_min: number | null;
  price_max: number | null;
  currency: string | null;
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
  const [activeFilters, setActiveFilters] = useState<Filter>({
    disciplines: [],  // Empty array for All Disciplines
    breeds: [],       // Empty array for All Breeds
    sexes: [],        // Empty array for Any Sex
    location_country: null,
    location_radius_km: null,
    age_min: null,
    age_max: null,
    height_min: null,
    height_max: null,
    price_min: null,
    price_max: null,
    currency: "AUD",
  });
  
  // Parse URL parameters when the page loads to set initial filters
  useEffect(() => {
    // Check if this is the discover route to show filter by default
    if (location === "/discover") {
      setShowFilter(true);
    }
    
    // Initialize filter object with defaults
    let filtersToApply: Filter = {
      disciplines: [],
      breeds: [],
      sexes: [],
      location_country: null,
      location_radius_km: null,
      age_min: null,
      age_max: null,
      height_min: null,
      height_max: null,
      price_min: null,
      price_max: null,
      currency: currentCurrency,
    };
    
    // First try to get filters from URL parameters
    let foundFiltersInUrl = false;
    
    if (location.includes('?')) {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Get all discipline values
      const disciplines = urlParams.getAll('disciplines');
      if (disciplines.length > 0) {
        filtersToApply.disciplines = disciplines;
        foundFiltersInUrl = true;
      }
      
      // Get all breed values
      const breeds = urlParams.getAll('breeds');
      if (breeds.length > 0) {
        filtersToApply.breeds = breeds;
        foundFiltersInUrl = true;
      }
      
      // Get all sex values
      const sexes = urlParams.getAll('sexes');
      if (sexes.length > 0) {
        filtersToApply.sexes = sexes;
        foundFiltersInUrl = true;
      }
      
      // Get location country
      const locationCountry = urlParams.get('location_country');
      if (locationCountry) {
        filtersToApply.location_country = locationCountry;
        foundFiltersInUrl = true;
      }
      
      // Get min age
      const minAge = urlParams.get('min_age');
      if (minAge && minAge !== '0') {
        filtersToApply.age_min = parseInt(minAge);
        foundFiltersInUrl = true;
      }
      
      // Get max age
      const maxAge = urlParams.get('max_age');
      if (maxAge && maxAge !== '100') {
        filtersToApply.age_max = parseInt(maxAge);
        foundFiltersInUrl = true;
      }
      
      // Get min height
      const minHeight = urlParams.get('min_height');
      if (minHeight && minHeight !== '0') {
        filtersToApply.height_min = parseFloat(minHeight);
        foundFiltersInUrl = true;
      }
      
      // Get max height
      const maxHeight = urlParams.get('max_height');
      if (maxHeight && maxHeight !== '20') {
        filtersToApply.height_max = parseFloat(maxHeight);
        foundFiltersInUrl = true;
      }
      
      // Get min price
      const minPrice = urlParams.get('min_price');
      if (minPrice && minPrice !== '0') {
        filtersToApply.price_min = parseInt(minPrice);
        foundFiltersInUrl = true;
      }
      
      // Get max price
      const maxPrice = urlParams.get('max_price');
      if (maxPrice && maxPrice !== '1000000') {
        filtersToApply.price_max = parseInt(maxPrice);
        foundFiltersInUrl = true;
      }
      
      // Get currency
      const currency = urlParams.get('currency');
      if (currency) {
        filtersToApply.currency = currency;
        foundFiltersInUrl = true;
      }
      
      // If we found filters in URL, update localStorage for future use
      if (foundFiltersInUrl) {
        try {
          localStorage.setItem('lastAppliedFilters', JSON.stringify(filtersToApply));
          localStorage.setItem('filtersTimestamp', Date.now().toString());
        } catch (error) {
          console.error("Error saving filters to localStorage:", error);
        }
      }
    }
    
    // If no filters found in URL, try to load from localStorage backup
    // This helps on mobile where URL params sometimes fail to pass correctly
    if (!foundFiltersInUrl) {
      try {
        const savedFiltersJson = localStorage.getItem('lastAppliedFilters');
        if (savedFiltersJson) {
          const savedFilters = JSON.parse(savedFiltersJson);
          console.log("Loading filters from localStorage backup:", savedFilters);
          
          // When using saved filters, make sure it's a recent navigation
          const timestamp = localStorage.getItem('filtersTimestamp');
          const now = Date.now();
          const threshold = 60000; // 1 minute threshold
          
          if (timestamp && now - parseInt(timestamp) < threshold) {
            console.log("Using recently saved filters from localStorage");
            filtersToApply = savedFilters;
          } else {
            // Clear old saved filters if they're too old
            localStorage.removeItem('lastAppliedFilters');
            localStorage.removeItem('filtersTimestamp');
          }
        }
      } catch (error) {
        console.error("Error loading filters from localStorage:", error);
      }
    }
    
    // Update the active filters
    console.log("Setting filters:", filtersToApply);
    setActiveFilters(filtersToApply);
  }, [location, currentCurrency]);

  // Debug log
  console.log("Home - Auth state:", { isAuthenticated, is_selling: user?.is_selling, is_searching: user?.is_searching, location, showFilter });

  const [swipingIndex, setSwipingIndex] = useState(0);

  // State to prevent the "no horses found" message during loading
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Pre-fetch ALL horses with no filters for fast initial load
  const { data: allHorses, isLoading: isAllHorsesLoading } = useQuery<Horse[]>({
    queryKey: ['/api/horses', { currency: currentCurrency }],
    staleTime: 60000, // Keep all horses cached for 1 minute
  });
  
  // Query for horses with filters
  const { data: horses, isLoading, isError, isFetching } = useQuery<Horse[]>({
    queryKey: ['/api/horses', activeFilters],
    staleTime: 10000, // Shorter stale time for filtered queries
    // Use these two options for much faster mobile experience
    keepPreviousData: true, // Keeps showing the current horses during loading
    placeholderData: allHorses || [], // Use all horses as temporary data during loading
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
      // Use fetch directly to get more control over the response
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  };

  const toggleFilterPanel = () => {
    setIsFilterOpen(!isFilterOpen);
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
  
  // Create a state to track expanded filter sections on mobile
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Toggle filter section expansion
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  return (
    <Layout 
      pageTitle="" 
      showFilterButton={false} // No filter button since filters are inline
    >
      <div className="flex flex-col md:flex-row w-full h-full">
        {/* Desktop Filter sidebar */}
        {!isMobile && (
          <div className="w-72 bg-white rounded-xl p-5 shadow-sm h-fit mr-6 flex-shrink-0">
            <FilterPanel 
              isOpen={true} 
              onClose={() => {}} 
              activeFilters={activeFilters}
              onApplyFilters={handleApplyFilters}
              horseCount={horses?.length || 0}
            />
          </div>
        )}
        
        {/* Mobile Inline Filter Section - Completely Integrated */}
        {isMobile && (
          <div className="mb-4">
            <div className="bg-white rounded-t-xl p-4 shadow-sm border-b">
              <h3 className="text-lg font-semibold">Find Horses</h3>
              <p className="text-xs text-gray-500 mb-2">
                {horses?.length || 0} horses found
              </p>
              
              {/* Quick filters in horizontal scrolling section */}
              <div className="mb-2">
                <div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1">
                  <button 
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm ${
                      activeFilters.disciplines.length === 0 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => handleApplyFilters({...activeFilters, disciplines: []})}
                  >
                    All Disciplines
                  </button>
                  
                  {['Jumping', 'Dressage', 'Eventing'].map(discipline => (
                    <button 
                      key={discipline}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm ${
                        activeFilters.disciplines.includes(discipline) 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => handleApplyFilters({...activeFilters, disciplines: [discipline]})}
                    >
                      {discipline}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Active filter pills */}
              {activeFilters && Object.values(activeFilters).some(val => 
                Array.isArray(val) ? val.length > 0 : val !== null
              ) && (
                <div className="mt-2 mb-2">
                  {renderFilterPills()}
                </div>
              )}
              
              {/* Filter Accordion Sections */}
              <div className="mt-3 border-t pt-2">
                {/* Price Filter Section */}
                <div className="border-b pb-2">
                  <button 
                    className="flex justify-between items-center w-full py-2 text-left"
                    onClick={() => toggleSection('price')}
                  >
                    <span className="font-medium">Price Range</span>
                    <span className={expandedSection === 'price' ? 'transform rotate-180' : ''}>▼</span>
                  </button>
                  
                  {expandedSection === 'price' && (
                    <div className="py-2 px-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-[45%]">
                          <label className="text-xs mb-1 block">Min</label>
                          <input 
                            type="number"
                            className="w-full p-2 border rounded text-sm"
                            value={activeFilters.price_min || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              handleApplyFilters({...activeFilters, price_min: value});
                            }}
                            placeholder="Min"
                          />
                        </div>
                        <div className="w-[10%] text-center">-</div>
                        <div className="w-[45%]">
                          <label className="text-xs mb-1 block">Max</label>
                          <input 
                            type="number"
                            className="w-full p-2 border rounded text-sm"
                            value={activeFilters.price_max || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              handleApplyFilters({...activeFilters, price_max: value});
                            }}
                            placeholder="Max"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block">Currency</label>
                        <select
                          className="w-full p-2 border rounded text-sm"
                          value={activeFilters.currency || 'AUD'}
                          onChange={(e) => handleApplyFilters({...activeFilters, currency: e.target.value})}
                        >
                          <option value="AUD">AUD</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Age Filter Section */}
                <div className="border-b pb-2">
                  <button 
                    className="flex justify-between items-center w-full py-2 text-left"
                    onClick={() => toggleSection('age')}
                  >
                    <span className="font-medium">Age Range</span>
                    <span className={expandedSection === 'age' ? 'transform rotate-180' : ''}>▼</span>
                  </button>
                  
                  {expandedSection === 'age' && (
                    <div className="py-2 px-1">
                      <div className="flex items-center justify-between">
                        <div className="w-[45%]">
                          <label className="text-xs mb-1 block">Min</label>
                          <input 
                            type="number"
                            className="w-full p-2 border rounded text-sm" 
                            value={activeFilters.age_min || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              handleApplyFilters({...activeFilters, age_min: value});
                            }}
                            placeholder="Min"
                          />
                        </div>
                        <div className="w-[10%] text-center">-</div>
                        <div className="w-[45%]">
                          <label className="text-xs mb-1 block">Max</label>
                          <input 
                            type="number"
                            className="w-full p-2 border rounded text-sm"
                            value={activeFilters.age_max || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              handleApplyFilters({...activeFilters, age_max: value});
                            }}
                            placeholder="Max"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Height Filter Section */}
                <div className="border-b pb-2">
                  <button 
                    className="flex justify-between items-center w-full py-2 text-left"
                    onClick={() => toggleSection('height')}
                  >
                    <span className="font-medium">Height (hands)</span>
                    <span className={expandedSection === 'height' ? 'transform rotate-180' : ''}>▼</span>
                  </button>
                  
                  {expandedSection === 'height' && (
                    <div className="py-2 px-1">
                      <div className="flex items-center justify-between">
                        <div className="w-[45%]">
                          <label className="text-xs mb-1 block">Min</label>
                          <input 
                            type="number" 
                            step="0.1"
                            className="w-full p-2 border rounded text-sm"
                            value={activeFilters.height_min || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              handleApplyFilters({...activeFilters, height_min: value});
                            }}
                            placeholder="Min"
                          />
                        </div>
                        <div className="w-[10%] text-center">-</div>
                        <div className="w-[45%]">
                          <label className="text-xs mb-1 block">Max</label>
                          <input 
                            type="number"
                            step="0.1"
                            className="w-full p-2 border rounded text-sm"
                            value={activeFilters.height_max || ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              handleApplyFilters({...activeFilters, height_max: value});
                            }}
                            placeholder="Max"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sex Filter Section */}
                <div className="border-b pb-2">
                  <button 
                    className="flex justify-between items-center w-full py-2 text-left"
                    onClick={() => toggleSection('sex')}
                  >
                    <span className="font-medium">Sex</span>
                    <span className={expandedSection === 'sex' ? 'transform rotate-180' : ''}>▼</span>
                  </button>
                  
                  {expandedSection === 'sex' && (
                    <div className="py-2 px-1">
                      <div className="flex flex-wrap gap-2">
                        {['Mare', 'Gelding', 'Stallion'].map(sex => (
                          <button 
                            key={sex}
                            className={`px-3 py-1.5 rounded-full text-sm ${
                              activeFilters.sexes.includes(sex) 
                                ? 'bg-primary text-white' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                            onClick={() => {
                              const newSexes = activeFilters.sexes.includes(sex)
                                ? activeFilters.sexes.filter(s => s !== sex)
                                : [...activeFilters.sexes, sex];
                              handleApplyFilters({...activeFilters, sexes: newSexes});
                            }}
                          >
                            {sex}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Breed Filter Section */}
                <div className="border-b pb-2">
                  <button 
                    className="flex justify-between items-center w-full py-2 text-left"
                    onClick={() => toggleSection('breed')}
                  >
                    <span className="font-medium">Breed</span>
                    <span className={expandedSection === 'breed' ? 'transform rotate-180' : ''}>▼</span>
                  </button>
                  
                  {expandedSection === 'breed' && (
                    <div className="py-2 px-1">
                      <div className="max-h-40 overflow-y-auto">
                        {['Warmblood', 'Thoroughbred', 'Quarter Horse', 'Arabian', 'Hanoverian', 'Dutch Warmblood', 'Holsteiner'].map(breed => (
                          <label key={breed} className="flex items-center mb-2">
                            <input 
                              type="checkbox"
                              className="mr-2"
                              checked={activeFilters.breeds.includes(breed)}
                              onChange={() => {
                                const newBreeds = activeFilters.breeds.includes(breed)
                                  ? activeFilters.breeds.filter(b => b !== breed)
                                  : [...activeFilters.breeds, breed];
                                handleApplyFilters({...activeFilters, breeds: newBreeds});
                              }}
                            />
                            <span className="text-sm">{breed}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Location Filter Section */}
                <div>
                  <button 
                    className="flex justify-between items-center w-full py-2 text-left"
                    onClick={() => toggleSection('location')}
                  >
                    <span className="font-medium">Location</span>
                    <span className={expandedSection === 'location' ? 'transform rotate-180' : ''}>▼</span>
                  </button>
                  
                  {expandedSection === 'location' && (
                    <div className="py-2 px-1">
                      <div>
                        <label className="text-xs mb-1 block">Country</label>
                        <select
                          className="w-full p-2 border rounded text-sm"
                          value={activeFilters.location_country || ''}
                          onChange={(e) => handleApplyFilters({...activeFilters, location_country: e.target.value || null})}
                        >
                          <option value="">Any Country</option>
                          <option value="Australia">Australia</option>
                          <option value="New Zealand">New Zealand</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Germany">Germany</option>
                          <option value="France">France</option>
                          <option value="Netherlands">Netherlands</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content area - positioned below filters on mobile, to the right on desktop */}
        <div className="flex-1 flex flex-col">
          {isTouchDevice ? (
            <div className={`${isMobile ? 'mt-4 pt-2' : ''}`}>
              <SwipeSection 
                horses={horses || []}
                isLoading={isLoading || isFetching}
                activeIndex={swipingIndex}
                onLike={handleLike}
                onDislike={handleDislike}
                onShowMore={handleShowMore}
              />
            </div>
          ) : (
            <HorseGrid
              horses={horses || []}
              onLike={handleLike}
              onDislike={handleDislike}
              onShowMore={handleShowMore}
              isLoading={isLoading || isFetching}
            />
          )}
        </div>

        {/* Right sidebar - recently viewed (desktop only) */}
        {!isMobile && (
          <div className="w-72 bg-white rounded-xl p-5 shadow-sm h-fit ml-6">
            <h3 
              className="font-accent font-bold text-lg mb-4 flex items-center cursor-pointer hover:text-primary transition-colors" 
              onClick={() => navigate('/horses')}
            >
              <span>Recently Viewed</span>
              <svg className="w-4 h-4 ml-1 text-neutral-400 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </h3>
            
            <div className="space-y-4">
              {horses?.slice(0, 3).map((horse) => (
                <div 
                  key={horse.id} 
                  className="flex gap-3 hover:bg-neutral-50 p-2 rounded-lg cursor-pointer transition-colors"
                  onClick={() => navigate(`/horse/${horse.id}`)}
                >
                  <img 
                    src={horse.photos[0]} 
                    alt={`${horse.name}'s portrait`} 
                    className="w-16 h-16 object-cover rounded-lg" 
                  />
                  <div className="flex-1">
                    <h4 className="font-accent font-medium">{horse.name}</h4>
                    <p className="text-xs text-neutral-600">
                      {horse.sire && horse.dam_sire 
                        ? `${horse.sire} x ${horse.dam_sire}`
                        : horse.breeds[0] || "Breeding not specified"}
                    </p>
                    <p className="text-xs text-neutral-700 mt-1">
                      {horse.age}yo • {horse.sex}
                    </p>
                  </div>
                </div>
              ))}
              
              {horses && horses.length > 3 && (
                <div 
                  className="text-center pt-2 border-t border-neutral-100"
                >
                  <button 
                    onClick={() => navigate('/horses')} 
                    className="text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    View All Horses
                  </button>
                </div>
              )}
            </div>
            

          </div>
        )}

        {/* Mobile filter panel - force empty disciplines for "All Disciplines" */}
        {isMobile && (
          <MobileFilterPanel 
            isOpen={isFilterOpen} 
            onClose={() => setIsFilterOpen(false)} 
            activeFilters={{
              ...activeFilters,
              disciplines: [] // Forcing empty array to ensure "All Disciplines" is default
            }}
            onApplyFilters={handleApplyFilters}
            horseCount={horses?.length || 0}
          />
        )}
      </div>
    </Layout>
  );
}
