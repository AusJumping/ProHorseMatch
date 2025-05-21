import React, { useState, useEffect } from "react";
import HorseCard from "./HorseCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Heart, X, Info } from "lucide-react";
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
  // Instead of maintaining our own state, directly use the activeIndex
  // This ensures we're always in sync with the parent component
  const [localIndex, setLocalIndex] = useState(0);
  
  // Critical: Update our local index when either the activeIndex changes OR the horses array changes
  // This ensures we always show the correct horse after filtering
  useEffect(() => {
    console.log("SwipeSection: Horses or activeIndex changed, resetting to first horse", { 
      horseCount: horses.length,
      activeIndex
    });
    setLocalIndex(0);
  }, [horses, activeIndex]);
  
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

  // Modified to handle like without advancing immediately
  // This allows the parent component to properly handle authentication
  const handleButtonLike = () => {
    onLike(currentHorse.id);
    // Note: we'll let the parent component handle moving to next horse
    // This prevents issues with authentication
  };

  const handleButtonDislike = () => {
    onDislike(currentHorse.id);
    goToNextHorse();
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <Skeleton className="horse-card rounded-xl" />
        <div className="flex justify-center mt-4 gap-4">
          <Skeleton className="w-14 h-14 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="w-14 h-14 rounded-full" />
        </div>
      </div>
    );
  }

  if (!horses.length) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center h-[500px] bg-white rounded-xl p-8 text-center">
        <h3 className="text-xl font-display font-bold mb-4">No horses in database</h3>
        <p className="text-neutral-600 mb-6">
          There are currently no horses in the database. Add some horses to get started.
        </p>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  if (localIndex >= horses.length) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center h-[500px] bg-white rounded-xl p-8 text-center">
        <h3 className="text-xl font-display font-bold mb-4">No more horses</h3>
        <p className="text-neutral-600 mb-6">
          You've seen all the horses matching your criteria
        </p>
        <Button onClick={() => setLocalIndex(0)}>Start Over</Button>
      </div>
    );
  }

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
          onClick={() => onShowMore(currentHorse.id)}
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
