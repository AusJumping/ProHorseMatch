import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Loader2, AlertCircle, Trash } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';

const AdminPanel = () => {
  const { toast } = useToast();
  const [isResettingDb, setIsResettingDb] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect if not authenticated or not a seller
  if (!isAuthenticated || !user?.is_selling) {
    navigate('/auth');
    return null;
  }

  return (
    <Layout pageTitle="Admin Panel">
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="font-accent text-3xl font-bold text-primary mb-2">Admin Panel</h1>
          <p className="text-neutral-500">System maintenance</p>
        </div>
        
        <section>
          <h2 className="font-accent text-xl font-semibold mb-4">Database Management</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-red-500 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-600">Clean Database</CardTitle>
                <CardDescription className="text-red-500 font-semibold">
                  DANGER: Complete database reset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Removes ALL horses including yours!
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="destructive"
                  disabled={isResettingDb}
                  onClick={async () => {
                    if (isResettingDb) return;
                    
                    if (window.confirm('EXTREME DANGER: This will delete ALL horses in the database including yours. This action CANNOT be undone. Are you sure you want to continue?')) {
                      // Double confirm because this is dangerous
                      const confirmation = window.prompt('FINAL WARNING: You are about to delete ALL data. Type "DELETE" to confirm.');
                      
                      if (confirmation !== 'DELETE') {
                        toast({
                          title: 'Cancelled',
                          description: 'Database cleaning cancelled.',
                          variant: 'default',
                        });
                        return;
                      }
                      
                      setIsResettingDb(true);
                      
                      try {
                        console.log("Sending clean database request...");
                        const response = await fetch('/api/admin/clean-database', {
                          method: 'DELETE',
                          headers: {
                            'Content-Type': 'application/json'
                          }
                        });
                        
                        console.log("Server response status:", response.status);
                        
                        if (!response.ok) {
                          throw new Error(`Server returned ${response.status}`);
                        }
                        
                        const data = await response.json();
                        console.log("Response data:", data);
                        
                        // Invalidate all horse-related queries
                        await queryClient.invalidateQueries({ queryKey: ['/api/horses'] });
                        await queryClient.invalidateQueries({ queryKey: ['/api/horses/owner'] });
                        
                        toast({
                          title: 'Success',
                          description: 'Database cleaned successfully. All horses have been removed.',
                          variant: 'default',
                        });
                        
                        // Force a complete refresh after 2 seconds
                        setTimeout(() => {
                          window.location.href = window.location.href;
                        }, 2000);
                      } catch (error) {
                        console.error('Failed to clean database:', error);
                        toast({
                          title: 'Error',
                          description: 'Failed to clean database. Please try again.',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsResettingDb(false);
                      }
                    }
                  }}
                  className="w-full"
                >
                  {isResettingDb ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Clearing Database...
                    </>
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" />
                      Clean Database (Delete All)
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AdminPanel;