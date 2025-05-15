import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Loader2, AlertCircle, Check, Trash, X, RefreshCw, Database } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';

const AdminPanel = () => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingSpecific, setIsDeletingSpecific] = useState(false);
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
  
  const handleDeleteSpecificHorses = async () => {
    if (window.confirm('Are you sure you want to delete Maestro, Bella, and Cassini? This action cannot be undone.')) {
      setIsDeletingSpecific(true);
      try {
        console.log("Sending delete request to /api/admin/delete-specific-horses");
        const response = await fetch('/api/admin/delete-specific-horses', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Response data:", data);
        
        // Invalidate all horse-related queries
        await queryClient.invalidateQueries({ queryKey: ['/api/horses'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/horses/owner'] });
        
        if (data.deletedCount > 0) {
          toast({
            title: 'Success',
            description: `${data.deletedCount} horses (${data.deletedHorses?.join(', ') || 'Maestro, Bella, Cassini'}) have been deleted.`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'Notice',
            description: 'No horses were found to delete. They may have been deleted already.',
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Failed to delete specific horses:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete specific horses. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsDeletingSpecific(false);
      }
    }
  };

  const [isDeletingUserOne, setIsDeletingUserOne] = useState(false);

  const handleDeleteUserOne = async () => {
    if (window.confirm('Are you sure you want to delete User 1 and all their horses? This action cannot be undone.')) {
      setIsDeletingUserOne(true);
      try {
        console.log("Sending delete request to /api/admin/delete-user-one");
        const response = await fetch('/api/admin/delete-user-one', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Response data:", data);
        
        // Invalidate all horse-related queries
        await queryClient.invalidateQueries({ queryKey: ['/api/horses'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/horses/owner'] });
        
        if (data.deletedCount > 0) {
          toast({
            title: 'Success',
            description: `Deleted ${data.deletedCount} horses owned by User 1: ${data.deletedHorses.join(', ')}`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'Notice',
            description: 'No horses were found for User 1. They may have been deleted already.',
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Failed to delete User 1:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete User 1. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsDeletingUserOne(false);
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
                <CardTitle>Delete Specific Horses</CardTitle>
                <CardDescription>
                  Delete Maestro, Bella, and Cassini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Removes only the specified horses
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSpecificHorses}
                  disabled={isDeletingSpecific}
                  className="w-full"
                >
                  {isDeletingSpecific ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Delete Specific Horses
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          
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
                <CardTitle>Delete User 1</CardTitle>
                <CardDescription>
                  Remove User 1 and all their horses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Removes User 1 and all problematic horses
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUserOne}
                  disabled={isDeletingUserOne}
                  className="w-full"
                >
                  {isDeletingUserOne ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" />
                      Delete User 1
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle>Reset Database</CardTitle>
                <CardDescription>
                  Preserve your horses, remove all others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Keeps only your horses, deletes everything else
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="default"
                  onClick={() => {
                    if (window.confirm('WARNING: This will delete ALL horses except the ones you own. This action cannot be undone. Are you sure you want to continue?')) {
                      const resetDatabase = async () => {
                        try {
                          const response = await fetch('/api/admin/reset-database', {
                            method: 'DELETE',
                            headers: {
                              'Content-Type': 'application/json'
                            }
                          });
                          
                          if (!response.ok) {
                            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                          }
                          
                          const data = await response.json();
                          
                          // Invalidate all horse-related queries
                          await queryClient.invalidateQueries({ queryKey: ['/api/horses'] });
                          await queryClient.invalidateQueries({ queryKey: ['/api/horses/owner'] });
                          
                          toast({
                            title: 'Success',
                            description: data.message || 'Database reset successful. All problematic horses have been removed.',
                            variant: 'default',
                          });
                        } catch (error) {
                          console.error('Failed to reset database:', error);
                          toast({
                            title: 'Error',
                            description: 'Failed to reset database. Please try again.',
                            variant: 'destructive',
                          });
                        }
                      };
                      resetDatabase();
                    }
                  }}
                  className="w-full"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Reset Database
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