import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencySelector } from "@/components/CurrencySelector";
import MobileNavbar from "@/components/MobileNavbar";
import { getMinPrice, getMaxPrice, formatPrice } from "@/lib/currencyConverter";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: any;
  onApplyFilters: (filters: any) => void;
  horseCount?: number;
}

// Available filter options

// Price range options for horse filtering
const priceOptions = [
  5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000,
  55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000, 100000,
  150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000
];

// Helper function to format price with currency symbol
const formatPriceWithCurrency = (amount: number, currency: string): string => {
  switch (currency) {
    case "USD":
      return `$${amount.toLocaleString()}`;
    case "GBP":
      return `£${amount.toLocaleString()}`;
    case "EUR":
      return `€${amount.toLocaleString()}`;
    case "AUD":
      return `A$${amount.toLocaleString()}`;
    case "NZD":
      return `NZ$${amount.toLocaleString()}`;
    default:
      return `$${amount.toLocaleString()}`;
  }
};

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

  const handleChange = (key: string, value: any, autoApply: boolean = false) => {
    setFilters(prev => {
      // Validation for min/max pairs to ensure max is not less than min
      let newFilters = prev;
      
      if (key === 'price_min' && prev.price_max && value > prev.price_max && prev.price_max !== 999999999) {
        // If new min is greater than current max, set max to null or a higher value
        newFilters = {
          ...prev,
          [key]: value,
          price_max: 999999999 // Reset to "No Max" when min exceeds max
        };
      } else if (key === 'price_max' && prev.price_min && value < prev.price_min && value !== 999999999) {
        // If new max is less than current min, don't update
        return prev;
      } else if (key === 'age_min' && prev.age_max && value > prev.age_max && prev.age_max !== 999) {
        // If new min is greater than current max, set max to null or a higher value
        newFilters = {
          ...prev,
          [key]: value,
          age_max: 999 // Reset to "No Max" when min exceeds max
        };
      } else if (key === 'age_max' && prev.age_min && value < prev.age_min && value !== 999) {
        // If new max is less than current min, don't update
        return prev;
      } else if (key === 'height_min' && prev.height_max && value > prev.height_max && prev.height_max !== 999) {
        // If new min is greater than current max, set max to null or a higher value
        newFilters = {
          ...prev,
          [key]: value,
          height_max: 999 // Reset to "No Max" when min exceeds max
        };
      } else if (key === 'height_max' && prev.height_min && value < prev.height_min && value !== 999) {
        // If new max is less than current min, don't update
        return prev;
      } else {
        // Default case: just update the value
        newFilters = {
          ...prev,
          [key]: value
        };
      }
      
      // Auto-apply filters for dropdown changes
      if (autoApply) {
        setTimeout(() => {
          const filtersToApply = {
            ...newFilters,
            sire: newFilters.sire || null,
            dam_sire: newFilters.dam_sire || null
          };
          
          console.log("Auto-applying filters:", filtersToApply);
          onApplyFilters(filtersToApply);
        }, 100);
      }
      
      return newFilters;
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
      currency: "AUD",
      sire: null,
      dam_sire: null
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters); // Apply the reset filters immediately
  };

  if (!isOpen && isMobile) return null;

  return (
    <div className={`${isMobile ? 'fixed inset-0 bg-black bg-opacity-50 z-50' : ''}`}>
      <div className={`
        ${isMobile 
          ? 'absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-5 max-h-[85vh] overflow-y-auto z-50' 
          : 'h-full'}
      `}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-accent font-bold text-xl">Find Horses</h2>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="text-sm px-3 py-1.5 h-8 reset-button"
            >
              Reset All
            </Button>
            {isMobile && (
              <div className="mobileMenu">
                <MobileNavbar />
              </div>
            )}
          </div>
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
                  handleChange('disciplines', [], false);
                } else {
                  handleChange('disciplines', [value], false);
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
          {(filters.disciplines && filters.disciplines.length > 0 && filters.disciplines[0] && filters.disciplines[0] !== "all_disciplines") ? (
            <div className="filter-group">
              <Label className="block font-accent font-semibold mb-2 text-neutral-800">Level</Label>
              <Select 
                value={filters.levels?.[0] || ""} 
                onValueChange={(value) => handleChange('levels', [value], false)}
              >
                <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                  <SelectValue placeholder="Any Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any_level">Any Level</SelectItem>
                  <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                  <SelectItem value="Young Horse">Young Horse</SelectItem>
                  {constants?.levels && constants.levels[filters.disciplines[0]]?.map((level: string) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="filter-group">
              <Label className="block font-accent font-semibold mb-2 text-neutral-800 opacity-50">Level</Label>
              <Select disabled>
                <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg opacity-50">
                  <SelectValue placeholder="Select a discipline first" />
                </SelectTrigger>
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
                        {priceOptions
                          .filter(price => price >= getMinPrice(filters.currency || "AUD") && price <= getMaxPrice(filters.currency || "AUD"))
                          .map((price) => (
                            <SelectItem key={price} value={price.toString()}>
                              {formatPriceWithCurrency(price, filters.currency || "AUD")}
                            </SelectItem>
                          ))}
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
                        {priceOptions
                          .filter(price => price >= getMinPrice(filters.currency || "AUD") && price <= getMaxPrice(filters.currency || "AUD"))
                          .map((price) => (
                            <SelectItem key={price} value={price.toString()}>
                              {formatPriceWithCurrency(price, filters.currency || "AUD")}
                            </SelectItem>
                          ))}
                        <SelectItem value="999999">
                          Over {formatPriceWithCurrency(getMaxPrice(filters.currency || "AUD"), filters.currency || "AUD")}
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
                  onValueChange={(value) => handleChange('age_min', parseInt(value), true)}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    {filters.age_min && filters.age_min !== 0 ? (
                      <SelectValue />
                    ) : (
                      <span className="text-muted-foreground">Min</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Weanling</SelectItem>
                    <SelectItem value="1">Yearling</SelectItem>
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
                  onValueChange={(value) => handleChange('age_max', parseInt(value), true)}
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
                    <SelectItem value="0">Weanling</SelectItem>
                    <SelectItem value="1">Yearling</SelectItem>
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
                  value={filters.height_min === "young_horse" ? "young_horse" : (filters.height_min?.toString() || "0")} 
                  onValueChange={(value) => handleChange('height_min', value === "young_horse" ? "young_horse" : parseFloat(value), true)}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    {filters.height_min && filters.height_min !== 0 ? (
                      filters.height_min === "young_horse" ? "Young Horse" : <SelectValue />
                    ) : (
                      <span className="text-muted-foreground">Min</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Min</SelectItem>
                    <SelectItem value="young_horse">Young Horse</SelectItem>
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
                  value={filters.height_max === "young_horse" ? "young_horse" : (filters.height_max?.toString() || "999")} 
                  onValueChange={(value) => handleChange('height_max', value === "young_horse" ? "young_horse" : parseFloat(value), true)}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    {filters.height_max && filters.height_max !== 999 ? (
                      filters.height_max === "young_horse" ? "Young Horse" : <SelectValue />
                    ) : (
                      <span className="text-muted-foreground">Max</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="999">No Max</SelectItem>
                    <SelectItem value="young_horse">Young Horse</SelectItem>
                    <SelectItem value="14">14 hh</SelectItem>
                    <SelectItem value="14.1">14.1 hh</SelectItem>
                    <SelectItem value="14.2">14.2 hh</SelectItem>
                    <SelectItem value="14.3">14.3 hh</SelectItem>
                    <SelectItem value="15">15 hh</SelectItem>
                    <SelectItem value="15.1">15.1 hh</SelectItem>
                    <SelectItem value="15.2">15.2 hh</SelectItem>
                    <SelectItem value="15.3">15.3 hh</SelectItem>
                    <SelectItem value="16">16 hh</SelectItem>
                    <SelectItem value="16.1">16.1 hh</SelectItem>
                    <SelectItem value="16.2">16.2 hh</SelectItem>
                    <SelectItem value="16.3">16.3 hh</SelectItem>
                    <SelectItem value="17">17 hh</SelectItem>
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
                  handleChange('breeds', [], false);
                } else {
                  handleChange('breeds', [value], false);
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
                  handleChange('sexes', [], false);
                } else {
                  handleChange('sexes', [value], false);
                }
              }}
            >
              <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                <SelectValue placeholder="Any Sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any_sex">Any Sex</SelectItem>
                <SelectItem value="Colt">Colt</SelectItem>
                <SelectItem value="Filly">Filly</SelectItem>
                {constants?.sexes?.map((sex: string) => (
                  <SelectItem key={sex} value={sex}>{sex}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Bloodlines */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Bloodlines</Label>
            <div className="space-y-3">
              <div>
                <Label className="block text-sm font-medium mb-1 text-neutral-700">Sire</Label>
                <Input
                  type="text"
                  placeholder="Enter sire name..."
                  value={filters.sire || ""}
                  onChange={(e) => handleChange('sire', e.target.value || null)}
                  className="w-full bg-neutral-100 border border-neutral-200 rounded-lg"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1 text-neutral-700">Dam Sire</Label>
                <Input
                  type="text"
                  placeholder="Enter dam sire name..."
                  value={filters.dam_sire || ""}
                  onChange={(e) => handleChange('dam_sire', e.target.value || null)}
                  className="w-full bg-neutral-100 border border-neutral-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Location</Label>
            <Select 
              value={filters.location_country || ""} 
              onValueChange={(value) => handleChange('location_country', value, false)}
            >
              <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                <SelectValue placeholder="Any Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any_location">Any Location</SelectItem>
                {constants && constants.countries ? (
                  constants.countries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="New Zealand">New Zealand</SelectItem>
                    <SelectItem value="North America">North America</SelectItem>
                    <SelectItem value="Northern Europe">Northern Europe</SelectItem>
                    <SelectItem value="Central Europe">Central Europe</SelectItem>
                    <SelectItem value="Southern Europe">Southern Europe</SelectItem>
                    <SelectItem value="United Kingdom and Ireland">United Kingdom and Ireland</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        

        
        {/* Filter Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 reset-button"
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
