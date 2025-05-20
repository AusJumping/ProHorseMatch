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
    
    // After applying filters, navigate to browse page
    const params = new URLSearchParams();
    
    if (newFilters.disciplines && newFilters.disciplines.length > 0) {
      newFilters.disciplines.forEach(d => params.append('disciplines', d));
    }
    
    if (newFilters.breeds && newFilters.breeds.length > 0) {
      newFilters.breeds.forEach(b => params.append('breeds', b));
    }
    
    if (newFilters.sexes && newFilters.sexes.length > 0) {
      newFilters.sexes.forEach(s => params.append('sexes', s));
    }
    
    if (newFilters.location_country) {
      params.append('location_country', newFilters.location_country);
    }
    
    if (newFilters.age_min !== null) {
      params.append('min_age', newFilters.age_min?.toString() || '0');
    }
    
    if (newFilters.age_max !== null) {
      params.append('max_age', newFilters.age_max?.toString() || '100');
    }
    
    if (newFilters.height_min !== null) {
      params.append('min_height', newFilters.height_min?.toString() || '0');
    }
    
    if (newFilters.height_max !== null) {
      params.append('max_height', newFilters.height_max?.toString() || '20');
    }
    
    if (newFilters.price_min !== null) {
      params.append('min_price', newFilters.price_min?.toString() || '0');
    }
    
    if (newFilters.price_max !== null) {
      params.append('max_price', newFilters.price_max?.toString() || '1000000');
    }
    
    params.append('currency', newFilters.currency || currentCurrency);
    
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
              console.log("Navigating to browse with filters:", activeFilters);
              
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