import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CurrencySelector } from "@/components/CurrencySelector";
import MobileNavbar from "@/components/MobileNavbar";

interface MobileFilterPanelProps {
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

const MobileFilterPanel = ({ 
  isOpen, 
  onClose, 
  activeFilters, 
  onApplyFilters,
  horseCount 
}: MobileFilterPanelProps) => {
  // Always start with empty disciplines array to force "All Disciplines" as default
  const [filters, setFilters] = useState({
    ...activeFilters,
    disciplines: []
  });
  
  // Fetch constants for filter options
  const { data: constants } = useQuery({
    queryKey: ['/api/constants'],
  });
  
  // Update filters when activeFilters changes (but keep disciplines empty to force "All Disciplines")
  useEffect(() => {
    setFilters(prev => ({
      ...activeFilters,
      disciplines: [] // Always force "All Disciplines" as default
    }));
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
      
      // For all other cases, just update the value
      return { ...prev, [key]: value };
    });
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
  
  const handleApply = () => {
    // Create a direct copy of the filters object to avoid state mutations
    const filtersToApply = JSON.parse(JSON.stringify(filters));
    
    // Clean up special values for API
    if (filtersToApply.disciplines && filtersToApply.disciplines[0] === "all_disciplines") {
      filtersToApply.disciplines = [];
    }
    
    if (filtersToApply.breeds && filtersToApply.breeds[0] === "all_breeds") {
      filtersToApply.breeds = [];
    }
    
    if (filtersToApply.sexes && filtersToApply.sexes[0] === "any_sex") {
      filtersToApply.sexes = [];
    }
    
    // First close the panel to prevent UI issues
    onClose();
    
    // Then apply filters after a tiny delay to ensure the UI update completes
    setTimeout(() => {
      onApplyFilters(filtersToApply);
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-20">
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-accent font-bold text-xl">Search</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
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
                        <SelectValue placeholder="No Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No Min</SelectItem>
                        <SelectItem value="1000">1,000</SelectItem>
                        <SelectItem value="5000">5,000</SelectItem>
                        <SelectItem value="10000">10,000</SelectItem>
                        <SelectItem value="25000">25,000</SelectItem>
                        <SelectItem value="50000">50,000</SelectItem>
                        <SelectItem value="100000">100,000</SelectItem>
                        <SelectItem value="250000">250,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Select 
                      value={filters.price_max?.toString() || "999999999"} 
                      onValueChange={(value) => handleChange('price_max', parseInt(value))}
                    >
                      <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                        <SelectValue placeholder="No Max" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="999999999">No Max</SelectItem>
                        <SelectItem value="10000">10,000</SelectItem>
                        <SelectItem value="25000">25,000</SelectItem>
                        <SelectItem value="50000">50,000</SelectItem>
                        <SelectItem value="100000">100,000</SelectItem>
                        <SelectItem value="250000">250,000</SelectItem>
                        <SelectItem value="500000">500,000</SelectItem>
                        <SelectItem value="1000000">1,000,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Age Range */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Age Range (years)</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Select 
                  value={filters.age_min?.toString() || "0"} 
                  onValueChange={(value) => handleChange('age_min', parseInt(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="No Min" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Min</SelectItem>
                    <SelectItem value="3">3yo</SelectItem>
                    <SelectItem value="4">4yo</SelectItem>
                    <SelectItem value="5">5yo</SelectItem>
                    <SelectItem value="6">6yo</SelectItem>
                    <SelectItem value="7">7yo</SelectItem>
                    <SelectItem value="8">8yo</SelectItem>
                    <SelectItem value="9">9yo</SelectItem>
                    <SelectItem value="10">10yo</SelectItem>
                    <SelectItem value="12">12yo</SelectItem>
                    <SelectItem value="15">15yo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Select 
                  value={filters.age_max?.toString() || "999"} 
                  onValueChange={(value) => handleChange('age_max', parseInt(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="No Max" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="999">No Max</SelectItem>
                    <SelectItem value="5">5yo</SelectItem>
                    <SelectItem value="6">6yo</SelectItem>
                    <SelectItem value="7">7yo</SelectItem>
                    <SelectItem value="8">8yo</SelectItem>
                    <SelectItem value="9">9yo</SelectItem>
                    <SelectItem value="10">10yo</SelectItem>
                    <SelectItem value="12">12yo</SelectItem>
                    <SelectItem value="15">15yo</SelectItem>
                    <SelectItem value="20">20yo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Height Range */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Height Range (hands)</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Select 
                  value={filters.height_min?.toString() || "0"} 
                  onValueChange={(value) => handleChange('height_min', parseFloat(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="No Min" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Min</SelectItem>
                    <SelectItem value="13">13.0hh</SelectItem>
                    <SelectItem value="13.1">13.1hh</SelectItem>
                    <SelectItem value="13.2">13.2hh</SelectItem>
                    <SelectItem value="13.3">13.3hh</SelectItem>
                    <SelectItem value="14">14.0hh</SelectItem>
                    <SelectItem value="14.1">14.1hh</SelectItem>
                    <SelectItem value="14.2">14.2hh</SelectItem>
                    <SelectItem value="14.3">14.3hh</SelectItem>
                    <SelectItem value="15">15.0hh</SelectItem>
                    <SelectItem value="15.1">15.1hh</SelectItem>
                    <SelectItem value="15.2">15.2hh</SelectItem>
                    <SelectItem value="15.3">15.3hh</SelectItem>
                    <SelectItem value="16">16.0hh</SelectItem>
                    <SelectItem value="16.1">16.1hh</SelectItem>
                    <SelectItem value="16.2">16.2hh</SelectItem>
                    <SelectItem value="16.3">16.3hh</SelectItem>
                    <SelectItem value="17">17.0hh</SelectItem>
                    <SelectItem value="17.1">17.1hh</SelectItem>
                    <SelectItem value="17.2">17.2hh</SelectItem>
                    <SelectItem value="17.3">17.3hh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Select 
                  value={filters.height_max?.toString() || "999"} 
                  onValueChange={(value) => handleChange('height_max', parseFloat(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="No Max" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="999">No Max</SelectItem>
                    <SelectItem value="14">14.0hh</SelectItem>
                    <SelectItem value="14.1">14.1hh</SelectItem>
                    <SelectItem value="14.2">14.2hh</SelectItem>
                    <SelectItem value="14.3">14.3hh</SelectItem>
                    <SelectItem value="15">15.0hh</SelectItem>
                    <SelectItem value="15.1">15.1hh</SelectItem>
                    <SelectItem value="15.2">15.2hh</SelectItem>
                    <SelectItem value="15.3">15.3hh</SelectItem>
                    <SelectItem value="16">16.0hh</SelectItem>
                    <SelectItem value="16.1">16.1hh</SelectItem>
                    <SelectItem value="16.2">16.2hh</SelectItem>
                    <SelectItem value="16.3">16.3hh</SelectItem>
                    <SelectItem value="17">17.0hh</SelectItem>
                    <SelectItem value="17.1">17.1hh</SelectItem>
                    <SelectItem value="17.2">17.2hh</SelectItem>
                    <SelectItem value="17.3">17.3hh</SelectItem>
                    <SelectItem value="18">18.0hh+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
            id="apply-filters-button-mobile"
            className="flex-1"
            onClick={handleApply}
          >
            Apply Filters ({horseCount || 0})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterPanel;