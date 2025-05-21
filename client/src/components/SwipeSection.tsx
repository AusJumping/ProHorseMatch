import { useState, useEffect } from "react";
import HorseCard from "./HorseCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Heart, X, Info, Loader2 } from "lucide-react";
import { Horse } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface SwipeSectionProps {
  horses: Horse[];
  isLoading: boolean;
  activeIndex: number;
  onLike: (horseId: number) => void;
  onDislike: (horseId: number) => void;
  onShowMore: (horseId: number) => void;
}

const SwipeSection = ({
  horses,
  isLoading,
  activeIndex,
  onLike,
  onDislike,
  onShowMore,
}: SwipeSectionProps) => {
  const [localIndex, setLocalIndex] = useState(activeIndex);
  const [previousHorseCount, setPreviousHorseCount] = useState(horses.length);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [loadingDelay, setLoadingDelay] = useState(true);
  
  // Immediately detect when horses array changes
  useEffect(() => {
    // If horse count changes, this is a filter change
    if (horses.length !== previousHorseCount) {
      // Reset index to beginning when filters change
      setLocalIndex(0);
      setPreviousHorseCount(horses.length);
      
      // Always hide empty state during transitions
      setShowEmptyState(false);
      
      // Show loading for at least 1 second during filter transitions
      setLoadingDelay(true);
      const timer = setTimeout(() => {
        setLoadingDelay(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [horses.length, previousHorseCount]);
  
  // Control when to show empty state
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (!isLoading && !loadingDelay && horses.length === 0) {
      // Delay showing empty state to prevent flash
      timer = setTimeout(() => {
        setShowEmptyState(true);
      }, 1000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, loadingDelay, horses.length]);
  
  const currentHorse = horses[localIndex];

  const goToNextHorse = () => {
    if (localIndex < horses.length - 1) {
      setLocalIndex(localIndex + 1);
    }
  };

  const goToPrevHorse = () => {
    if (localIndex > 0) {
      setLocalIndex(localIndex - 1);
    }
  };

  // Handle like without advancing immediately
  const handleButtonLike = () => {
    if (currentHorse) {
      onLike(currentHorse.id);
    }
  };

  const handleButtonDislike = () => {
    if (currentHorse) {
      onDislike(currentHorse.id);
      goToNextHorse();
    }
  };

  // Show skeleton loading state
  if (isLoading || loadingDelay || (!horses.length && !showEmptyState)) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="horse-card rounded-xl h-[450px] bg-white/50 flex flex-col items-center justify-center">
          <Skeleton className="w-full h-full rounded-xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          </div>
        </div>
        <div className="flex justify-center mt-4 gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="w-14 h-14 rounded-full" />
        </div>
      </div>
    );
  }
  
  // Show empty state for no horses
  if (horses.length === 0 && showEmptyState) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center h-[500px] bg-white rounded-xl p-8 text-center">
        <h3 className="text-xl font-accent font-bold mb-4">No horses found</h3>
        <p className="text-neutral-600 mb-6">
          No horses match your current search criteria. Try adjusting your filters.
        </p>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => {
              // Cleanly reset filters
              const url = new URL(window.location.href);
              url.search = ''; // Clear all query parameters
              window.location.href = url.toString();
            }}>
            Reset Filters
          </Button>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    );
  }

  // Show end of horses message
  if (horses.length > 0 && localIndex >= horses.length) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center h-[500px] bg-white rounded-xl p-8 text-center">
        <h3 className="text-xl font-accent font-bold mb-4">No more horses</h3>
        <p className="text-neutral-600 mb-6">
          You've seen all the horses matching your criteria
        </p>
        <Button onClick={() => setLocalIndex(0)}>Start Over</Button>
      </div>
    );
  }

  // Normal display when we have horses to show
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Navigation indicators */}
      <div className="mb-2 text-center text-xs text-gray-500">
        Horse {localIndex + 1} of {horses.length}
      </div>

      {/* Horse card */}
      <div className="relative mb-4">
        <HorseCard 
          horse={currentHorse} 
          onShowMore={onShowMore} 
          onLike={onLike}
          showFavoriteButton={true}
        />
      </div>

      {/* Action Buttons with navigation arrows on sides */}
      <div className="flex items-center justify-center gap-4 mt-5">
        {/* Left navigation arrow */}
        {localIndex > 0 && (
          <Button 
            variant="secondary" 
            size="icon" 
            className="w-10 h-10 rounded-full bg-white hover:bg-white/90 shadow-md z-20"
            onClick={goToPrevHorse}
          >
            <ChevronLeft className="h-6 w-6 text-black" />
          </Button>
        )}
        {/* Spacer when no left arrow */}
        {localIndex === 0 && (
          <div className="w-10"></div>
        )}
        
        {/* Main action buttons */}
        <Button
          size="icon"
          className="pass-button w-14 h-14 rounded-full"
          onClick={handleButtonDislike}
        >
          <X className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="info-button w-14 h-14 rounded-full"
          onClick={() => {
            if (typeof onShowMore === 'function' && currentHorse) {
              onShowMore(currentHorse.id);
            }
          }}
        >
          <Info className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          className="like-button w-14 h-14 rounded-full"
          onClick={handleButtonLike}
          style={{ backgroundColor: "#cdac6e", borderColor: "#cdac6e" }}
        >
          <Heart className="h-6 w-6" />
        </Button>
        
        {/* Right navigation arrow */}
        {localIndex < horses.length - 1 && (
          <Button 
            variant="secondary" 
            size="icon" 
            className="w-10 h-10 rounded-full bg-white hover:bg-white/90 shadow-md z-20"
            onClick={goToNextHorse}
          >
            <ChevronRight className="h-6 w-6 text-black" />
          </Button>
        )}
        {/* Spacer when no right arrow */}
        {localIndex >= horses.length - 1 && (
          <div className="w-10"></div>
        )}
      </div>
    </div>
  );
};

export default SwipeSection;
