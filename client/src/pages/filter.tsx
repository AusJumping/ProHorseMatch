import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import FilterPanel from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
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
  const [, navigate] = useLocation();
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
    currency: currentCurrency,
  });

  // Query for horse count with filters
  const { data: horses, isLoading } = useQuery<Horse[]>({
    queryKey: ['/api/horses', activeFilters],
    queryFn: async () => {
      // Build query parameters from activeFilters
      const params = new URLSearchParams();
      
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
        params.append('max_age', activeFilters.age_max?.toString() || '100');
      }
      
      if (activeFilters.height_min !== null) {
        params.append('min_height', activeFilters.height_min?.toString() || '0');
      }
      
      if (activeFilters.height_max !== null) {
        params.append('max_height', activeFilters.height_max?.toString() || '20');
      }
      
      if (activeFilters.price_min !== null) {
        params.append('min_price', activeFilters.price_min?.toString() || '0');
      }
      
      if (activeFilters.price_max !== null) {
        params.append('max_price', activeFilters.price_max?.toString() || '1000000');
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
    setActiveFilters(newFilters);
    
    console.log("Applying filters and navigating to browse:", newFilters);
    
    // Clean up filter values before navigation
    const filtersToApply = {...newFilters};
    
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
    
    // After applying filters, navigate to browse page
    const params = new URLSearchParams();
    
    if (filtersToApply.disciplines && filtersToApply.disciplines.length > 0) {
      filtersToApply.disciplines.forEach(d => params.append('disciplines', d));
    }
    
    if (filtersToApply.levels && filtersToApply.levels.length > 0) {
      filtersToApply.levels.forEach(l => params.append('levels', l));
    }
    
    if (filtersToApply.breeds && filtersToApply.breeds.length > 0) {
      filtersToApply.breeds.forEach(b => params.append('breeds', b));
    }
    
    if (filtersToApply.sexes && filtersToApply.sexes.length > 0) {
      filtersToApply.sexes.forEach(s => params.append('sexes', s));
    }
    
    if (filtersToApply.location_country) {
      params.append('location_country', filtersToApply.location_country);
    }
    
    if (filtersToApply.age_min !== null) {
      params.append('min_age', filtersToApply.age_min?.toString() || '0');
    }
    
    if (filtersToApply.age_max !== null) {
      params.append('max_age', filtersToApply.age_max?.toString() || '100');
    }
    
    if (filtersToApply.height_min !== null) {
      params.append('min_height', filtersToApply.height_min?.toString() || '0');
    }
    
    if (filtersToApply.height_max !== null) {
      params.append('max_height', filtersToApply.height_max?.toString() || '20');
    }
    
    if (filtersToApply.price_min !== null) {
      params.append('min_price', filtersToApply.price_min?.toString() || '0');
    }
    
    if (filtersToApply.price_max !== null) {
      params.append('max_price', filtersToApply.price_max?.toString() || '1000000');
    }
    
    params.append('currency', filtersToApply.currency || currentCurrency);
    
    console.log("Sending navigation params:", params.toString());
    
    // Navigate to browse page with filters with a slight delay
    // This ensures state is fully updated before navigation
    setTimeout(() => {
      navigate(`/browse?${params.toString()}`);
    }, 300);
  };

  return (
    <Layout 
      pageTitle="Find Horses" 
      showBackButton
      onBackClick={() => navigate("/browse")}
    >
      <div className="max-w-md mx-auto px-4">
        <FilterPanel 
          isOpen={true} 
          onClose={() => navigate("/browse")} 
          activeFilters={activeFilters}
          onApplyFilters={handleApplyFilters}
          horseCount={horses?.length || 0}
        />
        
        <div className="w-full flex justify-center mt-6">
          <Button
            variant="default"
            className="w-full max-w-[200px] py-3"
            onClick={() => {
              console.log("Navigating to browse with Show Results button:", activeFilters);
              
              // Clean up filter values before navigation
              const filtersToApply = {...activeFilters};
              
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
              
              // Build query parameters from activeFilters
              const params = new URLSearchParams();
              
              if (filtersToApply.disciplines && filtersToApply.disciplines.length > 0) {
                filtersToApply.disciplines.forEach((d: string) => params.append('disciplines', d));
              }
              
              if (filtersToApply.breeds && filtersToApply.breeds.length > 0) {
                filtersToApply.breeds.forEach((b: string) => params.append('breeds', b));
              }
              
              if (filtersToApply.sexes && filtersToApply.sexes.length > 0) {
                filtersToApply.sexes.forEach((s: string) => params.append('sexes', s));
              }
              
              if (filtersToApply.location_country) {
                params.append('location_country', filtersToApply.location_country);
              }
              
              if (filtersToApply.age_min !== null) {
                params.append('min_age', filtersToApply.age_min?.toString() || '0');
              }
              
              if (filtersToApply.age_max !== null) {
                params.append('max_age', filtersToApply.age_max?.toString() || '100');
              }
              
              if (filtersToApply.height_min !== null) {
                params.append('min_height', filtersToApply.height_min?.toString() || '0');
              }
              
              if (filtersToApply.height_max !== null) {
                params.append('max_height', filtersToApply.height_max?.toString() || '20');
              }
              
              if (filtersToApply.price_min !== null) {
                params.append('min_price', filtersToApply.price_min?.toString() || '0');
              }
              
              if (filtersToApply.price_max !== null) {
                params.append('max_price', filtersToApply.price_max?.toString() || '1000000');
              }
              
              // Always send currency
              params.append('currency', filtersToApply.currency || currentCurrency);
              
              console.log("Show Results - Navigation params:", params.toString());
              
              // Using setTimeout to ensure consistent behavior with the other Apply button
              setTimeout(() => {
                navigate(`/browse?${params.toString()}`);
              }, 300);
            }}
          >
            Show Results ({isLoading ? '...' : horses?.length || 0})
          </Button>
        </div>
      </div>
    </Layout>
  );
}