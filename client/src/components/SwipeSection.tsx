import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import HorseCard from "./HorseCard";
import { Button } from "@/components/ui/button";
import { Heart, X, Info } from "lucide-react";
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
  const [exitX, setExitX] = useState<number | null>(null);
  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-200, 0, 200], [-10, 0, 10]);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentHorse = horses[activeIndex];

  useEffect(() => {
    setExitX(null);
  }, [activeIndex]);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) {
      setExitX(200);
      onLike(currentHorse.id);
    } else if (info.offset.x < -100) {
      setExitX(-200);
      onDislike(currentHorse.id);
    }
  };

  const handleButtonLike = () => {
    setExitX(200);
    onLike(currentHorse.id);
  };

  const handleButtonDislike = () => {
    setExitX(-200);
    onDislike(currentHorse.id);
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
            ref={cardRef}
            key={currentHorse.id}
            style={{
              x: dragX,
              rotate: rotate,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={exitX !== null ? { x: exitX } : undefined}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="absolute top-0 left-0 right-0 z-10"
          >
            <HorseCard horse={currentHorse} onShowMore={onShowMore} />
          </motion.div>
        </AnimatePresence>

        {/* Backup card (shows the next horse) */}
        {horses[activeIndex + 1] && (
          <div className="absolute top-0 left-0 right-0 z-0">
            <HorseCard horse={horses[activeIndex + 1]} onShowMore={onShowMore} />
          </div>
        )}
      </div>

      {/* Swipe Buttons */}
      <div className="swipe-buttons flex justify-center gap-4 mt-5">
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
          className="bg-white text-black border-gray-300 w-12 h-12 rounded-full"
          onClick={() => onShowMore(currentHorse.id)}
        >
          <Info className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="like-button w-14 h-14 rounded-full"
          onClick={handleButtonLike}
        >
          <Heart className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default SwipeSection;
