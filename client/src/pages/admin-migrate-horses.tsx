import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminMigrateHorsesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleMigrateHorses = async () => {
    try {
      setIsMigrating(true);
      setErrorMessage(null);
      setMigrationResult(null);
      
      // Call the admin endpoint to migrate horses
      const response = await apiRequest("POST", "/api/admin/migrate-horses", {});
      const result = await response.json();
      
      console.log("Migration result:", result);
      setMigrationResult(result);
      
      toast({
        title: "Horse Migration Complete",
        description: result.message || "All horses have been migrated to the database",
      });
    } catch (error: any) {
      console.error("Migration error:", error);
      
      // Extract error message
      let errorMsg = "Could not migrate horses to the database";
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

  if (authLoading) {
    return (
      <div className="container mx-auto mt-16 text-center">
        <Loader className="animate-spin h-8 w-8 mx-auto" />
        <p className="mt-4">Loading...</p>
      </div>
    );
  }

  // Only users with ID 3 (owner account) should be able to access this page
  if (!user || user.id !== 3) {
    return (
      <div className="container mx-auto mt-16">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be logged in as an administrator to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-16 p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Horse Migration Tool</CardTitle>
          <CardDescription>
            This tool will migrate sample horse listings to the PostgreSQL database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Migration Failed</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {migrationResult && (
            <Alert className="mb-4">
              <AlertTitle>Migration Complete</AlertTitle>
              <AlertDescription>
                Successfully migrated {migrationResult.count || 'several'} horses to the database.
              </AlertDescription>
            </Alert>
          )}
          
          <p className="text-sm text-gray-500 mb-4">
            This action will add sample horse listings to the database, linked to your account. 
            This is useful when setting up a new environment or after deployment.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleMigrateHorses} 
            disabled={isMigrating}
            className="w-full"
          >
            {isMigrating ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              'Migrate Sample Horses'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}