import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function MobileFilterPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { currentCurrency } = useCurrency();
  
  // Fetch constants for discipline options only
  const { data: constants } = useQuery<{
    disciplines: string[];
    breeds: string[];
    sexes: string[];
  }>({
    queryKey: ['/api/constants'],
  });
  
  // Super simplified approach - track only selected discipline
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  
  // Return to home page with no filters - using navigate for faster transition
  const goHome = () => {
    // Clear any localStorage filter cache
    try {
      localStorage.removeItem('lastAppliedFilters');
    } catch (error) {
      console.error("Error clearing filters:", error);
    }
    
    // Use navigate instead of window.location for faster transitions
    navigate("/");
  };
  
  // Apply discipline filter directly - optimized for speed
  const applyDisciplineFilter = (discipline: string) => {
    // Show a very brief toast with dynamic discipline name
    toast({
      title: `${discipline} Horses`,
      description: "Loading...",
      duration: 800,
    });
    
    // Save filter to localStorage for faster application
    try {
      const simpleFilter = {
        disciplines: [discipline],
        currency: currentCurrency || "AUD"
      };
      localStorage.setItem('lastAppliedFilters', JSON.stringify(simpleFilter));
    } catch (error) {
      console.error("Error saving filter:", error);
    }
    
    // Use navigate with query parameter for faster transition
    navigate(`/browse?disciplines=${discipline}&currency=${currentCurrency || "AUD"}`);
  };
  
  // Show All Horses - optimized for speed
  const showAllHorses = () => {
    // Show a very brief toast
    toast({
      title: "All Horses",
      description: "Loading...",
      duration: 800,
    });
    
    // Clear any localStorage filter cache
    try {
      localStorage.removeItem('lastAppliedFilters');
    } catch (error) {
      console.error("Error clearing filters:", error);
    }
    
    // Use navigate for faster transition
    navigate("/browse");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-10">
        <div className="flex items-center justify-between p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={goHome}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-accent font-semibold flex-1 text-center">Quick Filters</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={showAllHorses}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Simple discipline selector */}
      <div className="pt-20 p-4">
        <h2 className="text-lg font-bold mb-4">Select Discipline</h2>
        
        <div className="grid grid-cols-1 gap-3">
          <Button 
            variant="outline"
            className="justify-start font-semibold h-14 px-4 bg-white hover:bg-[#cdac6e]/10 border-2 rounded-lg shadow-sm"
            onClick={showAllHorses}
          >
            <span className="flex items-center">
              <span className="mr-2 text-lg">🏆</span>
              All Disciplines
            </span>
          </Button>
          
          {constants?.disciplines?.map((discipline: string) => {
            // Get proper emoji for each discipline
            let emoji = "🐎";
            if (discipline === "Jumping") emoji = "🏇";
            if (discipline === "Dressage") emoji = "🎠";
            if (discipline === "Eventing") emoji = "🏆";
            
            return (
              <Button 
                key={discipline}
                variant="outline"
                className={`justify-start font-normal h-14 px-4 border-2 rounded-lg shadow-sm ${
                  selectedDiscipline === discipline 
                    ? "bg-[#cdac6e]/20 border-[#cdac6e] text-[#cdac6e] font-semibold" 
                    : "bg-white hover:bg-neutral-50"
                }`}
                onClick={() => {
                  setSelectedDiscipline(discipline);
                  applyDisciplineFilter(discipline);
                }}
              >
                <span className="flex items-center">
                  <span className="mr-2 text-lg">{emoji}</span>
                  {discipline}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}