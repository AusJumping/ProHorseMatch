import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Loader2 } from "lucide-react";
import { Horse } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import MediaCarousel from "@/components/MediaCarousel";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useState, useEffect } from "react";

interface HorseCardProps {
  horse: Horse;
  onShowMore: (horseId: number) => void;
}

const HorseCard = ({ horse, onShowMore }: HorseCardProps) => {
  const isMobile = useMobile();
  const { currentCurrency, convertPrice, formatPrice, isLoading } = useCurrency();
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  
  // Convert price when currency or horse changes
  useEffect(() => {
    async function doConversion() {
      if (horse.price) {
        const converted = await convertPrice(horse.price, horse.currency);
        setConvertedPrice(converted);
      }
    }
    
    doConversion();
  }, [horse, currentCurrency, convertPrice]);

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
    <Card className="horse-card bg-white overflow-hidden shadow-md relative cursor-grab active:cursor-grabbing h-full">
      {/* Media Section - Using MediaCarousel component with 16:9 aspect ratio */}
      <div className="relative w-full aspect-[16/9]">
        <MediaCarousel 
          media={horse.photos || []} 
          videos={horse.videos || []} 
        />
      </div>

      {/* Horse Info Section */}
      <CardContent className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <h2 className="font-accent font-bold text-xl mb-1">{horse.name}</h2>
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
                {horse.levels && horse.levels.length > 0 
                  ? (horse.levels.length > 1 
                    ? `${horse.levels[0]} +${horse.levels.length-1}` 
                    : horse.levels[0])
                  : 'N/A'}
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

        {/* Price Badge */}
        <div className="text-left mb-2">
          <span className="bg-primary text-white font-accent font-semibold text-sm px-3 py-1 rounded-full inline-block min-w-20">
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                <span>Converting...</span>
              </div>
            ) : convertedPrice !== null ? (
              formatPrice(convertedPrice)
            ) : (
              `${horse.currency} ${horse.price.toLocaleString()}`
            )}
            {!isLoading && convertedPrice !== null && currentCurrency !== horse.currency && (
              <span className="text-xs opacity-70 ml-1">
                (orig. {horse.currency})
              </span>
            )}
          </span>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
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
