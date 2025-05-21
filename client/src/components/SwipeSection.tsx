import { useState, useEffect } from "react";
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
  const [localIndex, setLocalIndex] = useState(activeIndex);
  
  // Simple effect to reset index when horses array changes
  useEffect(() => {
    // Reset to first horse when filters change
    setLocalIndex(0);
  }, [horses.length]);
  
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

  // Always show loading animation whether we're fetching or have no results
  if (isLoading || !horses.length) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-xl p-8 text-center">
          {/* Always show enhanced animated loading experience */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-ping w-16 h-16 rounded-full bg-[#cdac6e] opacity-30"></div>
              </div>
              <div className="relative animate-spin w-16 h-16 border-4 border-[#cdac6e] border-t-transparent rounded-full"></div>
            </div>
          </div>
          <h3 className="text-xl font-display font-bold mb-4">Searching for Horses</h3>
          <div className="flex flex-col gap-2">
            <p className="text-neutral-600">
              Finding the perfect matches for you...
            </p>
            <div className="flex justify-center items-center gap-1 mt-1">
              <span className="animate-bounce delay-0 w-2 h-2 bg-[#cdac6e] rounded-full"></span>
              <span className="animate-bounce delay-150 w-2 h-2 bg-[#cdac6e] rounded-full" style={{animationDelay: '0.15s'}}></span>
              <span className="animate-bounce delay-300 w-2 h-2 bg-[#cdac6e] rounded-full" style={{animationDelay: '0.3s'}}></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // End of horses message
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
