import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Loader2 } from "lucide-react";

export default function MigrateHorses() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleMigrateHorses = async () => {
    try {
      setIsMigrating(true);
      
      // Call the admin endpoint to reassign horses
      const result = await apiRequest("POST", "/api/admin/reassign-horses");
      
      toast({
        title: "Horses Migrated",
        description: result.message || "All horses have been assigned to your account",
      });
      
      // Redirect to my horses page
      navigate("/my-horses");
    } catch (error: any) {
      console.error("Migration error:", error);
      toast({
        title: "Migration Failed",
        description: error.message || "Could not migrate horses to your account",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <Layout pageTitle="Migrating Horses">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  if (!user?.is_selling) {
    return (
      <Layout pageTitle="Migrating Horses">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You need to have selling permission to migrate horses.</p>
            <Button onClick={() => navigate("/account-settings")}>Go to Account Settings</Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Migrating Horses">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Migrate Existing Horses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This will assign all existing horses in the system to your account.</p>
          <p className="mb-6 text-muted-foreground">Note: This is a one-time operation typically performed by administrators.</p>
          
          <Button 
            onClick={handleMigrateHorses}
            disabled={isMigrating}
            className="w-full"
          >
            {isMigrating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Migrating Horses...
              </>
            ) : "Migrate Horses"}
          </Button>
        </CardContent>
      </Card>
    </Layout>
  );
}