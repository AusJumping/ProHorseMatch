import React, { useState, useEffect } from "react";
import HorseCard from "./HorseCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  onIndexChange?: (index: number) => void;
}

const SwipeSection = ({
  horses,
  isLoading,
  activeIndex,
  onShowMore,
  onLike,
  onIndexChange,
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
    // Notify parent of the reset
    if (onIndexChange) {
      onIndexChange(0);
    }
  }, [horses, onIndexChange]);

  // Update parent when localIndex changes
  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(localIndex);
    }
  }, [localIndex, onIndexChange]);
  
  const currentHorse = horses[localIndex];

  const goToNextHorse = () => {
    console.log("goToNextHorse called - current localIndex:", localIndex, "horses.length:", horses.length);
    if (localIndex < horses.length - 1) {
      console.log("Moving to next horse:", localIndex + 1);
      setLocalIndex(localIndex + 1);
    } else {
      console.log("Already at last horse, can't go next");
    }
  };

  const goToPrevHorse = () => {
    console.log("goToPrevHorse called - current localIndex:", localIndex);
    if (localIndex > 0) {
      console.log("Moving to previous horse:", localIndex - 1);
      setLocalIndex(localIndex - 1);
    } else {
      console.log("Already at first horse, can't go previous");
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
      {/* Horse card */}
      <div className="relative mb-4">
        <HorseCard 
          horse={currentHorse} 
          onShowMore={onShowMore} 
          onLike={onLike}
        />
      </div>

      {/* Action Buttons with navigation */}
      <div className="flex items-center justify-center gap-4 mt-5">
        {/* Left navigation button - always show but styled as disabled when at first horse */}
        <Button 
          variant="secondary" 
          className={cn(
            "z-20 transition-all duration-200",
            localIndex === 0 
              ? "cursor-not-allowed opacity-50" 
              : "hover:scale-105 active:scale-95",
            isMobile 
              ? "text-white px-6 py-3 rounded-lg font-medium shadow-lg" 
              : "rounded-full bg-white hover:bg-white/90 shadow-xl border-2 border-gray-300 w-10 h-10"
          )}
          style={isMobile ? { backgroundColor: '#cdac6e' } : undefined}
          onClick={(e) => {
            console.log("Previous button clicked - localIndex:", localIndex);
            e.preventDefault();
            e.stopPropagation();
            if (localIndex > 0) {
              console.log("Calling goToPrevHorse");
              goToPrevHorse();
            } else {
              console.log("Previous button disabled - at first horse");
            }
          }}
        >
          {isMobile ? (
            "Previous"
          ) : (
            <ChevronLeft className="h-6 w-6 text-black font-bold" />
          )}
        </Button>
        
        {/* Right navigation button - always show but styled as disabled when at last horse */}
        <Button 
          variant="secondary" 
          className={cn(
            "z-20 transition-all duration-200",
            localIndex >= horses.length - 1 
              ? "cursor-not-allowed opacity-50" 
              : "hover:scale-105 active:scale-95",
            isMobile 
              ? "text-white px-6 py-3 rounded-lg font-medium shadow-lg" 
              : "rounded-full bg-white hover:bg-white/90 shadow-xl border-2 border-gray-300 w-10 h-10"
          )}
          style={isMobile ? { backgroundColor: '#cdac6e' } : undefined}
          onClick={(e) => {
            console.log("Next button clicked - localIndex:", localIndex, "horses.length:", horses.length);
            e.preventDefault();
            e.stopPropagation();
            if (localIndex < horses.length - 1) {
              console.log("Calling goToNextHorse");
              goToNextHorse();
            } else {
              console.log("Next button disabled - at last horse");
            }
          }}
        >
          {isMobile ? (
            "Next"
          ) : (
            <ChevronRight className="h-6 w-6 text-black font-bold" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default SwipeSection;
