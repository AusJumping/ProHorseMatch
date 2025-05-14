import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Info, Share2 } from "lucide-react";
import { Horse } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";

interface HorseCardProps {
  horse: Horse;
  onShowMore: (horseId: number) => void;
}

const HorseCard = ({ horse, onShowMore }: HorseCardProps) => {
  const isMobile = useMobile();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex < horse.photos.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      setCurrentImageIndex(0);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else {
      setCurrentImageIndex(horse.photos.length - 1);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implement share functionality
    if (navigator.share) {
      navigator
        .share({
          title: `${horse.name} - ProHorseMatch`,
          text: `Check out ${horse.name}, a ${horse.age}yo ${horse.breeds[0]} ${horse.sex} for sale on ProHorseMatch!`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <Card className="horse-card bg-white overflow-hidden shadow-md relative cursor-grab active:cursor-grabbing">
      {/* Media Section */}
      <div className="relative h-3/5">
        <img
          src={horse.photos[currentImageIndex]}
          alt={`${horse.name}`}
          className="w-full h-full object-cover"
        />

        {/* Carousel Navigation */}
        {!isMobile && (
          <div className="absolute top-1/2 transform -translate-y-1/2 flex justify-between w-full px-4">
            <Button
              size="icon"
              variant="ghost"
              className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full w-8 h-8"
              onClick={prevImage}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full w-8 h-8"
              onClick={nextImage}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
          {horse.photos.map((_, index) => (
            <div
              key={index}
              className={`carousel-dot bg-white rounded-full w-2 h-2 opacity-70 ${
                index === currentImageIndex ? "active w-2.5 h-2.5 opacity-100" : ""
              }`}
            />
          ))}
        </div>

        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-primary text-white font-accent font-semibold text-sm px-3 py-1 rounded-full">
          {horse.currency} {horse.price.toLocaleString()}
        </div>
      </div>

      {/* Horse Info Section */}
      <CardContent className="p-4 h-2/5 flex flex-col justify-between">
        <div>
          <h2 className="font-display font-bold text-xl mb-1">{horse.name}</h2>
          <p className="text-neutral-800 text-sm mb-3">
            {horse.age}yo {horse.breeds[0]} {horse.sex} • {horse.height_hands} hands
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-3 text-center py-2 border-y border-neutral-200 mb-2">
            <div className="profile-stats-item">
              <p className="font-accent font-semibold text-primary text-sm">
                {horse.disciplines[0]}
              </p>
              <p className="text-xs text-neutral-800">Discipline</p>
            </div>
            <div className="profile-stats-item">
              <p className="font-accent font-semibold text-primary text-sm">
                {horse.levels[0]}
              </p>
              <p className="text-xs text-neutral-800">Level</p>
            </div>
            <div className="profile-stats-item">
              <p className="font-accent font-semibold text-primary text-sm">
                {horse.location_country}
              </p>
              <p className="text-xs text-neutral-800">Location</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-auto">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-accent font-semibold"
            onClick={() => onShowMore(horse.id)}
          >
            {isMobile ? "More Info" : "View Full Profile"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
            onClick={handleShare}
          >
            <Share2 size={18} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HorseCard;
