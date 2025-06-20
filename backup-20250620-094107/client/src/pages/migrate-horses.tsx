import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MigrateHorses() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleMigrateHorses = async () => {
    try {
      setIsMigrating(true);
      setErrorMessage(null);
      setMigrationResult(null);
      
      // Call the admin endpoint to reassign horses from source owner ID 1
      const result = await apiRequest("POST", "/api/admin/reassign-horses", {
        sourceOwnerId: 1 // The original owner ID
      });
      
      console.log("Migration result:", result);
      setMigrationResult(result);
      
      toast({
        title: "Horses Migrated",
        description: result.message || "All horses have been assigned to your account",
      });
    } catch (error: any) {
      console.error("Migration error:", error);
      
      // Extract error message
      let errorMsg = "Could not migrate horses to your account";
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      
      toast({
        title: "Migration Failed",
        description: errorMsg,
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
          <CardDescription>
            Transfer horses from the original owner (ID: 1) to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This will transfer all horses owned by the original owner (ID: 1) to your account.</p>
          <p className="mb-6 text-muted-foreground">Note: This is a one-time operation typically performed by administrators.</p>
          
          {migrationResult && (
            <Alert className="mb-4 border-green-600 bg-green-50 text-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                {migrationResult.message}
                {migrationResult.horses && migrationResult.horses.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">Transferred horses:</p>
                    <ul className="list-disc list-inside">
                      {migrationResult.horses.map((horse: any) => (
                        <li key={horse.id}>{horse.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {errorMessage && (
            <Alert className="mb-4 border-red-600 bg-red-50 text-red-800">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-4">
            <Button 
              onClick={handleMigrateHorses}
              disabled={isMigrating}
              className="flex-1"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migrating Horses...
                </>
              ) : "Migrate Horses"}
            </Button>
            
            {migrationResult && (
              <Button 
                onClick={() => navigate("/my-horses")}
                variant="outline"
                className="flex-1"
              >
                View My Horses
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}