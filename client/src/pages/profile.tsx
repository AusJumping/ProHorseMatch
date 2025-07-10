import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, LogOut } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useMobile } from "@/hooks/use-mobile";
import { getMinPrice, getMaxPrice } from "@/lib/currencyConverter";

// Dynamic schema that validates price ranges based on currency
const createProfileFormSchema = (currency: string = "AUD") => z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
  location_country: z.string().optional(),
  preferred_disciplines: z.array(z.string()).optional().default([]),
  preferred_levels: z.array(z.string()).optional().default([]),
  preferred_breeds: z.array(z.string()).optional().default([]),
  age_range_min: z.number().min(0).optional().or(z.literal('')).transform(val => typeof val === 'string' ? 0 : val),
  age_range_max: z.number().min(0).optional().or(z.literal('')).transform(val => typeof val === 'string' ? 999 : val),
  height_range_min: z.number().min(13).optional().or(z.literal('')).transform(val => typeof val === 'string' ? 13 : val),
  height_range_max: z.number().min(13).optional().or(z.literal('')).transform(val => typeof val === 'string' ? 99 : val),
  preferred_sexes: z.array(z.string()).optional().default([]),
  breeding_preferences: z.string().optional().default(""),
  preferred_characteristics: z.array(z.string()).optional().default([]),
  price_range_min: z.number()
    .min(getMinPrice(currency), { message: `Minimum price must be at least ${getMinPrice(currency)} ${currency}` })
    .optional()
    .or(z.literal(''))
    .transform(val => typeof val === 'string' ? getMinPrice(currency) : val),
  price_range_max: z.number()
    .max(getMaxPrice(currency), { message: `Maximum price cannot exceed ${getMaxPrice(currency)} ${currency}` })
    .optional()
    .or(z.literal(''))
    .transform(val => typeof val === 'string' ? getMaxPrice(currency) : val),
  currency: z.string().optional().default("AUD"),
})
.refine(data => {
  // Skip validation if either field is undefined/null
  if (data.price_range_min === undefined || data.price_range_max === undefined) return true;
  return data.price_range_max >= data.price_range_min;
}, {
  message: "Maximum price must be greater than or equal to minimum price",
  path: ["price_range_max"]
})
.refine(data => {
  // Skip validation if either field is undefined/null
  if (data.age_range_min === undefined || data.age_range_max === undefined) return true;
  return data.age_range_max >= data.age_range_min;
}, {
  message: "Maximum age must be greater than or equal to minimum age",
  path: ["age_range_max"]
})
.refine(data => {
  // Skip validation if either field is undefined/null
  if (data.height_range_min === undefined || data.height_range_max === undefined) return true;
  return data.height_range_max >= data.height_range_min;
}, {
  message: "Maximum height must be greater than or equal to minimum height",
  path: ["height_range_max"]
});

// Define the constants from the schema
const disciplines = ["Jumping", "Dressage", "Eventing"];
const sexes = ["Mare", "Gelding", "Stallion"];
const breeds = [
  "Warmblood", 
  "Thoroughbred", 
  "Other"
];
const characteristics = [
  "Forward", "Brave", "Careful", "Scope", "Schoolmaster", 
  "Honest", "Bold", "Sensitive", "Calm"
];
const countries = [
  "Australia", "United States"
];
const priceValues = [
  0, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 
  50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000, 
  100000, 125000, 150000, 175000, 200000, 250000, 300000, 350000, 400000, 
  450000, 500000
];

const ageValues = [0, ...Array.from({ length: 30 }, (_, i) => i + 1), 999];

// Height values from 13.0 to 18.0 hands high
const heightValues = [0, ...Array.from({ length: 51 }, (_, i) => 13 + i * 0.1).map(h => parseFloat(h.toFixed(1))), 99];

export default function Profile() {
  const isMobile = useMobile();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch user profile data
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Fetch constants for form dropdowns
  const { data: constants } = useQuery({
    queryKey: ['/api/constants'],
  });

  // Get current currency for schema validation
  const currentCurrency = user?.profile?.currency || "AUD";
  const profileFormSchema = createProfileFormSchema(currentCurrency);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      location_country: user?.profile?.location_country || undefined,
      preferred_disciplines: user?.profile?.preferred_disciplines || [],
      preferred_levels: user?.profile?.preferred_levels || [],
      preferred_breeds: user?.profile?.preferred_breeds || [],
      age_range_min: user?.profile?.age_range_min || 0,
      age_range_max: user?.profile?.age_range_max || 999,
      height_range_min: user?.profile?.height_range_min || 0,
      height_range_max: user?.profile?.height_range_max || 99,
      preferred_sexes: user?.profile?.preferred_sexes || [],
      breeding_preferences: user?.profile?.breeding_preferences || "",
      preferred_characteristics: user?.profile?.preferred_characteristics || [],
      price_range_min: user?.profile?.price_range_min || 0,
      price_range_max: user?.profile?.price_range_max || 999999999,
      currency: user?.profile?.currency || "AUD",
    }
  });

  // Update form values when user data is loaded
  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    try {
      await apiRequest("PATCH", `/api/customers/${user?.id}`, data);
      
      toast({
        title: "Preferences saved",
        description: "Your preferences have been saved successfully.",
      });
      
      // Invalidate the user query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Determine which tab we're in and navigate accordingly
      const activeTab = document.querySelector('[data-state="active"][role="tab"]')?.getAttribute('data-value');
      
      // Check if we're in the preferences tab and should redirect
      if (activeTab === 'preferences') {
        // Use a more reliable method for navigation
        console.log("Redirecting to filter page...");
        
        // Small delay to make sure the toast is seen and navigation completes
        setTimeout(() => {
          // Force the navigation to happen
          window.location.href = "/filter";
        }, 800);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await apiRequest("POST", "/api/auth/logout", {});
      
      // Clear all queries from cache
      queryClient.clear();
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      
      navigate("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <Layout pageTitle="Profile">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Profile">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="settings">Account Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} disabled />
                          </FormControl>
                          <FormDescription>
                            To change your email, please email{" "}
                            <a 
                              href="mailto:support@prohorsematch.com" 
                              className="text-primary hover:text-primary/80 underline"
                            >
                              support@prohorsematch.com
                            </a>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" onClick={profileForm.handleSubmit(onProfileSubmit)}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-accent">Email Notifications</h3>
                      <p className="text-sm text-neutral-500">Receive email notifications for new matches and messages</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-accent">Push Notifications</h3>
                      <p className="text-sm text-neutral-500">Receive push notifications on your device</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div>
                    <h3 className="font-accent text-red-500 mb-2">Danger Zone</h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      Once you log out, you'll need to log in again to access your account.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4" />
                          Log Out
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
