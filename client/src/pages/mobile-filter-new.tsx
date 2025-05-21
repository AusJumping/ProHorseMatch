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
  
  // Return to home page with no filters
  const goHome = () => {
    window.location.href = "/";
  };
  
  // Apply discipline filter directly
  const applyDisciplineFilter = (discipline: string) => {
    toast({
      title: "Filtering by " + discipline,
      description: "Finding matching horses...",
      duration: 1000,
    });
    
    // Direct URL navigation with minimal params
    window.location.href = `/?disciplines=${discipline}&currency=${currentCurrency || "AUD"}`;
  };
  
  // Show All Horses
  const showAllHorses = () => {
    toast({
      title: "Showing all horses",
      description: "Displaying all available horses",
      duration: 1000,
    });
    
    window.location.href = "/";
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
        
        <div className="grid grid-cols-1 gap-2">
          <Button 
            variant="outline"
            className="justify-start font-normal h-12 px-4 bg-neutral-50 hover:bg-neutral-100"
            onClick={showAllHorses}
          >
            All Disciplines
          </Button>
          
          {constants?.disciplines?.map((discipline: string) => (
            <Button 
              key={discipline}
              variant="outline"
              className={`justify-start font-normal h-12 px-4 ${
                selectedDiscipline === discipline 
                  ? "bg-primary/10 border-primary" 
                  : "bg-neutral-50 hover:bg-neutral-100"
              }`}
              onClick={() => {
                setSelectedDiscipline(discipline);
                applyDisciplineFilter(discipline);
              }}
            >
              {discipline}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}