import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Horse } from "@shared/schema";
import Layout from "@/components/Layout";
import MediaCarousel from "@/components/MediaCarousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageSquare, ChevronLeft, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function HorseDetail() {
  const isMobile = useMobile();
  const [, params] = useRoute("/horse/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { currentCurrency, convertPrice, formatPrice, isLoading: currencyLoading } = useCurrency();
  const [isSaved, setIsSaved] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [convertedMinPrice, setConvertedMinPrice] = useState<number | null>(null);
  const [convertedMaxPrice, setConvertedMaxPrice] = useState<number | null>(null);

  // Fetch horse data
  const { data: horse, isLoading, isError } = useQuery<Horse>({
    queryKey: [`/api/horses/${params?.id}`],
    enabled: !!params?.id,
  });
  
  // Check if the current user owns this horse
  const isOwner = user && horse && user.id === horse.owner_id;
  
  // Convert price range when currency or horse changes
  useEffect(() => {
    async function doConversion() {
      if (horse?.price_min) {
        const convertedMin = await convertPrice(horse.price_min, horse.currency);
        setConvertedMinPrice(convertedMin);
      }
      
      if (horse?.price_max) {
        const convertedMax = await convertPrice(horse.price_max, horse.currency);
        setConvertedMaxPrice(convertedMax);
      }
    }
    
    if (horse) {
      doConversion();
    }
  }, [horse, currentCurrency, convertPrice]);

  // Check if this horse is in the user's favorites
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        if (!isAuthenticated) {
          setIsSaved(false);
          return;
        }
        const matches = await apiRequest("GET", "/api/matches");
        const isLiked = matches.some(
          (match: any) => match.horse_id === parseInt(params!.id) && match.is_liked
        );
        setIsSaved(isLiked);
      } catch (error) {
        console.error("Error checking if horse is favorite:", error);
        setIsSaved(false);
      }
    };

    if (params?.id) {
      checkFavorite();
    }
  }, [params?.id, isAuthenticated]);

  const handleSave = async () => {
    try {
      if (!isAuthenticated || !user) {
        toast({
          title: "Login required",
          description: "Please log in to save this horse to favorites.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      // First check if there's already a match for this user and horse
      const existingMatches = await apiRequest("GET", "/api/matches");
      
      const existingMatch = existingMatches.find(
        (match: any) => match.horse_id === parseInt(params!.id) && match.customer_id === user.id
      );

      if (existingMatch) {
        // Toggle the like status
        const newLikedStatus = !existingMatch.is_liked;
        
        await apiRequest("PATCH", `/api/matches/${existingMatch.id}`, { is_liked: newLikedStatus });
        
        setIsSaved(newLikedStatus);
        
        // Invalidate the matches cache to ensure other pages get updated data
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
        
        toast({
          title: newLikedStatus ? "Horse saved" : "Horse removed",
          description: newLikedStatus ? "This horse has been added to your favorites." : "This horse has been removed from your favorites.",
          variant: "default",
          duration: 4000, // Show for 4 seconds
        });
      } else {
        // Create new match if one doesn't exist
        await apiRequest("POST", "/api/matches", {
          customer_id: user.id,
          horse_id: parseInt(params!.id),
          is_liked: true
        });
        
        setIsSaved(true);
        
        // Invalidate the matches cache to ensure other pages get updated data
        queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
        
        toast({
          title: "Horse saved",
          description: "This horse has been added to your favorites.",
          variant: "default",
          duration: 4000, // Show for 4 seconds
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save horse. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;
    
    try {
      if (!isAuthenticated || !user) {
        toast({
          title: "Login required",
          description: "Please log in to send messages.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      await apiRequest("POST", "/api/messages", {
        customer_id: user.id,
        owner_id: horse!.owner_id,
        horse_id: horse!.id,
        content: messageContent,
        sender_type: "customer"
      });
      
      toast({
        title: "Message sent",
        description: "Your message has been sent to the owner.",
      });
      
      setMessageContent("");
      setIsMessageOpen(false);
      navigate("/messages");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleContactOwner = () => {
    setIsMessageOpen(!isMessageOpen);
  };



  const handleBack = () => {
    // Check if we have history to go back
    if (window.history.length > 1) {
      window.history.back(); // This preserves the user's session and properly returns to previous page
    } else {
      // Fallback to home if there's no history
      navigate("/"); 
    }
  };

  if (isLoading) {
    return (
      <Layout pageTitle="Horse Detail" showBackButton onBackClick={handleBack}>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading horse details...</span>
        </div>
      </Layout>
    );
  }

  if (isError || !horse) {
    return (
      <Layout pageTitle="Horse Detail" showBackButton onBackClick={handleBack}>
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-500">Error Loading Horse</h2>
            <p className="mt-2">Could not load horse details. Please try again later.</p>
            <Button 
              className="mt-4" 
              size="icon"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      pageTitle={horse.name} 
      showBackButton 
      onBackClick={handleBack}
    >
      <div className={`w-full ${isMobile ? 'max-w-sm px-3' : 'max-w-xl'} mx-auto`}>
        <div className="flex flex-col bg-white rounded-xl overflow-hidden shadow-md">
          {/* Media Gallery - Above content for all screen sizes */}
          <div className={`w-full ${isMobile ? 'h-[35vh]' : 'h-[45vh]'}`}>
            <div className="h-full">
              <MediaCarousel 
                media={horse.photos || []} 
                videos={horse.videos || []} 
              />
            </div>
          </div>
          
          {/* Details Content */}
          <div className="w-full p-6">
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-accent font-bold text-2xl">{horse.name}</h2>
            </div>
            
            <p className="text-neutral-800 mb-4">
              {horse.age === 1 ? "Yearling" : `${horse.age}yo`} {horse.breeds[0]} {horse.sex} • {(horse.height_hands as any) === "young_horse" || !horse.height_hands ? "Height TBD" : `${horse.height_hands} hands`}
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-neutral-50 p-3 rounded-lg">
                <p className="text-sm text-neutral-500">Primary Discipline</p>
                <p className="font-medium">{horse.disciplines.join(", ")}</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <p className="text-sm text-neutral-500">Level</p>
                <p className="font-medium">{horse.levels.join(", ")}</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <p className="text-sm text-neutral-500">Breeding</p>
                <p className="font-medium">
                  {horse.sire && horse.dam_sire ? `${horse.sire} x ${horse.dam_sire}` : "Not specified"}
                </p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <p className="text-sm text-neutral-500">Location</p>
                <p className="font-medium">{horse.location_country}</p>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <h3 className="font-accent font-semibold mb-2">About {horse.name}</h3>
              <p className="text-neutral-700 text-sm leading-relaxed">
                {horse.description || "No description provided."}
              </p>
            </div>
            
            {/* Characteristics */}
            {horse.characteristics && horse.characteristics.length > 0 && (
              <div className="mb-6">
                <h3 className="font-accent font-semibold mb-2">Characteristics</h3>
                <div className="flex flex-wrap gap-2">
                  {horse.characteristics.map((characteristic, index) => (
                    <Badge key={index} variant="outline" className="bg-primary text-white border-transparent">
                      {characteristic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            

            
            {/* Message form (conditionally displayed) */}
            {isMessageOpen && (
              <div className="mb-6">
                <h3 className="font-accent font-semibold mb-2">Message the Owner</h3>
                <textarea
                  className="w-full p-3 border border-neutral-200 rounded-lg mb-3"
                  rows={3}
                  placeholder={`Ask a question about ${horse.name}...`}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                ></textarea>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsMessageOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendMessage}>
                    Send Message
                  </Button>
                </div>
              </div>
            )}
            
            {/* Price Range Display - Only show for horse owners */}
            {isOwner && horse.price_min && horse.price_max && (
              <div className="mb-6">
                <h3 className="font-accent font-semibold mb-2">Price Range</h3>
                <div className="bg-primary text-white font-accent font-semibold text-lg px-4 py-2 rounded-lg inline-block">
                  {currencyLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Converting...</span>
                    </div>
                  ) : convertedMinPrice !== null && convertedMaxPrice !== null ? (
                    formatPrice(convertedMinPrice) + " - " + formatPrice(convertedMaxPrice)
                  ) : (
                    `${horse.currency} ${horse.price_min?.toLocaleString()} - ${horse.price_max?.toLocaleString()}`
                  )}
                  {!currencyLoading && convertedMinPrice !== null && currentCurrency !== horse.currency && (
                    <span className="text-sm opacity-80 ml-2">
                      (orig. {horse.currency})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons - Only show if not the owner of this horse */}
            {!isMessageOpen && !isOwner && (
              <div className="flex gap-3 mt-auto">
                <Button 
                  variant="outline"
                  className="flex-shrink-0"
                  onClick={handleBack}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  variant={isSaved ? "outline" : "default"}
                  className={`flex-1 ${isSaved ? 'bg-primary-light bg-opacity-10 text-primary' : ''}`}
                  onClick={handleSave} 
                  style={!isSaved ? { backgroundColor: "#cdac6e", borderColor: "#cdac6e", color: "white" } : {}}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isSaved ? 'fill-primary' : ''}`} />
                  Favourite
                </Button>
                <Button className="flex-1" onClick={handleContactOwner}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Seller
                </Button>
              </div>
            )}
            
            {/* Owner message - Show when viewing your own horse */}
            {isOwner && (
              <div className="mt-auto">
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-center mb-4">
                  <p className="text-accent font-medium">This is your horse listing</p>
                  <p className="text-sm text-gray-600 mt-1">You can edit or manage this listing from your dashboard</p>
                </div>
                <div className="flex justify-start">
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={handleBack}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            

          </div>
        </div>
      </div>
    </Layout>
  );
}
