import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";

// Zod schema for account settings
const accountSettingsSchema = z.object({
  is_searching: z.boolean().optional(),
  is_selling: z.boolean().optional(),
}).refine(data => data.is_searching || data.is_selling, {
  message: "You must enable at least one role",
  path: ["is_searching"],
});

export default function AccountSettings() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof accountSettingsSchema>>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      is_searching: user?.is_searching || false,
      is_selling: user?.is_selling || false,
    },
  });

  async function onSubmit(values: z.infer<typeof accountSettingsSchema>) {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update settings");
      }
      
      toast({
        title: "Settings updated",
        description: "Your account settings have been updated successfully.",
      });
      
      // Force refresh to update navigation sidebar
      window.location.reload();
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast({
        title: "Update failed",
        description: "Failed to update your account settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        is_searching: user.is_searching,
        is_selling: user.is_selling,
      });
    }
  }, [user, form]);

  if (!isAuthenticated && !isLoading) {
    navigate("/auth");
    return null;
  }

  return (
    <Layout pageTitle="Account Settings" showBackButton onBackClick={() => navigate("/")}>
      <div className="container max-w-3xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-accent">Account Roles</CardTitle>
            <CardDescription>
              Choose how you want to use ProHorseMatch. You can enable one or both roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="is_searching"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <FormLabel className="text-lg font-semibold">Searching Role</FormLabel>
                          <FormDescription>
                            Enable this role to search and browse horses
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // If both are unchecked, force the other one to be checked
                              if (!checked && !form.getValues("is_selling")) {
                                form.setValue("is_selling", true);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_selling"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <FormLabel className="text-lg font-semibold">Selling Role</FormLabel>
                          <FormDescription>
                            Enable this role to list horses for sale
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              // If both are unchecked, force the other one to be checked
                              if (!checked && !form.getValues("is_searching")) {
                                form.setValue("is_searching", true);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!form.formState.isDirty || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Changes"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}