import { useState } from "react";
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
    onLike(currentHorse.id);
    goToNextHorse();
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

      {/* Horse card with navigation buttons */}
      <div className="relative mb-4">
        <HorseCard 
          horse={currentHorse} 
          onShowMore={onShowMore} 
          onLike={onLike}
          showFavoriteButton={true}
        />
        
        {/* Navigation buttons */}
        {localIndex > 0 && (
          <Button 
            variant="secondary" 
            size="icon" 
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md z-20"
            onClick={goToPrevHorse}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        
        {localIndex < horses.length - 1 && (
          <Button 
            variant="secondary" 
            size="icon" 
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md z-20"
            onClick={goToNextHorse}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-5">
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
          className="info-button w-12 h-12 rounded-full"
          onClick={() => onShowMore(currentHorse.id)}
        >
          <Info className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="like-button w-14 h-14 rounded-full"
          onClick={handleButtonLike}
          style={{ backgroundColor: "#cdac6e", borderColor: "#cdac6e" }}
        >
          <Heart className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default SwipeSection;
