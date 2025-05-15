import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Loader2, AlertCircle, Check, Trash } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';

const AdminPanel = () => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect if not authenticated or not a seller
  if (!isAuthenticated || !user?.is_selling) {
    navigate('/auth');
    return null;
  }

  const handleDeleteAllHorses = async () => {
    if (window.confirm('Are you sure you want to delete ALL horses in the database? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await fetch('/api/admin/delete-all-horses', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Invalidate all horse-related queries
        await queryClient.invalidateQueries({ queryKey: ['/api/horses'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/horses/owner'] });
        
        toast({
          title: 'Success',
          description: 'All horses have been deleted from the database.',
          variant: 'default',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete horses. Please try again.',
          variant: 'destructive',
        });
        console.error('Failed to delete horses:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Layout pageTitle="Admin Panel">
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <h1 className="font-accent text-3xl font-bold text-primary mb-2">Admin Panel</h1>
          <p className="text-neutral-500">Manage system settings and perform administrative tasks</p>
        </div>
        
        <section>
          <h2 className="font-accent text-xl font-semibold mb-4">Horse Management</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Delete All Horses</CardTitle>
                <CardDescription>
                  Remove all horse listings from the database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  This action cannot be undone
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAllHorses}
                  disabled={isDeleting}
                  className="w-full"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" />
                      Delete All Horses
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Add New Horse</CardTitle>
                <CardDescription>
                  Create a new horse listing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-500">
                  Add a new horse to your inventory with detailed information
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/add-horse')}
                >
                  Add Horse
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