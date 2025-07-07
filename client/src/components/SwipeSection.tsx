import React, { useState, useEffect } from "react";
import HorseCard from "./HorseCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Horse } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SwipeSectionProps {
  horses: Horse[];
  isLoading: boolean;
  activeIndex: number;
  onShowMore: (horseId: number) => void;
  onLike: (horseId: number) => void;
}

const SwipeSection = ({
  horses,
  isLoading,
  activeIndex,
  onShowMore,
  onLike,
}: SwipeSectionProps) => {
  const isMobile = useMobile();
  // Always track the current index for proper navigation
  const [localIndex, setLocalIndex] = useState(0);
  
  // Reset index when horses array changes + do thorough debugging
  useEffect(() => {
    // Detailed debugging for mobile filter issues
    console.log("SwipeSection: HORSES CHANGED");
    console.log("Number of horses:", horses.length);
    
    // Examine each horse's discipline data
    horses.forEach(horse => {
      console.log(`Horse: ${horse.name} (ID: ${horse.id})`);
      console.log(`- Disciplines: ${JSON.stringify(horse.disciplines || "NONE")}`);
      console.log(`- Type of disciplines: ${typeof horse.disciplines}`);
      console.log(`- Is array: ${Array.isArray(horse.disciplines)}`);
      
      // For debugging - try to directly access discipline data
      if (horse.disciplines && Array.isArray(horse.disciplines)) {
        console.log(`- First discipline: ${horse.disciplines[0]}`);
      }
    });
    
    // Reset to first horse
    setLocalIndex(0);
  }, [horses]);
  
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



  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <Skeleton className="horse-card rounded-xl" />
        <div className="flex justify-center mt-4 gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
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
        
        {/* Add to Favourites button */}
        <Button
          size="sm"
          className="like-button bg-[#cdac6e] hover:bg-[#b8965c] text-white border-[#cdac6e]"
          onClick={() => onLike(currentHorse.id)}
        >
          <Heart className="h-4 w-4 mr-1" />
          Add to Favourites
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
