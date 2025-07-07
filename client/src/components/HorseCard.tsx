import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Heart, X } from "lucide-react";
import { Horse } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import MediaCarousel from "@/components/MediaCarousel";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useState, useEffect } from "react";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

interface HorseCardProps {
  horse: Horse;
  onShowMore: (horseId: number) => void;
  onLike?: (horseId: number) => void;
  showFavoriteButton?: boolean;
  matchStatus?: { is_liked?: boolean } | null; // Optional prop to pass in match status directly
}

const HorseCard = ({ horse, onShowMore, onLike, showFavoriteButton = false, matchStatus }: HorseCardProps) => {
  const isMobile = useMobile();
  const isTouchDevice = useIsTouchDevice();
  const { user, isAuthenticated } = useAuth();
  const { currentCurrency, convertPrice, formatPrice, isLoading: currencyLoading } = useCurrency();
  const [convertedMinPrice, setConvertedMinPrice] = useState<number | null>(null);
  const [convertedMaxPrice, setConvertedMaxPrice] = useState<number | null>(null);
  
  // Fetch match status if not directly provided
  const { data: matches = [] } = useQuery({
    queryKey: ['/api/matches'],
    enabled: isAuthenticated && !matchStatus, // Only fetch if we're authenticated and don't have status passed in
  });
  
  // Determine if this horse has been liked or dismissed
  const matchInfo = matchStatus || (Array.isArray(matches) ? 
    matches.find((match: any) => match.horse_id === horse.id) : 
    null
  );
  const hasBeenLiked = matchInfo?.is_liked === true;
  const hasBeenDismissed = matchInfo?.is_liked === false;
  
  // Convert price range when currency or horse changes
  useEffect(() => {
    async function doConversion() {
      if (horse.price_min) {
        const convertedMin = await convertPrice(horse.price_min, horse.currency);
        setConvertedMinPrice(convertedMin);
      }
      
      if (horse.price_max) {
        const convertedMax = await convertPrice(horse.price_max, horse.currency);
        setConvertedMaxPrice(convertedMax);
      }
    }
    
    doConversion();
  }, [horse, currentCurrency, convertPrice]);


  
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent any default behavior
    
    // First try to get a current user from localStorage if React Query hasn't loaded it yet
    // This helps with mobile browsers that might have session issues
    let isUserAuthenticated = isAuthenticated;
    if (!isUserAuthenticated) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          console.log("Using cached user from localStorage for like button:", user);
          isUserAuthenticated = true;
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
    
    // Check if user is authenticated before proceeding
    if (!isUserAuthenticated) {
      // User might need to log in first - display message via parent handler
      if (onLike) {
        onLike(horse.id);
      }
      return;
    }
    
    // User is authenticated, proceed with like operation
    if (onLike) {
      onLike(horse.id);
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
        
        {/* Semi-transparent overlay for liked/dismissed horses - For mobile only and NOT in the SwipeSection */}
        {isMobile && (hasBeenLiked || hasBeenDismissed) && !showFavoriteButton && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            {hasBeenLiked && (
              <div className="bg-white/80 w-16 h-16 rounded-full flex items-center justify-center">
                <Heart className="h-10 w-10 text-[#cdac6e] fill-[#cdac6e]" />
              </div>
            )}
            {hasBeenDismissed && (
              <div className="bg-white/80 w-16 h-16 rounded-full flex items-center justify-center">
                <X className="h-10 w-10 text-black" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Horse Info Section */}
      <CardContent className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <h2 className="font-accent font-bold text-xl mb-1">{horse.name}</h2>
          <p className="text-neutral-800 text-sm mb-1">
            {horse.age}yo {horse.breeds[0]} {horse.sex}
          </p>
          <p className="text-neutral-800 text-sm mb-3">
            {horse.sire && horse.dam_sire ? `${horse.sire} x ${horse.dam_sire}` : "Breeding not specified"}
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

        {/* Price Range Badge - Hidden on mobile */}
        {!isMobile && (
          <div className="text-left mb-2">
            <span className="bg-primary text-white font-accent font-semibold text-sm px-3 py-1 rounded-full inline-block min-w-20">
              {currencyLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  <span>Converting...</span>
                </div>
              ) : convertedMinPrice !== null && convertedMaxPrice !== null ? (
                formatPrice(convertedMinPrice) + " - " + formatPrice(convertedMaxPrice)
              ) : (
                `${horse.currency} ${horse.price_min?.toLocaleString()} - ${horse.price_max?.toLocaleString()}`
              )}
              {!currencyLoading && convertedMinPrice !== null && currentCurrency !== horse.currency && (
                <span className="text-xs opacity-70 ml-1">
                  (orig. {horse.currency})
                </span>
              )}
            </span>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-accent font-semibold"
            onClick={() => onShowMore(horse.id)}
          >
            {isMobile ? "More Info" : "View Full Profile"}
          </Button>
          
          {/* Like button - show when onLike prop is provided */}
          {onLike && (
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 flex items-center justify-center like-button bg-[#cdac6e] hover:bg-[#b8965c] border-[#cdac6e]"
              onClick={handleLike}
            >
              <Heart size={18} className="text-white" fill="white" />
            </Button>
          )}
          

        </div>
      </CardContent>
    </Card>
  );
};

export default HorseCard;
