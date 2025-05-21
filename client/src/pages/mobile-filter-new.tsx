import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Horse } from "@shared/schema";

export default function MobileFilterPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { currentCurrency } = useCurrency();
  const queryClient = useQueryClient();
  
  // Fetch constants for discipline options only
  const { data: constants } = useQuery<{
    disciplines: string[];
    breeds: string[];
    sexes: string[];
  }>({
    queryKey: ['/api/constants'],
  });
  
  // Pre-fetch all horses to have them ready in cache
  const { data: allHorses } = useQuery<Horse[]>({
    queryKey: ['/api/horses', { currency: currentCurrency }],
  });

  // Get discipline from the URL
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");

  // Extract current discipline from URL when component mounts
  useEffect(() => {
    const url = new URL(window.location.href);
    const disciplineParam = url.searchParams.get('disciplines');
    if (disciplineParam) {
      setSelectedDiscipline(disciplineParam);
    }
  }, []);
  
  // Return to home page with no filters
  const goHome = () => {
    // Use navigate instead of direct URL change for faster response
    navigate("/");
  };
  
  // Apply discipline filter with optimized approach and improved loading experience
  const applyDisciplineFilter = (discipline: string) => {
    // Update UI first for instant feedback
    setSelectedDiscipline(discipline);
    
    // Show immediate visual feedback via toast
    toast({
      title: "Filtering by " + discipline,
      description: "Finding matches for you...",
      duration: 800, // Shorter duration for better UX
    });
    
    // Prefetch the filtered data to reduce perceived loading time
    queryClient.prefetchQuery({
      queryKey: ['/api/horses', { disciplines: [discipline], currency: currentCurrency }],
    });
    
    // Artificial short delay to allow the prefetch to work more effectively
    // This makes the transition feel smoother as data loads in the background
    setTimeout(() => {
      // Use navigate for faster client-side navigation
      navigate(`/?disciplines=${discipline}&currency=${currentCurrency || "AUD"}`);
    }, 50);
  };
  
  // Show All Horses - with enhanced loading experience
  const showAllHorses = () => {
    // Clear selected discipline for immediate visual feedback
    setSelectedDiscipline("");
    
    // Show immediate toast feedback
    toast({
      title: "Showing all horses",
      description: "Loading complete collection...",
      duration: 800,
    });
    
    // Prefetch all horses data to reduce perceived loading time
    queryClient.prefetchQuery({
      queryKey: ['/api/horses', { currency: currentCurrency }],
    });
    
    // Small delay for smoother transition and to allow prefetch to complete
    setTimeout(() => {
      // Use navigate for faster client-side navigation  
      navigate("/");
    }, 50);
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

      {/* Scrollable filter section with disciplines and ages */}
      <div className="pt-20 p-4 pb-24">
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Select Discipline</h2>
          
          <div className="grid grid-cols-1 gap-2 mb-6">
            <Button 
              variant="outline"
              className={`justify-start font-normal h-12 px-4 ${
                !selectedDiscipline 
                  ? "bg-primary/10 border-primary" 
                  : "bg-neutral-50 hover:bg-neutral-100"
              }`}
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
                    ? "bg-primary/10 border-primary font-medium" 
                    : "bg-neutral-50 hover:bg-neutral-100"
                }`}
                onClick={() => applyDisciplineFilter(discipline)}
              >
                {discipline}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Age Range Section */}
        <div>
          <h2 className="text-lg font-bold mb-4">Age Range (years)</h2>
          
          <div className="mb-3">
            <h3 className="font-medium text-sm mb-2 text-gray-700">Minimum Age</h3>
            <div className="grid grid-cols-4 gap-2">
              {[0, 3, 5, 7, 9, 11, 13, 15, 17].map((age) => (
                <Button
                  key={`min-${age}`}
                  variant="outline"
                  className="h-10 text-sm"
                  onClick={() => {
                    // For now, this will just show a toast since we're keeping it simple
                    toast({
                      title: `Min age: ${age} years`,
                      description: "Feature coming soon",
                      duration: 800,
                    });
                  }}
                >
                  {age > 0 ? `${age}yo` : "Any"}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-2 text-gray-700">Maximum Age</h3>
            <div className="grid grid-cols-4 gap-2">
              {[0, 7, 9, 11, 13, 15, 17, 19, 21].map((age) => (
                <Button
                  key={`max-${age}`}
                  variant="outline"
                  className="h-10 text-sm"
                  onClick={() => {
                    // For now, this will just show a toast
                    toast({
                      title: `Max age: ${age > 0 ? age : 'Any'} years`,
                      description: "Feature coming soon",
                      duration: 800,
                    });
                  }}
                >
                  {age > 0 ? `${age}yo` : "Any"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}