import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HorseCard from "./HorseCard";
import { Button } from "@/components/ui/button";
import { Heart, X, Info, ArrowRight, Star, Bookmark, ThumbsUp } from "lucide-react";
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
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [showFavoriteOverlay, setShowFavoriteOverlay] = useState(false);
  const currentHorse = horses[activeIndex];

  // Reset animations when the active index changes
  useEffect(() => {
    setCurrentAnimation(null);
    setShowFavoriteOverlay(false);
  }, [activeIndex]);

  const handleButtonLike = () => {
    // Show the overlay with animation
    setShowFavoriteOverlay(true);
    setCurrentAnimation('favorite');
    
    // Set a timeout to move to the next horse
    setTimeout(() => {
      onLike(currentHorse.id);
      setShowFavoriteOverlay(false);
    }, 800);
  };

  const handleButtonDislike = () => {
    setCurrentAnimation('pass');
    // Move to next horse after brief animation
    setTimeout(() => {
      onDislike(currentHorse.id);
    }, 400);
  };

  const handleNextHorse = () => {
    setCurrentAnimation('next');
    // Move to next horse after brief animation
    setTimeout(() => {
      onDislike(currentHorse.id);
    }, 400);
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

  if (activeIndex >= horses.length) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center h-[500px] bg-white rounded-xl p-8 text-center">
        <h3 className="text-xl font-display font-bold mb-4">No more horses</h3>
        <p className="text-neutral-600 mb-6">
          You've seen all the horses matching your criteria
        </p>
        <Button onClick={() => window.location.reload()}>Start Over</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="relative">
        <AnimatePresence>
          <motion.div
            key={currentHorse.id}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ 
              opacity: currentAnimation === 'pass' || currentAnimation === 'next' ? 0 : 1,
              scale: currentAnimation === 'pass' ? 0.8 : 1,
              x: currentAnimation === 'next' ? 300 : 0
            }}
            transition={{ duration: 0.4 }}
            className="relative z-10"
          >
            <HorseCard horse={currentHorse} onShowMore={onShowMore} />
            
            {/* Favorite overlay */}
            {showFavoriteOverlay && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-xl z-20">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart className="text-white w-20 h-20" />
                  <p className="text-white text-xl font-bold mt-4 text-center">Added to Favorites!</p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Backup card (shows the next horse) */}
        {horses[activeIndex + 1] && (
          <div className="absolute top-0 left-0 right-0 z-0">
            <HorseCard horse={horses[activeIndex + 1]} onShowMore={onShowMore} />
          </div>
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
          style={{ backgroundColor: "#e74c3c", borderColor: "#e74c3c" }}
        >
          <Heart className="h-6 w-6" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="next-button w-12 h-12 rounded-full"
          onClick={handleNextHorse}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default SwipeSection;
