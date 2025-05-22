import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import HorseCard from "@/components/HorseCard";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Horse } from "@shared/schema";

export default function MyHorses() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedHorseId, setSelectedHorseId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const [prevLocation, setPrevLocation] = useState(location);

  // Fetch horses owned by the current user
  const { data: horses, isLoading, refetch } = useQuery<Horse[]>({
    queryKey: ["/api/my-horses"],
    queryFn: async () => {
      const response = await apiRequest<Horse[]>("GET", "/api/horses/owner");
      return response;
    },
    enabled: !!user
  });
  
  // Always refetch data when this page mounts to ensure fresh data
  useEffect(() => {
    const fetchFreshData = async () => {
      console.log('My Horses page mounted, ensuring fresh data');
      // First invalidate all horse-related queries to clear cache
      await queryClient.invalidateQueries({ queryKey: ["/api/horses"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/my-horses"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/horses/owner"] });
      
      // Force a refetch to get fresh data from server
      await refetch();
      console.log('My Horses data refreshed');
    };
    
    fetchFreshData();
  }, [queryClient, refetch]);
  
  // Additional effect to detect when returning back to this page
  useEffect(() => {
    // If we've changed location (returned to this page) from edit-horse
    if (prevLocation.includes('/edit-horse/') && location === '/my-horses') {
      console.log('Returned from edit page, refreshing horse data');
      // Force immediate refetch to get latest data
      refetch();
    }
    
    // Update previous location
    setPrevLocation(location);
  }, [location, prevLocation, refetch]);

  const handleEdit = (horseId: number) => {
    // Navigate to the edit horse page
    navigate(`/edit-horse/${horseId}`);
  };

  const handleDelete = async (horseId: number) => {
    try {
      await apiRequest("DELETE", `/api/horses/${horseId}`);
      toast({
        title: "Success",
        description: "Horse listing deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete horse listing",
        variant: "destructive",
      });
    }
  };

  const handleAddHorse = () => {
    navigate("/add-horse");
  };

  return (
    <Layout pageTitle="My Horses">
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-accent font-bold text-2xl">My Horse Listings</h1>
          <Button onClick={handleAddHorse} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Horse
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your horses...</p>
          </div>
        ) : horses?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-accent font-semibold text-xl mb-2">No Horses Listed Yet</h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              You haven't listed any horses for sale. Add your first horse to start connecting with potential buyers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button onClick={handleAddHorse}>
                Add Your First Horse
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    if (!user?.id) {
                      toast({
                        title: "Error",
                        description: "You need to be logged in to add sample horses.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    toast({
                      title: "Adding sample horses",
                      description: "Please wait while we add sample horses to your account...",
                    });
                    
                    // Add sample horses directly using an alternative approach
                    try {
                      // First, make sure the user is a seller
                      if (!user.is_selling) {
                        await apiRequest("PATCH", `/api/users/${user.id}`, { is_selling: true });
                      }
                      
                      // Create the sample horses directly
                      const sampleHorses = [
                        {
                          name: "Pegasus",
                          location_country: "Australia", 
                          currency: "AUD",
                          owner_id: user.id,
                          disciplines: ["Jumping"],
                          levels: ["1.10m"],
                          breeds: ["Warmblood"],
                          age: 8,
                          sex: "Gelding",
                          price_min: 30000,
                          price_max: 35000,
                          photos: ["https://images.unsplash.com/photo-1534307250431-ef2530a9d8c5"],
                          height_hands: 16.2,
                          height_cm: 168,
                          sire: "Cornet Obolensky",
                          dam: "Diamant's Girl",
                          dam_sire: "Diamant de Semilly",
                          characteristics: ["Brave", "Careful"],
                          description: "Talented jumper with a great temperament"
                        },
                        {
                          name: "Thunder",
                          location_country: "Australia",
                          currency: "AUD",
                          owner_id: user.id,
                          disciplines: ["Dressage"],
                          levels: ["Elementary"],
                          breeds: ["Hanoverian"],
                          age: 6,
                          sex: "Stallion",
                          price_min: 40000,
                          price_max: 45000,
                          photos: ["https://images.unsplash.com/photo-1551884831-bbf3cdc6469e"],
                          height_hands: 17,
                          height_cm: 173,
                          sire: "Totilas",
                          dam: "Dancing Queen",
                          dam_sire: "De Niro",
                          characteristics: ["Expressive", "Powerful"],
                          description: "Impressive young dressage prospect with three excellent gaits"
                        }
                      ];
                      
                      // Create each horse
                      const promises = sampleHorses.map(horse => 
                        apiRequest("POST", "/api/horses", horse)
                      );
                      
                      await Promise.all(promises);
                      
                      toast({
                        title: "Success",
                        description: "Sample horses added to your account!",
                      });
                    } catch (e) {
                      console.error("Error adding sample horses:", e);
                      throw e;
                    }
                    
                    // Refresh horse data
                    await queryClient.invalidateQueries({ queryKey: ["/api/horses"] });
                    await queryClient.invalidateQueries({ queryKey: ["/api/my-horses"] });
                    await queryClient.invalidateQueries({ queryKey: ["/api/horses/owner"] });
                    await refetch();
                  } catch (error) {
                    console.error("Error detail:", error);
                    toast({
                      title: "Error",
                      description: "Failed to add sample horses. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Add Sample Horses
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {horses?.map((horse: Horse) => (
              <div key={horse.id} className="relative h-full">
                <HorseCard 
                  horse={horse} 
                  onShowMore={() => navigate(`/horse/${horse.id}`)} 
                  matchStatus={{ is_liked: undefined }} 
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="bg-white shadow-md hover:bg-green-50 text-green-600 hover:text-green-700 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(horse.id);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="bg-white shadow-md hover:bg-red-50 text-red-500 hover:text-red-600 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHorseId(horse.id);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="font-accent font-bold text-xl mb-4">Delete Horse Listing</h3>
              <p className="mb-6">Are you sure you want to delete this horse listing? This action cannot be undone.</p>
              <div className="flex gap-4 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (selectedHorseId) {
                      handleDelete(selectedHorseId);
                      setIsDeleteModalOpen(false);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}