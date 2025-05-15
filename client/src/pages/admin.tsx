import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPanel() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<any>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleDeleteAllHorses = async () => {
    if (!window.confirm("Are you sure you want to delete ALL horses? This action cannot be undone.")) {
      return;
    }
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      setDeleteResult(null);
      
      // Call the admin endpoint to delete all horses
      const result = await apiRequest("DELETE", "/api/admin/horses");
      
      console.log("Delete result:", result);
      setDeleteResult(result);
      
      toast({
        title: "Horses Deleted",
        description: result.message || "All horses have been deleted",
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      
      // Extract error message
      let errorMsg = "Could not delete horses";
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setDeleteError(errorMsg);
      
      toast({
        title: "Delete Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout pageTitle="Admin Panel">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  if (!user?.is_selling) {
    return (
      <Layout pageTitle="Admin Panel">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You need to have selling permission to access the admin panel.</p>
            <Button onClick={() => navigate("/account-settings")}>Go to Account Settings</Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Admin Panel">
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6 font-accent text-center">Admin Panel</h1>
        
        <Tabs defaultValue="horses" className="w-full max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="horses">Horse Management</TabsTrigger>
            <TabsTrigger value="system">System Operations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="horses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Horse Management</CardTitle>
                <CardDescription>
                  Delete all horses from the system to start fresh
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deleteResult && (
                  <Alert className="mb-4 border-green-600 bg-green-50 text-green-800">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                      {deleteResult.message}
                      {deleteResult.deletedHorses && deleteResult.deletedHorses.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold">Deleted horses:</p>
                          <ul className="list-disc list-inside">
                            {deleteResult.deletedHorses.map((horse: any) => (
                              <li key={horse.id}>{horse.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                {deleteError && (
                  <Alert className="mb-4 border-red-600 bg-red-50 text-red-800">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
                )}
                
                <p className="mb-4">
                  This operation will permanently delete all horses in the system. This action cannot be undone.
                </p>
                <p className="mb-6 text-muted-foreground">
                  After deletion, you can add new horses that will be correctly assigned to your owner account.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  onClick={handleDeleteAllHorses}
                  disabled={isDeleting}
                  variant="destructive"
                  className="flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting Horses...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Horses
                    </>
                  )}
                </Button>
                
                {deleteResult && deleteResult.remainingHorses === 0 && (
                  <Button 
                    onClick={() => navigate("/add-horse")}
                    variant="outline"
                  >
                    Add New Horse
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="system" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>System Operations</CardTitle>
                <CardDescription>
                  Advanced system maintenance operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No system operations available at this time.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}