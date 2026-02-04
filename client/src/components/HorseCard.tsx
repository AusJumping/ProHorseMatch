import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Heart } from "lucide-react";
import { Horse } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import MediaCarousel from "@/components/MediaCarousel";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useState, useEffect } from "react";
import { useIsTouchDevice } from "@/hooks/useIsTouchDevice";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

interface HorseCardProps {
  horse: Horse;
  onShowMore: (horseId: number) => void;
  onLike?: (horseId: number) => void;
  showFavoriteButton?: boolean;
  matchStatus?: { is_liked?: boolean } | null; // Optional prop to pass in match status directly
  showPriceOnMobile?: boolean; // New prop to control whether to show price on mobile
}

const HorseCard = ({ horse, onShowMore, onLike, showFavoriteButton = false, matchStatus, showPriceOnMobile = false }: HorseCardProps) => {
  const isMobile = useMobile();
  const isTouchDevice = useIsTouchDevice();
  const { user, isAuthenticated } = useAuth();
  const { currentCurrency, convertPrice, formatPrice, isLoading: currencyLoading } = useCurrency();
  const [convertedMinPrice, setConvertedMinPrice] = useState<number | null>(null);
  const [convertedMaxPrice, setConvertedMaxPrice] = useState<number | null>(null);
  
  // Local optimistic state for immediate UI feedback
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  
  // Fetch match status if not directly provided
  const { data: matchesData = [] } = useQuery({
    queryKey: ['/api/matches'],
    enabled: isAuthenticated && !matchStatus, // Only fetch if we're authenticated and don't have status passed in
  });
  
  // Ensure matches is always an array
  const matches = Array.isArray(matchesData) ? matchesData : [];
  
  // Determine if this horse has been liked or dismissed
  const matchInfo = matchStatus || matches.find((match: any) => match.horse_id === horse.id) || null;
  const serverLiked = matchInfo?.is_liked === true;
  const hasBeenDismissed = matchInfo?.is_liked === false;
  
  // Use optimistic state if set, otherwise use server state
  const hasBeenLiked = optimisticLiked !== null ? optimisticLiked : serverLiked;
  
  // Reset optimistic state when server state updates
  useEffect(() => {
    if (optimisticLiked !== null && serverLiked === optimisticLiked) {
      setOptimisticLiked(null);
    }
  }, [serverLiked, optimisticLiked]);
  
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
    let currentUserId: number | null = null;
    if (!isUserAuthenticated) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          console.log("Using cached user from localStorage for like button:", user);
          isUserAuthenticated = true;
          currentUserId = user.id;
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
    
    // Toggle behavior: if already liked, unlike; otherwise like
    const newLikedState = !hasBeenLiked;
    setOptimisticLiked(newLikedState);
    
    // User is authenticated, proceed with like/unlike operation
    if (newLikedState) {
      // Like the horse
      if (onLike) {
        onLike(horse.id);
      }
    } else {
      // Unlike the horse - call API directly
      try {
        const storedUser = localStorage.getItem('user');
        const userId = currentUserId || (storedUser ? JSON.parse(storedUser).id : null);
        if (userId) {
          const authToken = localStorage.getItem('authToken');
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
          }
          
          await fetch('/api/matches', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              customer_id: userId,
              horse_id: horse.id,
              is_liked: false
            }),
            credentials: 'include'
          });
          
          // Invalidate matches cache
          queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
        }
      } catch (error) {
        console.error("Error unliking horse:", error);
        // Revert optimistic update on error
        setOptimisticLiked(true);
      }
    }
  };

  return (
    <Card className="horse-card bg-white overflow-hidden shadow-md relative cursor-grab active:cursor-grabbing h-full">
      {/* Media Section - Using MediaCarousel component with taller ratio on mobile to show more of the photo */}
      <div className="relative w-full aspect-[4/3] md:aspect-[16/9]">
        <MediaCarousel 
          media={horse.photos || []} 
          videos={horse.videos || []} 
        />
        

      </div>

      {/* Horse Info Section */}
      <CardContent className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <h2 className="font-accent font-bold text-xl mb-1">{horse.name}</h2>
          <p className="text-neutral-800 text-sm mb-1">
            {horse.age === 1 ? "Yearling" : `${horse.age}yo`} {horse.breeds[0]} {horse.sex}
          </p>
          
          {/* Lineage Information */}
          <div className="text-neutral-800 text-sm mb-3 space-y-0.5">
            <div>
              <span className="font-medium">Sire:</span> {horse.sire || "Not specified"}
            </div>
            <div>
              <span className="font-medium">Dam:</span> {horse.dam || "Not specified"}
            </div>
            <div>
              <span className="font-medium">Dam Sire:</span> {horse.dam_sire || "Not specified"}
            </div>
          </div>

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

        {/* Price Range Badge - Show on desktop, or on mobile when showPriceOnMobile is true */}
        {(!isMobile || showPriceOnMobile) && (
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
            className="flex-1 bg-black hover:bg-gray-800 text-white font-accent font-semibold"
            onClick={() => onShowMore(horse.id)}
          >
            {isMobile ? "More Info" : "View Full Profile"}
          </Button>
          
          {/* Like button - show when onLike prop is provided */}
          {onLike && (
            <button
              type="button"
              className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${
                hasBeenLiked 
                  ? "bg-white hover:bg-gray-50 border-2 border-[#cdac6e]" 
                  : "bg-[#cdac6e] hover:bg-[#b8965c] border-2 border-[#cdac6e]"
              }`}
              onClick={handleLike}
            >
              <Heart 
                size={18} 
                stroke={hasBeenLiked ? "#cdac6e" : "white"}
                strokeWidth={2}
                fill={hasBeenLiked ? "#cdac6e" : "white"} 
              />
            </button>
          )}
          

        </div>
      </CardContent>
    </Card>
  );
};

export default HorseCard;
