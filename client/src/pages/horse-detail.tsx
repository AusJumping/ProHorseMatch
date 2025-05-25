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
import { Textarea } from "@/components/ui/textarea";
import { Heart, Share2, ChevronLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function HorseDetail() {
  const isMobile = useMobile();
  const [, params] = useRoute("/horse/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!messageText.trim()) {
        throw new Error("Please enter a message");
      }

      // First create or find conversation
      const conversationResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: user!.id,
          owner_id: horse!.owner_id,
          horse_id: horse!.id,
        }),
      });
      
      if (!conversationResponse.ok) {
        const errorText = await conversationResponse.text();
        throw new Error(errorText || "Failed to create conversation");
      }
      
      const conversation = await conversationResponse.json();

      // Then send the message
      const messageResponse = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversation.id,
          sender_id: user!.id,
          content: messageText.trim(),
        }),
      });

      if (!messageResponse.ok) {
        const errorText = await messageResponse.text();
        throw new Error(errorText || "Failed to send message");
      }

      return messageResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully",
        description: "Your message has been sent to the horse owner.",
      });
      setMessageText("");
      setShowMessageInput(false);
      navigate("/messages");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch horse data
  const { data: horse, isLoading, isError } = useQuery<Horse>({
    queryKey: [`/api/horses/${params?.id}`],
    enabled: !!params?.id,
  });

  // Check if this horse is in the user's favorites
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const matches = await fetch("/api/matches", { credentials: "include" }).then(res => res.json());
        const isLiked = matches.some(
          (match: any) => match.horse_id === parseInt(params!.id) && match.is_liked
        );
        setIsSaved(isLiked);
      } catch (error) {
        console.error("Error checking if horse is favorite:", error);
      }
    };

    if (params?.id) {
      checkFavorite();
    }
  }, [params?.id]);

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

      // If already saved, inform user and don't create duplicate
      if (isSaved) {
        toast({
          title: "Already in favorites",
          description: "This horse is already in your favorites.",
          variant: "default",
          duration: 4000, // Show for a longer time (4 seconds)
        });
        return;
      }
      
      // First check if there's already a match for this user and horse
      const response = await fetch("/api/matches", { credentials: "include" });
      const existingMatches = await response.json();
      
      const matchExists = existingMatches.some(
        (match: any) => match.horse_id === parseInt(params!.id) && match.customer_id === user.id
      );

      if (matchExists) {
        // If match exists but is not liked (was previously unliked), update it
        const match = existingMatches.find(
          (m: any) => m.horse_id === parseInt(params!.id) && m.customer_id === user.id
        );
        
        await fetch(`/api/matches/${match.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_liked: true }),
          credentials: 'include'
        });
        
        setIsSaved(true);
        toast({
          title: "Horse saved",
          description: "This horse has been added to your favorites.",
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





  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${horse?.name} - ProHorseMatch`,
          text: `Check out ${horse?.name}, a ${horse?.age}yo ${horse?.breeds[0]} ${horse?.sex} for sale on ProHorseMatch!`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Horse listing URL copied to clipboard",
      });
    }
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
            <Button className="mt-4" onClick={handleBack}>
              Go Back
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
      <div className="w-full max-w-4xl mx-auto">
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} bg-white rounded-xl overflow-hidden shadow-md`}>
          {/* Media Gallery - Side by side on desktop, full height */}
          <div className={isMobile ? "w-full h-[40vh]" : "w-1/2"}>
            <div className="h-full">
              <MediaCarousel media={horse.photos} />
            </div>
          </div>
          
          {/* Details Content */}
          <div className={isMobile ? "w-full p-4" : "w-1/2 p-6"}>
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-accent font-bold text-2xl">{horse.name}</h2>
            </div>
            
            <p className="text-neutral-800 mb-4">
              {horse.age}yo {horse.breeds[0]} {horse.sex} • {horse.height_hands} hands
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-neutral-50 p-3 rounded-lg">
                <p className="text-sm text-neutral-500">Discipline</p>
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
            

            
            {/* Message Input Section - Shows when Contact Owner is clicked */}
            {user && user.id !== horse.owner_id && showMessageInput && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">Send a message about {horse.name}</h3>
                <Textarea
                  placeholder="Hi! I'm interested in your horse. Could you tell me more about..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="min-h-[100px] mb-3"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => sendMessageMutation.mutate()}
                    disabled={sendMessageMutation.isPending || !messageText.trim()}
                    className="flex-1"
                    style={{ backgroundColor: "#cdac6e", borderColor: "#cdac6e", color: "white" }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowMessageInput(false);
                      setMessageText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons - Hidden if user owns this horse */}
            {user && user.id !== horse.owner_id && (
              <div className="flex gap-3 mt-auto">
                <Button 
                  variant={isSaved ? "outline" : "default"}
                  className={`flex-1 ${isSaved ? 'bg-primary-light bg-opacity-10 text-primary' : ''}`}
                  onClick={handleSave} 
                  disabled={isSaved}
                  style={!isSaved ? { backgroundColor: "#cdac6e", borderColor: "#cdac6e", color: "white" } : {}}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isSaved ? 'fill-primary' : ''}`} />
                  {isSaved ? 'Saved to Favorites' : 'Save to Favorites'}
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowMessageInput(!showMessageInput)}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {showMessageInput ? 'Cancel Message' : 'Contact Owner'}
                </Button>
              </div>
            )}
            
            {/* Share button (mobile only) */}
            {isMobile && (
              <div className="mt-4 flex justify-center">
                <Button variant="ghost" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
