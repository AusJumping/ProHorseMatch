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
    setFilters((prev: any) => {
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
    setFilters((prev: any) => {
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
    // Apply button clicked - single click with immediate processing
    console.log("Apply button clicked with filters:", filters);
    
    // Remove focus from button to prevent accidental double clicks
    document.activeElement?.blur();
    
    // Create a direct copy of the filters object to avoid state mutations
    const filtersToApply = JSON.parse(JSON.stringify(filters));
    
    // Make API request work properly by cleaning up special values
    if (filtersToApply.disciplines && filtersToApply.disciplines[0] === "all_disciplines") {
      filtersToApply.disciplines = [];
    }
    
    if (filtersToApply.breeds && filtersToApply.breeds[0] === "all_breeds") {
      filtersToApply.breeds = [];
    }
    
    if (filtersToApply.sexes && filtersToApply.sexes[0] === "any_sex") {
      filtersToApply.sexes = [];
    }
    
    console.log("Processed filters to apply:", filtersToApply);
    
    // Store filters in localStorage before applying for backup
    try {
      localStorage.setItem('lastAppliedFilters', JSON.stringify(filtersToApply));
      localStorage.setItem('filtersTimestamp', Date.now().toString());
    } catch (error) {
      console.error("Error saving filters to localStorage:", error);
    }
    
    // For mobile devices, first close the panel to prevent UI issues
    if (isMobile) {
      onClose();
      
      // Then apply filters after a tiny delay to ensure the UI update completes
      setTimeout(() => {
        onApplyFilters(filtersToApply);
      }, 50);
    } else {
      // For desktop, apply immediately
      onApplyFilters(filtersToApply);
    }
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
          <h2 className="font-accent font-bold text-xl">Search</h2>
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
                        <SelectItem value="30000">
                          {filters.currency === "USD" ? "$30,000" : 
                           filters.currency === "AUD" ? "A$30,000" : ""}
                        </SelectItem>
                        <SelectItem value="50000">
                          {filters.currency === "USD" ? "$50,000" : 
                           filters.currency === "AUD" ? "A$50,000" : ""}
                        </SelectItem>
                        <SelectItem value="75000">
                          {filters.currency === "USD" ? "$75,000" : 
                           filters.currency === "AUD" ? "A$75,000" : ""}
                        </SelectItem>
                        <SelectItem value="100000">
                          {filters.currency === "USD" ? "$100,000" : 
                           filters.currency === "AUD" ? "A$100,000" : ""}
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
                        <SelectItem value="15000">
                          {filters.currency === "USD" ? "$15,000" : 
                          filters.currency === "AUD" ? "A$15,000" : ""}
                        </SelectItem>
                        <SelectItem value="25000">
                          {filters.currency === "USD" ? "$25,000" : 
                          filters.currency === "AUD" ? "A$25,000" : ""}
                        </SelectItem>
                        <SelectItem value="50000">
                          {filters.currency === "USD" ? "$50,000" : 
                          filters.currency === "AUD" ? "A$50,000" : ""}
                        </SelectItem>
                        <SelectItem value="75000">
                          {filters.currency === "USD" ? "$75,000" : 
                          filters.currency === "AUD" ? "A$75,000" : ""}
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Breeds */}
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
                {constants?.breeds?.map((breed: string) => (
                  <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                ))}
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
          
          {/* Age */}
          <div className="filter-group">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-accent font-semibold text-neutral-800">Age (years)</Label>
              <div className="text-sm text-muted-foreground">
                {filters.age_min !== null ? filters.age_min : '0'} - {filters.age_max !== null ? filters.age_max : '20+'}
              </div>
            </div>
            
            <Slider
              defaultValue={[filters.age_min || 0, filters.age_max || 20]}
              min={0}
              max={20}
              step={1}
              className="my-5"
              onValueCommit={(values) => {
                if (values.length === 2) {
                  handleChange('age_min', values[0]);
                  handleChange('age_max', values[1]);
                }
              }}
            />
          </div>
          
          {/* Height */}
          <div className="filter-group">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-accent font-semibold text-neutral-800">Height (hands)</Label>
              <div className="text-sm text-muted-foreground">
                {filters.height_min !== null ? filters.height_min : '13'} - {filters.height_max !== null ? filters.height_max : '18+'}
              </div>
            </div>
            
            <Slider
              defaultValue={[filters.height_min || 13, filters.height_max || 18]}
              min={13}
              max={18}
              step={0.1}
              className="my-5"
              onValueCommit={(values) => {
                if (values.length === 2) {
                  handleChange('height_min', values[0]);
                  handleChange('height_max', values[1]);
                }
              }}
            />
          </div>
          
          {/* Location */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Location</Label>
            <Select 
              value={filters.location_country || "Any Location"} 
              onValueChange={(value) => {
                handleChange('location_country', value === "Any Location" ? null : value);
              }}
            >
              <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                <SelectValue placeholder="Any Location" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            id="apply-filters-button"
            className="flex-1"
            onClick={handleApply}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
