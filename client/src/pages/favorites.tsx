import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import MediaCarousel from "@/components/MediaCarousel";
import type { Horse, Match } from "@shared/schema";

export default function Favorites() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [favoriteHorses, setFavoriteHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // First check for any user data in localStorage
  const [hasLocalUser, setHasLocalUser] = useState<boolean>(false);
  
  useEffect(() => {
    if (!isAuthenticated) {
      // Try to find user in localStorage
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setHasLocalUser(true);
        }
      } catch (e) {
        console.error("Error checking local storage:", e);
      }
    }
  }, [isAuthenticated]);

  // Fetch user's matches - enable even if only local storage auth is available
  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ['/api/matches'],
    enabled: isAuthenticated || hasLocalUser,
  });

  // Fetch all horses - enable even if only local storage auth is available
  const { data: horses, isLoading: horsesLoading } = useQuery<Horse[]>({
    queryKey: ['/api/horses'],
    enabled: isAuthenticated || hasLocalUser,
  });

  useEffect(() => {
    // Try to load user data from localStorage if not authenticated through session
    let currentUser = user;
    if (!isAuthenticated && isLoading) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
          console.log("Using cached user from localStorage for favorites:", currentUser);
        } else {
          // Only redirect if we can't find a user in local storage
          toast({
            title: "Login Required",
            description: "You need to log in to view your favorites.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }
      } catch (e) {
        console.error("Error parsing stored user:", e);
        // Redirect on error
        toast({
          title: "Login Required",
          description: "You need to log in to view your favorites.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
    }

    // Once we have both matches and horses, filter out the favorite horses
    if (matches && horses && !matchesLoading && !horsesLoading) {
      // Filter matches to only include liked ones
      const likedMatches = matches.filter(match => match.is_liked);
      
      // Get the corresponding horses
      const likedHorses = likedMatches.map(match => {
        return horses.find(horse => horse.id === match.horse_id);
      }).filter(Boolean) as Horse[];
      
      setFavoriteHorses(likedHorses);
      setIsLoading(false);
    }
  }, [matches, horses, matchesLoading, horsesLoading, isAuthenticated, user, navigate, toast, isLoading]);

  const handleRemoveFromFavorites = async (horseId: number) => {
    try {
      // Get the match ID for this horse
      const match = matches?.find(m => m.horse_id === horseId && m.is_liked);
      
      if (match) {
        // Update is_liked to false using consistent token-based authentication
        await apiRequest('PATCH', `/api/matches/${match.id}`, { is_liked: false });
        
        // Remove this horse from the local state
        setFavoriteHorses(prev => prev.filter(horse => horse.id !== horseId));
        
        // Invalidate the matches cache to ensure other pages get updated data
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
        
        toast({
          title: "Removed from favorites",
          description: "Horse has been removed from your favorites.",
          duration: 800, // Very brief notification (just under 1 second)
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove horse from favorites.",
        variant: "destructive",
        duration: 800, // Very brief error notification to match others
      });
    }
  };
  
  const handleShowDetails = (horseId: number) => {
    navigate(`/horse/${horseId}`);
  };

  // Allow the page to render even if we're using local storage auth
  if (!isAuthenticated && !hasLocalUser) {
    return null; // Already redirected in useEffect
  }

  return (
    <Layout pageTitle="My Favorites" showBackButton onBackClick={() => navigate("/")}>
      <div className="container px-4 py-8 mx-auto">
        <h1 className="text-3xl font-bold mb-6 font-accent">My Favorites</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : favoriteHorses.length === 0 ? (
          <div className="text-center py-10">
            <Heart className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-gray-500 mb-6">You haven't added any horses to your favorites.</p>
            <Button 
              onClick={(e) => {
                e.preventDefault(); // Prevent any default behavior
                // Use the most direct navigation approach to avoid any issues with auth state
                window.location.href = "/filter";
              }}
            >
              Discover Horses
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteHorses.map(horse => (
              <Card key={horse.id} className="overflow-hidden horse-card-grid">
                <div className="relative aspect-[4/3] bg-gray-100">
                  <MediaCarousel media={horse.photos || []} />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-xl font-semibold mb-1 font-accent">{horse.name}</h3>
                  <div className="text-sm text-gray-500 mb-2">
                    {horse.sire && horse.dam_sire ? 
                      `${horse.sire} x ${horse.dam_sire}` : 
                      horse.breeds.join(", ")}
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="text-sm text-gray-500">
                      {horse.age === 1 ? "Yearling" : `${horse.age} yrs`} &bull; {horse.sex}
                    </div>
                  </div>
                  <div className="text-sm flex items-center text-gray-500">
                    <span>{horse.location_country}</span>
                    <span className="mx-2">&bull;</span>
                    <span>{horse.disciplines.join(", ")}</span>
                  </div>
                </CardContent>
                <CardFooter className="px-4 py-3 border-t flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full mr-2"
                    onClick={() => handleShowDetails(horse.id)}
                  >
                    <Info className="mr-1 h-4 w-4" /> Details
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="w-full"
                    onClick={() => handleRemoveFromFavorites(horse.id)}
                  >
                    <Heart className="mr-1 h-4 w-4" /> Remove
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}