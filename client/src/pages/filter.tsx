import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import FilterPanel from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { X, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import HorseGrid from "@/components/HorseGrid";
import { Horse } from "@shared/schema";

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

export default function FilterPage() {
  const [location, navigate] = useLocation();
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const { currentCurrency } = useCurrency();
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
    currency: currentCurrency || "AUD",
  });
  
  useEffect(() => {
    // Restore filter state from localStorage on component mount
    try {
      const savedFilters = localStorage.getItem('lastAppliedFilters');
      if (savedFilters) {
        setActiveFilters(JSON.parse(savedFilters));
      }
    } catch (e) {
      console.error("Error loading filters from localStorage:", e);
    }
  }, []);
  
  // Query for horse results with the same filters
  // This provides a preview of results with the current filter settings
  const { data: horses, isLoading } = useQuery<Horse[]>({
    queryKey: ['/api/horses', activeFilters],
    queryFn: async () => {
      // Build query parameters from activeFilters
      const params = new URLSearchParams();
      
      // Only add non-empty array filters or non-null values
      if (activeFilters.disciplines && activeFilters.disciplines.length > 0) {
        activeFilters.disciplines.forEach(d => params.append('disciplines', d));
      }
      
      if (activeFilters.breeds && activeFilters.breeds.length > 0) {
        activeFilters.breeds.forEach(b => params.append('breeds', b));
      }
      
      if (activeFilters.sexes && activeFilters.sexes.length > 0) {
        activeFilters.sexes.forEach(s => params.append('sexes', s));
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
      
      // Always send currency
      params.append('currency', activeFilters.currency || currentCurrency);
      
      const response = await fetch(`/api/horses?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch horses');
      }
      return response.json();
    }
  });

  const handleApplyFilters = (newFilters: Filter) => {
    // First, update state
    setActiveFilters(newFilters);
    
    console.log("Applying filters and navigating to browse:", newFilters);
    
    // Make a complete deep copy to avoid any state mutation issues
    const filtersToApply = JSON.parse(JSON.stringify(newFilters));
    
    // Ensure discipline is properly formatted for the API
    if (filtersToApply.disciplines && filtersToApply.disciplines[0] === "all_disciplines") {
      filtersToApply.disciplines = [];
    }
    
    // Ensure breeds is properly formatted
    if (filtersToApply.breeds && filtersToApply.breeds[0] === "all_breeds") {
      filtersToApply.breeds = [];
    }
    
    // Ensure sexes is properly formatted
    if (filtersToApply.sexes && filtersToApply.sexes[0] === "any_sex") {
      filtersToApply.sexes = [];
    }
    
    // Build URL parameters
    const params = new URLSearchParams();
    
    // Add only non-empty parameters
    
    // Add disciplines
    if (filtersToApply.disciplines && filtersToApply.disciplines.length > 0) {
      filtersToApply.disciplines.forEach((d: string) => params.append('disciplines', d));
    }
    
    // Add breeds
    if (filtersToApply.breeds && filtersToApply.breeds.length > 0) {
      filtersToApply.breeds.forEach((b: string) => params.append('breeds', b));
    }
    
    // Add sexes
    if (filtersToApply.sexes && filtersToApply.sexes.length > 0) {
      filtersToApply.sexes.forEach((s: string) => params.append('sexes', s));
    }
    
    // Add location
    if (filtersToApply.location_country) {
      params.append('location_country', filtersToApply.location_country);
    }
    
    // Add age range
    if (filtersToApply.age_min !== null) {
      params.append('min_age', filtersToApply.age_min?.toString() || '0');
    }
    
    if (filtersToApply.age_max !== null) {
      params.append('max_age', filtersToApply.age_max?.toString() || '100');
    }
    
    // Add height range
    if (filtersToApply.height_min !== null) {
      params.append('min_height', filtersToApply.height_min?.toString() || '0');
    }
    
    if (filtersToApply.height_max !== null) {
      params.append('max_height', filtersToApply.height_max?.toString() || '20');
    }
    
    // Add price range
    if (filtersToApply.price_min !== null) {
      params.append('min_price', filtersToApply.price_min?.toString() || '0');
    }
    
    if (filtersToApply.price_max !== null) {
      params.append('max_price', filtersToApply.price_max?.toString() || '1000000');
    }
    
    // Always include currency
    params.append('currency', filtersToApply.currency || currentCurrency);
    
    // Save to localStorage
    try {
      localStorage.setItem('lastAppliedFilters', JSON.stringify(filtersToApply));
      localStorage.setItem('filtersTimestamp', Date.now().toString());
    } catch (e) {
      console.error("Failed to save filters to localStorage:", e);
    }
    
    // Get URL string
    const queryString = params.toString();
    console.log("Generated filter query:", queryString);
    
    // Instead of using navigate(), use direct window.location.href for more reliable navigation on mobile
    window.location.href = `/browse?${queryString}`;
  };

  return (
    <Layout 
      pageTitle="Find Horses" 
      showBackButton
      onBackClick={() => navigate("/browse")}
    >
      <div className="filterPage">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Find Your Perfect Match</h1>
          <p className="text-muted-foreground">Use the filters below to narrow down your horse search</p>
          
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <FilterPanel 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                activeFilters={activeFilters}
                onApplyFilters={handleApplyFilters}
                horseCount={horses?.length}
              />
              
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Preview ({horses?.length || 0} horses match your filters)</h3>
                <HorseGrid horses={horses || []} />
              </div>
            </div>
          </div>
          
          <Button 
            className="mt-8 w-full md:w-auto"
            size="lg"
            onClick={() => handleApplyFilters(activeFilters)}
          >
            Show Results ({isLoading ? '...' : horses?.length || 0})
          </Button>
        </div>
      </div>
    </Layout>
  );
}
