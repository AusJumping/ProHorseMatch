import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import SwipeSection from "@/components/SwipeSection";
import FilterPanel from "@/components/FilterPanel";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Horse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";

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
}

export default function Home() {
  const isMobile = useMobile();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Filter>({
    disciplines: ["Jumping"],
    breeds: ["Hanoverian"],
    sexes: ["Gelding"],
    location_country: null,
    location_radius_km: null,
    age_min: null,
    age_max: null,
    height_min: null,
    height_max: null,
    price_min: null,
    price_max: null,
  });

  const [swipingIndex, setSwipingIndex] = useState(0);

  // Query for horses
  const { data: horses, isLoading, isError } = useQuery<Horse[]>({
    queryKey: ['/api/horses'],
  });

  const handleLike = async (horseId: number) => {
    try {
      if (!horseId) return;
      
      await apiRequest('POST', '/api/matches', {
        customer_id: 1, // In a real app, this would be the logged-in user ID
        horse_id: horseId,
        is_liked: true
      });
      
      toast({
        title: "Horse Liked!",
        description: "This horse has been added to your favorites.",
      });
      
      setSwipingIndex(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like horse. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDislike = async (horseId: number) => {
    try {
      if (!horseId) return;
      
      await apiRequest('POST', '/api/matches', {
        customer_id: 1, // In a real app, this would be the logged-in user ID
        horse_id: horseId,
        is_liked: false
      });
      
      setSwipingIndex(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dislike horse. Please try again.",
        variant: "destructive",
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
    setActiveFilters(newFilters);
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

  return (
    <Layout pageTitle="Discover Horses" showFilterButton onFilterClick={toggleFilterPanel}>
      <div className="flex w-full h-full">
        {/* Filter sidebar - desktop only */}
        {!isMobile && (
          <div className="w-72 bg-white rounded-xl p-5 shadow-sm h-fit mr-6">
            <FilterPanel 
              isOpen={true} 
              onClose={() => {}} 
              activeFilters={activeFilters}
              onApplyFilters={handleApplyFilters}
            />
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center">
          {/* Filter pills */}
          {renderFilterPills()}

          {/* Horse swiping area */}
          <SwipeSection 
            horses={horses || []}
            isLoading={isLoading}
            activeIndex={swipingIndex}
            onLike={handleLike}
            onDislike={handleDislike}
            onShowMore={handleShowMore}
          />
        </div>

        {/* Right sidebar - recently viewed (desktop only) */}
        {!isMobile && (
          <div className="w-72 bg-white rounded-xl p-5 shadow-sm h-fit ml-6">
            <h3 className="font-display font-bold text-lg mb-4">Recently Viewed</h3>
            
            <div className="space-y-4">
              {horses?.slice(0, 3).map((horse) => (
                <div key={horse.id} className="flex gap-3">
                  <img 
                    src={horse.photos[0]} 
                    alt={`${horse.name}'s portrait`} 
                    className="w-16 h-16 object-cover rounded-lg" 
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{horse.name}</h4>
                    <p className="text-xs text-neutral-700">
                      {horse.age}yo • {horse.breeds[0]} • {horse.sex}
                    </p>
                    <p className="text-sm font-accent font-semibold text-primary mt-1">
                      {horse.currency} {horse.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile filter panel */}
        {isMobile && (
          <FilterPanel 
            isOpen={isFilterOpen} 
            onClose={() => setIsFilterOpen(false)} 
            activeFilters={activeFilters}
            onApplyFilters={handleApplyFilters}
          />
        )}
      </div>
    </Layout>
  );
}
