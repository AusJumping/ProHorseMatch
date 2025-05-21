import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencySelector } from "@/components/CurrencySelector";
import MobileNavbar from "@/components/MobileNavbar";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: any;
  onApplyFilters: (filters: any) => void;
  horseCount?: number;
}

// Available filter options (would come from API in a real app)
const countries = [
  "Any Location", "Australia", "United States"
];
const radiusOptions = ["Any", "50km", "100km", "150km", "200km", "300km", "500km"];

const FilterPanel = ({ 
  isOpen, 
  onClose, 
  activeFilters, 
  onApplyFilters,
  horseCount 
}: FilterPanelProps) => {
  const isMobile = useMobile();
  const [filters, setFilters] = useState(activeFilters);
  const { currentCurrency, setCurrentCurrency } = useCurrency();
  
  // Fetch constants for filter options
  const { data: constants } = useQuery({
    queryKey: ['/api/constants'],
  });
  
  // Sync currency between context and filters
  useEffect(() => {
    if (currentCurrency) {
      handleChange('currency', currentCurrency);
    }
  }, [currentCurrency]);

  useEffect(() => {
    setFilters(activeFilters);
  }, [activeFilters]);

  const handleChange = (key: string, value: any) => {
    setFilters(prev => {
      // Validation for min/max pairs to ensure max is not less than min
      if (key === 'price_min' && prev.price_max && value > prev.price_max && prev.price_max !== 999999999) {
        // If new min is greater than current max, set max to null or a higher value
        return {
          ...prev,
          [key]: value,
          price_max: 999999999 // Reset to "No Max" when min exceeds max
        };
      }
      
      if (key === 'price_max' && prev.price_min && value < prev.price_min && value !== 999999999) {
        // If new max is less than current min, don't update
        return prev;
      }
      
      if (key === 'age_min' && prev.age_max && value > prev.age_max && prev.age_max !== 999) {
        // If new min is greater than current max, set max to null or a higher value
        return {
          ...prev,
          [key]: value,
          age_max: 999 // Reset to "No Max" when min exceeds max
        };
      }
      
      if (key === 'age_max' && prev.age_min && value < prev.age_min && value !== 999) {
        // If new max is less than current min, don't update
        return prev;
      }
      
      if (key === 'height_min' && prev.height_max && value > prev.height_max && prev.height_max !== 999) {
        // If new min is greater than current max, set max to null or a higher value
        return {
          ...prev,
          [key]: value,
          height_max: 999 // Reset to "No Max" when min exceeds max
        };
      }
      
      if (key === 'height_max' && prev.height_min && value < prev.height_min && value !== 999) {
        // If new max is less than current min, don't update
        return prev;
      }
      
      // Default case: just update the value
      return {
        ...prev,
        [key]: value
      };
    });
    
    // Also update currency context if currency is changed
    if (key === 'currency') {
      setCurrentCurrency(value);
    }
  };

  const toggleItem = (key: string, value: string) => {
    setFilters(prev => {
      const currentArray = [...(prev[key] || [])];
      const index = currentArray.indexOf(value);
      
      if (index === -1) {
        return {
          ...prev,
          [key]: [...currentArray, value]
        };
      } else {
        currentArray.splice(index, 1);
        return {
          ...prev,
          [key]: currentArray
        };
      }
    });
  };

  const handleApply = () => {
    // Verify the filter data before sending it
    console.log("Apply button clicked with filters:", filters);
    
    // Make a copy of filters to ensure we're not affected by any state issues
    const filtersToApply = {...filters};
    
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
    
    // Add additional logging for debugging
    console.log("Sending processed filters:", filtersToApply);
    
    // Keep this simpler for mobile - just apply filters and close panel
  console.log("FILTER PANEL: Applying filters", filtersToApply);
  
  // First apply the filters
  onApplyFilters(filtersToApply);
  
  // Force a quick timeout before closing the panel
  setTimeout(() => {
    // Then close the panel
    onClose();
    
    // Store the filter choice in localStorage for retrieval but don't show any indicators
    if (filtersToApply.disciplines && filtersToApply.disciplines.length > 0) {
      localStorage.setItem('active_discipline_filter', filtersToApply.disciplines[0]);
      
      // Add a query parameter to the URL for persistence but don't display anything
      const url = new URL(window.location.href);
      url.searchParams.set('discipline', filtersToApply.disciplines[0]);
      window.history.replaceState(null, "", url.toString());
    } else {
      localStorage.removeItem('active_discipline_filter');
      
      // Remove query parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('discipline');
      window.history.replaceState(null, "", url.toString());
    }
  }, 100);
  };

  const handleReset = () => {
    const resetFilters = {
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
      currency: "AUD"
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters); // Apply the reset filters immediately
  };

  if (!isOpen && isMobile) return null;

  return (
    <div className={`${isMobile ? 'fixed inset-0 bg-black bg-opacity-50 z-20' : ''}`}>
      <div className={`
        ${isMobile 
          ? 'absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-5 max-h-[85vh] overflow-y-auto' 
          : 'h-full'}
      `}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-accent font-bold text-xl">Find Horses</h2>
          {isMobile && (
            <div className="mobileMenu">
              <MobileNavbar />
            </div>
          )}
        </div>
        
        {/* Filter Forms */}
        <div className="space-y-6">
          {/* Disciplines */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Disciplines</Label>
            <Select 
              value={filters.disciplines && filters.disciplines.length > 0 ? filters.disciplines[0] : "all_disciplines"} 
              onValueChange={(value) => {
                if (value === "all_disciplines") {
                  handleChange('disciplines', []);
                } else {
                  handleChange('disciplines', [value]);
                }
              }}
            >
              <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                <SelectValue placeholder="All Disciplines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_disciplines">All Disciplines</SelectItem>
                {constants?.disciplines?.map((discipline: string) => (
                  <SelectItem key={discipline} value={discipline}>{discipline}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Discipline Levels */}
          {filters.disciplines && filters.disciplines.length > 0 && filters.disciplines[0] !== "all_disciplines" && (
            <div className="filter-group">
              <Label className="block font-accent font-semibold mb-2 text-neutral-800">Level</Label>
              <Select 
                value={filters.levels?.[0] || ""} 
                onValueChange={(value) => handleChange('levels', [value])}
              >
                <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                  <SelectValue placeholder="Any Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any_level">Any Level</SelectItem>
                  {constants?.levels && filters.disciplines[0] && constants.levels[filters.disciplines[0]]?.map((level: string) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Price Range and Currency */}
          <div className="filter-group">
            <div className="mb-3">
              <Label className="block font-accent font-semibold mb-2 text-neutral-800">Currency</Label>
              <CurrencySelector 
                defaultValue={filters.currency || "AUD"}
                onChange={(value) => handleChange('currency', value)}
                showLabel={false}
              />
            </div>
            
            {/* Only show price range after currency is selected */}
            {filters.currency && (
              <>
                <Label className="block font-accent font-semibold mb-2 text-neutral-800">Price Range (in {filters.currency})</Label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Select 
                      value={filters.price_min?.toString() || "0"} 
                      onValueChange={(value) => handleChange('price_min', parseInt(value))}
                    >
                      <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                        {filters.price_min && filters.price_min !== 0 ? (
                          <SelectValue />
                        ) : (
                          <span className="text-muted-foreground">Min</span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No Min</SelectItem>
                        <SelectItem value="5000">
                          {filters.currency === "USD" ? "$5,000" : 
                           filters.currency === "AUD" ? "A$5,000" : ""}
                        </SelectItem>
                        <SelectItem value="10000">
                          {filters.currency === "USD" ? "$10,000" : 
                           filters.currency === "AUD" ? "A$10,000" : ""}
                        </SelectItem>
                        <SelectItem value="15000">
                          {filters.currency === "USD" ? "$15,000" : 
                           filters.currency === "AUD" ? "A$15,000" : ""}
                        </SelectItem>
                        <SelectItem value="20000">
                          {filters.currency === "USD" ? "$20,000" : 
                           filters.currency === "AUD" ? "A$20,000" : ""}
                        </SelectItem>
                        <SelectItem value="25000">
                          {filters.currency === "USD" ? "$25,000" : 
                           filters.currency === "AUD" ? "A$25,000" : ""}
                        </SelectItem>
                        <SelectItem value="30000">
                          {filters.currency === "USD" ? "$30,000" : 
                           filters.currency === "AUD" ? "A$30,000" : ""}
                        </SelectItem>
                        <SelectItem value="35000">
                          {filters.currency === "USD" ? "$35,000" : 
                           filters.currency === "AUD" ? "A$35,000" : ""}
                        </SelectItem>
                        <SelectItem value="40000">
                          {filters.currency === "USD" ? "$40,000" : 
                           filters.currency === "AUD" ? "A$40,000" : ""}
                        </SelectItem>
                        <SelectItem value="45000">
                          {filters.currency === "USD" ? "$45,000" : 
                           filters.currency === "AUD" ? "A$45,000" : ""}
                        </SelectItem>
                        <SelectItem value="50000">
                          {filters.currency === "USD" ? "$50,000" : 
                           filters.currency === "AUD" ? "A$50,000" : ""}
                        </SelectItem>
                        <SelectItem value="55000">
                          {filters.currency === "USD" ? "$55,000" : 
                           filters.currency === "AUD" ? "A$55,000" : ""}
                        </SelectItem>
                        <SelectItem value="60000">
                          {filters.currency === "USD" ? "$60,000" : 
                           filters.currency === "AUD" ? "A$60,000" : ""}
                        </SelectItem>
                        <SelectItem value="65000">
                          {filters.currency === "USD" ? "$65,000" : 
                           filters.currency === "AUD" ? "A$65,000" : ""}
                        </SelectItem>
                        <SelectItem value="70000">
                          {filters.currency === "USD" ? "$70,000" : 
                           filters.currency === "AUD" ? "A$70,000" : ""}
                        </SelectItem>
                        <SelectItem value="75000">
                          {filters.currency === "USD" ? "$75,000" : 
                           filters.currency === "AUD" ? "A$75,000" : ""}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select 
                      value={filters.price_max?.toString() || "999999999"} 
                      onValueChange={(value) => handleChange('price_max', parseInt(value))}
                    >
                      <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                        {filters.price_max && filters.price_max !== 999999999 ? (
                          <SelectValue />
                        ) : (
                          <span className="text-muted-foreground">Max</span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="999999999">No Max</SelectItem>
                        <SelectItem value="5000">
                          {filters.currency === "USD" ? "$5,000" : 
                           filters.currency === "AUD" ? "A$5,000" : ""}
                        </SelectItem>
                        <SelectItem value="10000">
                          {filters.currency === "USD" ? "$10,000" : 
                           filters.currency === "AUD" ? "A$10,000" : ""}
                        </SelectItem>
                        <SelectItem value="15000">
                          {filters.currency === "USD" ? "$15,000" : 
                           filters.currency === "AUD" ? "A$15,000" : ""}
                        </SelectItem>
                        <SelectItem value="20000">
                          {filters.currency === "USD" ? "$20,000" : 
                           filters.currency === "AUD" ? "A$20,000" : ""}
                        </SelectItem>
                        <SelectItem value="25000">
                          {filters.currency === "USD" ? "$25,000" : 
                           filters.currency === "AUD" ? "A$25,000" : ""}
                        </SelectItem>
                        <SelectItem value="30000">
                          {filters.currency === "USD" ? "$30,000" : 
                           filters.currency === "AUD" ? "A$30,000" : ""}
                        </SelectItem>
                        <SelectItem value="35000">
                          {filters.currency === "USD" ? "$35,000" : 
                           filters.currency === "AUD" ? "A$35,000" : ""}
                        </SelectItem>
                        <SelectItem value="40000">
                          {filters.currency === "USD" ? "$40,000" : 
                           filters.currency === "AUD" ? "A$40,000" : ""}
                        </SelectItem>
                        <SelectItem value="45000">
                          {filters.currency === "USD" ? "$45,000" : 
                           filters.currency === "AUD" ? "A$45,000" : ""}
                        </SelectItem>
                        <SelectItem value="50000">
                          {filters.currency === "USD" ? "$50,000" : 
                           filters.currency === "AUD" ? "A$50,000" : ""}
                        </SelectItem>
                        <SelectItem value="55000">
                          {filters.currency === "USD" ? "$55,000" : 
                           filters.currency === "AUD" ? "A$55,000" : ""}
                        </SelectItem>
                        <SelectItem value="60000">
                          {filters.currency === "USD" ? "$60,000" : 
                           filters.currency === "AUD" ? "A$60,000" : ""}
                        </SelectItem>
                        <SelectItem value="65000">
                          {filters.currency === "USD" ? "$65,000" : 
                           filters.currency === "AUD" ? "A$65,000" : ""}
                        </SelectItem>
                        <SelectItem value="70000">
                          {filters.currency === "USD" ? "$70,000" : 
                           filters.currency === "AUD" ? "A$70,000" : ""}
                        </SelectItem>
                        <SelectItem value="75000">
                          {filters.currency === "USD" ? "$75,000" : 
                           filters.currency === "AUD" ? "A$75,000" : ""}
                        </SelectItem>
                        <SelectItem value="80000">
                          {filters.currency === "USD" ? "$80,000" : 
                           filters.currency === "AUD" ? "A$80,000" : ""}
                        </SelectItem>
                        <SelectItem value="85000">
                          {filters.currency === "USD" ? "$85,000" : 
                           filters.currency === "AUD" ? "A$85,000" : ""}
                        </SelectItem>
                        <SelectItem value="90000">
                          {filters.currency === "USD" ? "$90,000" : 
                           filters.currency === "AUD" ? "A$90,000" : ""}
                        </SelectItem>
                        <SelectItem value="95000">
                          {filters.currency === "USD" ? "$95,000" : 
                           filters.currency === "AUD" ? "A$95,000" : ""}
                        </SelectItem>
                        <SelectItem value="100000">
                          {filters.currency === "USD" ? "$100,000" : 
                           filters.currency === "AUD" ? "A$100,000" : ""}
                        </SelectItem>
                        <SelectItem value="150000">
                          {filters.currency === "USD" ? "$150,000" : 
                           filters.currency === "AUD" ? "A$150,000" : ""}
                        </SelectItem>
                        <SelectItem value="200000">
                          {filters.currency === "USD" ? "$200,000" : 
                           filters.currency === "AUD" ? "A$200,000" : ""}
                        </SelectItem>
                        <SelectItem value="250000">
                          {filters.currency === "USD" ? "$250,000" : 
                           filters.currency === "AUD" ? "A$250,000" : ""}
                        </SelectItem>
                        <SelectItem value="300000">
                          {filters.currency === "USD" ? "$300,000" : 
                           filters.currency === "AUD" ? "A$300,000" : ""}
                        </SelectItem>
                        <SelectItem value="350000">
                          {filters.currency === "USD" ? "$350,000" : 
                           filters.currency === "AUD" ? "A$350,000" : ""}
                        </SelectItem>
                        <SelectItem value="400000">
                          {filters.currency === "USD" ? "$400,000" : 
                           filters.currency === "AUD" ? "A$400,000" : ""}
                        </SelectItem>
                        <SelectItem value="450000">
                          {filters.currency === "USD" ? "$450,000" : 
                           filters.currency === "AUD" ? "A$450,000" : ""}
                        </SelectItem>
                        <SelectItem value="500000">
                          {filters.currency === "USD" ? "$500,000" : 
                           filters.currency === "AUD" ? "A$500,000" : ""}
                        </SelectItem>
                        <SelectItem value="999999">
                          {filters.currency === "USD" ? "Over $500,000" : 
                           filters.currency === "AUD" ? "Over A$500,000" : ""}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Age Range */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Age Range</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Select 
                  value={filters.age_min?.toString() || "0"} 
                  onValueChange={(value) => handleChange('age_min', parseInt(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    {filters.age_min && filters.age_min !== 0 ? (
                      <SelectValue />
                    ) : (
                      <span className="text-muted-foreground">Min</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Min</SelectItem>
                    <SelectItem value="1">1 year</SelectItem>
                    <SelectItem value="2">2 years</SelectItem>
                    <SelectItem value="3">3 years</SelectItem>
                    <SelectItem value="4">4 years</SelectItem>
                    <SelectItem value="5">5 years</SelectItem>
                    <SelectItem value="6">6 years</SelectItem>
                    <SelectItem value="7">7 years</SelectItem>
                    <SelectItem value="8">8 years</SelectItem>
                    <SelectItem value="9">9 years</SelectItem>
                    <SelectItem value="10">10 years</SelectItem>
                    <SelectItem value="11">11 years</SelectItem>
                    <SelectItem value="12">12 years</SelectItem>
                    <SelectItem value="13">13 years</SelectItem>
                    <SelectItem value="14">14 years</SelectItem>
                    <SelectItem value="15">15 years</SelectItem>
                    <SelectItem value="16">16 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select 
                  value={filters.age_max?.toString() || "999"} 
                  onValueChange={(value) => handleChange('age_max', parseInt(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    {filters.age_max && filters.age_max !== 999 ? (
                      <SelectValue />
                    ) : (
                      <span className="text-muted-foreground">Max</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="999">No Max</SelectItem>
                    <SelectItem value="1">1 year</SelectItem>
                    <SelectItem value="2">2 years</SelectItem>
                    <SelectItem value="3">3 years</SelectItem>
                    <SelectItem value="4">4 years</SelectItem>
                    <SelectItem value="5">5 years</SelectItem>
                    <SelectItem value="6">6 years</SelectItem>
                    <SelectItem value="7">7 years</SelectItem>
                    <SelectItem value="8">8 years</SelectItem>
                    <SelectItem value="9">9 years</SelectItem>
                    <SelectItem value="10">10 years</SelectItem>
                    <SelectItem value="11">11 years</SelectItem>
                    <SelectItem value="12">12 years</SelectItem>
                    <SelectItem value="13">13 years</SelectItem>
                    <SelectItem value="14">14 years</SelectItem>
                    <SelectItem value="15">15 years</SelectItem>
                    <SelectItem value="16">16 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Height Range */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Height Range</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Select 
                  value={filters.height_min?.toString() || "0"} 
                  onValueChange={(value) => handleChange('height_min', parseFloat(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    {filters.height_min && filters.height_min !== 0 ? (
                      <SelectValue />
                    ) : (
                      <span className="text-muted-foreground">Min</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Min</SelectItem>
                    <SelectItem value="12.0">12.0 hh</SelectItem>
                    <SelectItem value="12.1">12.1 hh</SelectItem>
                    <SelectItem value="12.2">12.2 hh</SelectItem>
                    <SelectItem value="12.3">12.3 hh</SelectItem>
                    <SelectItem value="13.0">13.0 hh</SelectItem>
                    <SelectItem value="13.1">13.1 hh</SelectItem>
                    <SelectItem value="13.2">13.2 hh</SelectItem>
                    <SelectItem value="13.3">13.3 hh</SelectItem>
                    <SelectItem value="14.0">14.0 hh</SelectItem>
                    <SelectItem value="14.1">14.1 hh</SelectItem>
                    <SelectItem value="14.2">14.2 hh</SelectItem>
                    <SelectItem value="14.3">14.3 hh</SelectItem>
                    <SelectItem value="15.0">15.0 hh</SelectItem>
                    <SelectItem value="15.1">15.1 hh</SelectItem>
                    <SelectItem value="15.2">15.2 hh</SelectItem>
                    <SelectItem value="15.3">15.3 hh</SelectItem>
                    <SelectItem value="16.0">16.0 hh</SelectItem>
                    <SelectItem value="16.1">16.1 hh</SelectItem>
                    <SelectItem value="16.2">16.2 hh</SelectItem>
                    <SelectItem value="16.3">16.3 hh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select 
                  value={filters.height_max?.toString() || "999"} 
                  onValueChange={(value) => handleChange('height_max', parseFloat(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    {filters.height_max && filters.height_max !== 999 ? (
                      <SelectValue />
                    ) : (
                      <span className="text-muted-foreground">Max</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="999">No Max</SelectItem>
                    <SelectItem value="13.1">13.1 hh</SelectItem>
                    <SelectItem value="13.2">13.2 hh</SelectItem>
                    <SelectItem value="13.3">13.3 hh</SelectItem>
                    <SelectItem value="14.0">14.0 hh</SelectItem>
                    <SelectItem value="14.1">14.1 hh</SelectItem>
                    <SelectItem value="14.2">14.2 hh</SelectItem>
                    <SelectItem value="14.3">14.3 hh</SelectItem>
                    <SelectItem value="15.0">15.0 hh</SelectItem>
                    <SelectItem value="15.1">15.1 hh</SelectItem>
                    <SelectItem value="15.2">15.2 hh</SelectItem>
                    <SelectItem value="15.3">15.3 hh</SelectItem>
                    <SelectItem value="16.0">16.0 hh</SelectItem>
                    <SelectItem value="16.1">16.1 hh</SelectItem>
                    <SelectItem value="16.2">16.2 hh</SelectItem>
                    <SelectItem value="16.3">16.3 hh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Breed */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Breed</Label>
            <Select 
              value={filters.breeds && filters.breeds.length > 0 ? filters.breeds[0] : "all_breeds"} 
              onValueChange={(value) => {
                if (value === "all_breeds") {
                  handleChange('breeds', []);
                } else {
                  handleChange('breeds', [value]);
                }
              }}
            >
              <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                <SelectValue placeholder="All Breeds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_breeds">All Breeds</SelectItem>
                <SelectItem value="Warmblood">Warmblood</SelectItem>
                <SelectItem value="Thoroughbred">Thoroughbred</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Sex */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Sex</Label>
            <Select 
              value={filters.sexes && filters.sexes.length > 0 ? filters.sexes[0] : "any_sex"} 
              onValueChange={(value) => {
                if (value === "any_sex") {
                  handleChange('sexes', []);
                } else {
                  handleChange('sexes', [value]);
                }
              }}
            >
              <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                <SelectValue placeholder="Any Sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any_sex">Any Sex</SelectItem>
                {constants?.sexes?.map((sex: string) => (
                  <SelectItem key={sex} value={sex}>{sex}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Location */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Location</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Select 
                  value={filters.location_country || ""} 
                  onValueChange={(value) => handleChange('location_country', value)}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="Any Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country === "Any Location" ? "any_location" : country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-1/3">
                <Select 
                  value={filters.location_radius_km ? `${filters.location_radius_km}km` : ""} 
                  onValueChange={(value) => handleChange('location_radius_km', parseInt(value) || null)}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    {radiusOptions.map((option) => (
                      <SelectItem key={option} value={option === "Any" ? "any_radius" : option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        

        
        {/* Filter Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReset}
          >
            Reset All
          </Button>
          <Button
            className="flex-1"
            onClick={handleApply}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleApply();
            }}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
