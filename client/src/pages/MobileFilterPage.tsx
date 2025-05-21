import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, ChevronLeft, Filter, Check } from "lucide-react";
import MobileNavbar from "@/components/MobileNavbar";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

interface FilterProps {
  initialFilters: any;
  onApplyFilters: (filters: any) => void;
}

export default function MobileFilterPage() {
  // Since this is a standalone page, we'll handle filter state here
  const [isFilterUpdated, setIsFilterUpdated] = useState(false);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { currentCurrency } = useCurrency();
  
  // Initialize with empty filters and set All Disciplines as default
  const [filters, setFilters] = useState({
    disciplines: [], // Empty array = All Disciplines
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
    currency: currentCurrency || "AUD"
  });

  // Add constants for filter options
  const { data: constants } = useQuery({
    queryKey: ['/api/constants'],
  });

  // Effect to load filters from localStorage when the page loads
  useEffect(() => {
    try {
      // Try to get saved filters from localStorage
      const savedFiltersJson = localStorage.getItem('lastAppliedFilters');
      if (savedFiltersJson) {
        const savedFilters = JSON.parse(savedFiltersJson);
        console.log("Loading filters from localStorage:", savedFilters);
        
        // Even if we have saved filters, force disciplines to be empty for "All Disciplines"
        setFilters({
          ...savedFilters,
          disciplines: [] // Always force empty array for "All Disciplines"
        });
      }
    } catch (error) {
      console.error("Error loading filters from localStorage:", error);
    }
  }, []);

  const handleChangeFilter = (key: string, value: any) => {
    setFilters(prev => {
      // Handle special validation for min/max pairs
      if (key === 'price_min' && prev.price_max && value > prev.price_max) {
        return { ...prev, [key]: value, price_max: null };
      }
      if (key === 'price_max' && prev.price_min && value < prev.price_min) {
        return prev;
      }
      
      if (key === 'age_min' && prev.age_max && value > prev.age_max) {
        return { ...prev, [key]: value, age_max: null };
      }
      if (key === 'age_max' && prev.age_min && value < prev.age_min) {
        return prev;
      }
      
      if (key === 'height_min' && prev.height_max && value > prev.height_max) {
        return { ...prev, [key]: value, height_max: null };
      }
      if (key === 'height_max' && prev.height_min && value < prev.height_min) {
        return prev;
      }
      
      return { ...prev, [key]: value };
    });
  };

  const handleApplyFilters = () => {
    // Save filters to localStorage for the home page to use
    try {
      localStorage.setItem('lastAppliedFilters', JSON.stringify(filters));
      localStorage.setItem('filtersTimestamp', Date.now().toString());
    } catch (error) {
      console.error("Error saving filters to localStorage:", error);
    }
    
    // Navigate back to home page
    navigate('/');
    
    toast({
      title: "Filters Applied",
      description: "Your filter preferences have been applied.",
      duration: 800,
    });
  };

  const resetFilters = () => {
    const resetValues = {
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
      currency: currentCurrency || "AUD"
    };
    
    setFilters(resetValues);
    
    toast({
      title: "Filters Reset",
      description: "All filters have been reset to default values.",
      duration: 800,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-accent font-semibold flex-1 text-center">Filters</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="text-xs"
          >
            Reset All
          </Button>
        </div>
      </div>

      {/* Main content - with padding for fixed header and footer */}
      <div className="pt-16 pb-20 px-4">
        <div className="space-y-6">
          {/* Disciplines Section */}
          <div className="filter-section">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Disciplines</Label>
            <Select 
              value={filters.disciplines && filters.disciplines.length > 0 ? filters.disciplines[0] : "all_disciplines"}
              onValueChange={(value) => {
                if (value === "all_disciplines") {
                  handleChangeFilter('disciplines', []);
                } else {
                  handleChangeFilter('disciplines', [value]);
                }
              }}
              defaultValue="all_disciplines"
            >
              <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                <SelectValue placeholder="All Disciplines">
                  {filters.disciplines && filters.disciplines.length > 0 
                    ? filters.disciplines[0] 
                    : "All Disciplines"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_disciplines">All Disciplines</SelectItem>
                {constants?.disciplines?.map((discipline: string) => (
                  <SelectItem key={discipline} value={discipline}>{discipline}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Discipline Levels - Only show if a discipline is selected */}
          {filters.disciplines && filters.disciplines.length > 0 && (
            <div className="filter-section">
              <Label className="block font-accent font-semibold mb-2 text-neutral-800">Level</Label>
              <Select 
                value={filters.levels && filters.levels.length > 0 ? filters.levels[0] : "any_level"}
                onValueChange={(value) => {
                  if (value === "any_level") {
                    handleChangeFilter('levels', []);
                  } else {
                    handleChangeFilter('levels', [value]);
                  }
                }}
              >
                <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                  <SelectValue placeholder="Any Level">
                    {filters.levels && filters.levels.length > 0 
                      ? filters.levels[0] 
                      : "Any Level"}
                  </SelectValue>
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
          
          {/* Price Range */}
          <div className="filter-section">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Price Range ({filters.currency})</Label>
            <div className="flex gap-2">
              <div className="w-1/2">
                <Select
                  value={filters.price_min !== null ? filters.price_min.toString() : "0"}
                  onValueChange={(value) => handleChangeFilter('price_min', parseInt(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="No Min">
                      {filters.price_min !== null 
                        ? new Intl.NumberFormat('en-AU', { style: 'decimal' }).format(filters.price_min)
                        : "No Min"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Min</SelectItem>
                    <SelectItem value="1000">1,000</SelectItem>
                    <SelectItem value="5000">5,000</SelectItem>
                    <SelectItem value="10000">10,000</SelectItem>
                    <SelectItem value="25000">25,000</SelectItem>
                    <SelectItem value="50000">50,000</SelectItem>
                    <SelectItem value="100000">100,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-center flex items-center">
                <span className="text-neutral-400">to</span>
              </div>
              <div className="w-1/2">
                <Select
                  value={filters.price_max !== null ? filters.price_max.toString() : "999999999"}
                  onValueChange={(value) => handleChangeFilter('price_max', parseInt(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="No Max">
                      {filters.price_max !== null && filters.price_max < 999999999
                        ? new Intl.NumberFormat('en-AU', { style: 'decimal' }).format(filters.price_max)
                        : "No Max"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="999999999">No Max</SelectItem>
                    <SelectItem value="10000">10,000</SelectItem>
                    <SelectItem value="25000">25,000</SelectItem>
                    <SelectItem value="50000">50,000</SelectItem>
                    <SelectItem value="100000">100,000</SelectItem>
                    <SelectItem value="250000">250,000</SelectItem>
                    <SelectItem value="500000">500,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Age Range */}
          <div className="filter-section">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Age (years)</Label>
            <div className="flex gap-2">
              <div className="w-1/2">
                <Select
                  value={filters.age_min !== null ? filters.age_min.toString() : "0"}
                  onValueChange={(value) => handleChangeFilter('age_min', parseInt(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="No Min">
                      {filters.age_min !== null && filters.age_min > 0
                        ? `${filters.age_min}yo`
                        : "No Min"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Min</SelectItem>
                    <SelectItem value="3">3yo</SelectItem>
                    <SelectItem value="4">4yo</SelectItem>
                    <SelectItem value="5">5yo</SelectItem>
                    <SelectItem value="6">6yo</SelectItem>
                    <SelectItem value="8">8yo</SelectItem>
                    <SelectItem value="10">10yo</SelectItem>
                    <SelectItem value="12">12yo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-center flex items-center">
                <span className="text-neutral-400">to</span>
              </div>
              <div className="w-1/2">
                <Select
                  value={filters.age_max !== null ? filters.age_max.toString() : "999"}
                  onValueChange={(value) => handleChangeFilter('age_max', parseInt(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="No Max">
                      {filters.age_max !== null && filters.age_max < 100
                        ? `${filters.age_max}yo`
                        : "No Max"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="999">No Max</SelectItem>
                    <SelectItem value="6">6yo</SelectItem>
                    <SelectItem value="8">8yo</SelectItem>
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
          <div className="filter-section">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Height (hands)</Label>
            <div className="flex gap-2">
              <div className="w-1/2">
                <Select
                  value={filters.height_min !== null ? filters.height_min.toString() : "0"}
                  onValueChange={(value) => handleChangeFilter('height_min', parseFloat(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="No Min">
                      {filters.height_min !== null && filters.height_min > 0
                        ? `${filters.height_min}hh`
                        : "No Min"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Min</SelectItem>
                    <SelectItem value="14">14.0hh</SelectItem>
                    <SelectItem value="14.2">14.2hh</SelectItem>
                    <SelectItem value="15">15.0hh</SelectItem>
                    <SelectItem value="15.2">15.2hh</SelectItem>
                    <SelectItem value="16">16.0hh</SelectItem>
                    <SelectItem value="16.2">16.2hh</SelectItem>
                    <SelectItem value="17">17.0hh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-center flex items-center">
                <span className="text-neutral-400">to</span>
              </div>
              <div className="w-1/2">
                <Select
                  value={filters.height_max !== null ? filters.height_max.toString() : "999"}
                  onValueChange={(value) => handleChangeFilter('height_max', parseFloat(value))}
                >
                  <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                    <SelectValue placeholder="No Max">
                      {filters.height_max !== null && filters.height_max < 100
                        ? `${filters.height_max}hh`
                        : "No Max"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="999">No Max</SelectItem>
                    <SelectItem value="15">15.0hh</SelectItem>
                    <SelectItem value="15.2">15.2hh</SelectItem>
                    <SelectItem value="16">16.0hh</SelectItem>
                    <SelectItem value="16.2">16.2hh</SelectItem>
                    <SelectItem value="17">17.0hh</SelectItem>
                    <SelectItem value="17.2">17.2hh</SelectItem>
                    <SelectItem value="18">18.0hh+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Location */}
          <div className="filter-section">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Location</Label>
            <Select
              value={filters.location_country || "any_location"}
              onValueChange={(value) => {
                handleChangeFilter('location_country', value === "any_location" ? null : value);
              }}
            >
              <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                <SelectValue placeholder="Any Location">
                  {filters.location_country || "Any Location"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any_location">Any Location</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="New Zealand">New Zealand</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Breed */}
          <div className="filter-section">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Breed</Label>
            <Select
              value={filters.breeds && filters.breeds.length > 0 ? filters.breeds[0] : "all_breeds"}
              onValueChange={(value) => {
                if (value === "all_breeds") {
                  handleChangeFilter('breeds', []);
                } else {
                  handleChangeFilter('breeds', [value]);
                }
              }}
            >
              <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                <SelectValue placeholder="All Breeds">
                  {filters.breeds && filters.breeds.length > 0 
                    ? filters.breeds[0] 
                    : "All Breeds"}
                </SelectValue>
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
          <div className="filter-section">
            <Label className="block font-accent font-semibold mb-2 text-neutral-800">Sex</Label>
            <Select
              value={filters.sexes && filters.sexes.length > 0 ? filters.sexes[0] : "any_sex"}
              onValueChange={(value) => {
                if (value === "any_sex") {
                  handleChangeFilter('sexes', []);
                } else {
                  handleChangeFilter('sexes', [value]);
                }
              }}
            >
              <SelectTrigger className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
                <SelectValue placeholder="Any Sex">
                  {filters.sexes && filters.sexes.length > 0 
                    ? filters.sexes[0] 
                    : "Any Sex"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any_sex">Any Sex</SelectItem>
                {constants?.sexes?.map((sex: string) => (
                  <SelectItem key={sex} value={sex}>{sex}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Fixed bottom button bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-200">
        <Button
          className="w-full"
          onClick={handleApplyFilters}
        >
          Apply Filters
        </Button>
      </div>
      
      {/* Mobile navbar */}
      <MobileNavbar />
    </div>
  );
}