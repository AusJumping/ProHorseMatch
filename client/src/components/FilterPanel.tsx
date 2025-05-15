import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: any;
  onApplyFilters: (filters: any) => void;
}

// Available filter options (would come from API in a real app)
const countries = [
  "Any Location", "Germany", "Netherlands", "Belgium", "France", 
  "United Kingdom", "United States", "Ireland", "Sweden"
];
const radiusOptions = ["Any", "50km", "100km", "150km", "200km", "300km", "500km"];

const FilterPanel = ({ 
  isOpen, 
  onClose, 
  activeFilters, 
  onApplyFilters 
}: FilterPanelProps) => {
  const isMobile = useMobile();
  const [filters, setFilters] = useState(activeFilters);
  
  // Fetch constants for filter options
  const { data: constants } = useQuery({
    queryKey: ['/api/constants'],
  });

  useEffect(() => {
    setFilters(activeFilters);
  }, [activeFilters]);

  const handleChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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
    onApplyFilters(filters);
  };

  const handleReset = () => {
    setFilters({
      disciplines: [],
      breeds: [],
      sexes: [],
      location_country: null,
      location_radius_km: null,
      age_min: 0,
      age_max: 20,
      height_min: 13,
      height_max: 18,
      price_min: 0,
      price_max: 100000
    });
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
          <h2 className="font-display font-bold text-xl">Filter Horses</h2>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Filter Forms */}
        <div className="space-y-6">
          {/* Disciplines */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Disciplines</Label>
            <Select 
              value={filters.disciplines[0] || ""} 
              onValueChange={(value) => handleChange('disciplines', [value])}
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
          
          {/* Price Range */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Price Range</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Select 
                  value={filters.price_min?.toString() || "0"} 
                  onValueChange={(value) => handleChange('price_min', parseInt(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="Min Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Min</SelectItem>
                    <SelectItem value="5000">€5,000</SelectItem>
                    <SelectItem value="10000">€10,000</SelectItem>
                    <SelectItem value="15000">€15,000</SelectItem>
                    <SelectItem value="25000">€25,000</SelectItem>
                    <SelectItem value="50000">€50,000</SelectItem>
                    <SelectItem value="75000">€75,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select 
                  value={filters.price_max?.toString() || "100000"} 
                  onValueChange={(value) => handleChange('price_max', parseInt(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="Max Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15000">€15,000</SelectItem>
                    <SelectItem value="25000">€25,000</SelectItem>
                    <SelectItem value="50000">€50,000</SelectItem>
                    <SelectItem value="75000">€75,000</SelectItem>
                    <SelectItem value="100000">€100,000</SelectItem>
                    <SelectItem value="150000">€150,000</SelectItem>
                    <SelectItem value="200000">€200,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Age Range */}
          <div className="filter-group">
            <div className="flex justify-between mb-2">
              <Label className="block font-accent font-semibold text-neutral-800">Age Range</Label>
              <span className="text-sm text-primary font-semibold">
                {filters.age_min || '0'} - {filters.age_max || '20+'} years
              </span>
            </div>
            <div className="relative h-6 mb-2">
              <Slider
                value={[
                  filters.age_min || 0,
                  filters.age_max || 20
                ]}
                min={0}
                max={20}
                step={1}
                onValueChange={(value) => {
                  handleChange('age_min', value[0]);
                  handleChange('age_max', value[1]);
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-800">
              <span>0</span>
              <span>20+ years</span>
            </div>
          </div>
          
          {/* Height Range */}
          <div className="filter-group">
            <div className="flex justify-between mb-2">
              <Label className="block font-accent font-semibold text-neutral-800">Height</Label>
              <span className="text-sm text-primary font-semibold">
                {filters.height_min || '13.0'} - {filters.height_max || '18.0'} hands
              </span>
            </div>
            <div className="relative h-6 mb-2">
              <Slider
                value={[
                  filters.height_min || 13.0,
                  filters.height_max || 18.0
                ]}
                min={13.0}
                max={18.0}
                step={0.1}
                onValueChange={(value) => {
                  handleChange('height_min', value[0]);
                  handleChange('height_max', value[1]);
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-800">
              <span>13.0 hh</span>
              <span>18.0 hh</span>
            </div>
          </div>
          
          {/* Breed */}
          <div className="filter-group">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Breed</Label>
            <Select 
              value={filters.breeds[0] || ""} 
              onValueChange={(value) => handleChange('breeds', [value])}
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
              value={filters.sexes[0] || ""} 
              onValueChange={(value) => handleChange('sexes', [value])}
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
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
