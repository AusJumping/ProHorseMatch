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

// Schemas for form validation
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
  location_country: z.string().optional(),
  preferred_disciplines: z.array(z.string()).optional(),
  preferred_levels: z.array(z.string()).optional(),
  preferred_breeds: z.array(z.string()).optional(),
  age_range_min: z.number().min(0).max(20).optional(),
  age_range_max: z.number().min(0).max(20).optional(),
  height_range_min: z.number().min(13).max(18).optional(),
  height_range_max: z.number().min(13).max(18).optional(),
  preferred_sexes: z.array(z.string()).optional(),
  breeding_preferences: z.string().optional(),
  preferred_characteristics: z.array(z.string()).optional(),
  price_range_min: z.number().min(0).optional(),
  price_range_max: z.number().min(0).optional(),
  currency: z.string().optional(),
});

// Define the constants from the schema
const disciplines = ["Jumping", "Dressage", "Eventing"];
const sexes = ["Mare", "Gelding", "Stallion"];
const breeds = [
  "Warmblood", 
  "Thoroughbred", 
  "OTT Thoroughbred", 
  "Other"
];
const characteristics = [
  "Forward", "Brave", "Careful", "Scope", "Easy to Ride", "Schoolmaster", 
  "Athletic", "Honest", "Talented", "Bold", "Sensitive", "Calm"
];
const countries = [
  "Germany", "Netherlands", "Belgium", "France", "United Kingdom", 
  "United States", "Ireland", "Sweden", "Denmark", "Spain", "Italy"
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

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
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
      currency: user?.profile?.currency || "EUR",
    }
  });

  // Update form values when user data is loaded
  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    try {
      await apiRequest("PATCH", `/api/customers/${user?.id}`, data);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      // Invalidate the user query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
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
            <TabsTrigger value="preferences">Horse Preferences</TabsTrigger>
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
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name (optional)</FormLabel>
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
                            To change your email, please contact support
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="location_country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectGroup>
                                  {countries.map((country) => (
                                    <SelectItem key={country} value={country}>
                                      {country}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      

                    </div>
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
          
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Horse Preferences</CardTitle>
                <CardDescription>
                  Set your preferences for the horses you want to see
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className={isMobile ? "h-[calc(100vh-320px)]" : ""}>
                  <Form {...profileForm}>
                    <form className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Basic Criteria</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={profileForm.control}
                            name="preferred_disciplines"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Disciplines</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange([value])}
                                  value={field.value?.[0] || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger className="text-gray-800 border-gray-300 bg-white">
                                      <SelectValue placeholder="Select Discipline" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="text-black bg-white">
                                    <SelectItem value="All" className="text-gray-900">All Disciplines</SelectItem>
                                    {disciplines.map((discipline) => (
                                      <SelectItem key={discipline} value={discipline} className="text-gray-900">
                                        {discipline}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="preferred_sexes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sex</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange([value])}
                                  value={field.value?.[0] || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger className="text-gray-800 border-gray-300 bg-white">
                                      <SelectValue placeholder="Select Sex" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="text-black bg-white">
                                    <SelectItem value="Any" className="text-gray-900">Any Sex</SelectItem>
                                    {sexes.map((sex) => (
                                      <SelectItem key={sex} value={sex} className="text-gray-900">
                                        {sex}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Price Range</h3>
                        <div className="space-y-6">
                          {/* Currency selector first */}
                          <FormField
                            control={profileForm.control}
                            name="currency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select 
                                  value={field.value} 
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger className="text-gray-800 border-gray-300 bg-white">
                                      <SelectValue placeholder="Select Currency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="text-black bg-white">
                                    <SelectItem value="USD" className="text-gray-900">US Dollar (USD)</SelectItem>
                                    <SelectItem value="AUD" className="text-gray-900">Australian Dollar (AUD)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Price range options only shown after currency is selected */}
                          {profileForm.watch("currency") && (
                            <>
                              <FormLabel className="block mb-2">Price Range (in {profileForm.watch("currency")})</FormLabel>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Min Price */}
                                <FormField
                                  control={profileForm.control}
                                  name="price_range_min"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Minimum Price</FormLabel>
                                      <Select 
                                        value={field.value === 0 ? "0" : (field.value?.toString() || "0")}
                                        onValueChange={(value) => field.onChange(parseInt(value))}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="text-gray-800 border-gray-300 bg-white">
                                            <SelectValue placeholder="Select minimum price" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="text-black bg-white">
                                          <SelectItem value="0" className="text-gray-900">No Min</SelectItem>
                                          {priceValues.slice(1, 15).map(price => (
                                            <SelectItem key={price} value={price.toString()} className="text-gray-900">
                                              {profileForm.watch("currency") === "USD" 
                                                ? `$${price.toLocaleString()}` 
                                                : `A$${price.toLocaleString()}`
                                              }
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                {/* Max Price */}
                                <FormField
                                  control={profileForm.control}
                                  name="price_range_max"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Maximum Price</FormLabel>
                                      <Select 
                                        value={field.value === 999999999 ? "999999999" : (field.value?.toString() || "999999999")}
                                        onValueChange={(value) => field.onChange(parseInt(value))}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="text-gray-800 border-gray-300 bg-white">
                                            <SelectValue placeholder="Select maximum price" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="text-black bg-white">
                                          <SelectItem value="999999999" className="text-gray-900">No Max</SelectItem>
                                          {priceValues.slice(1).map(price => (
                                            <SelectItem key={price} value={price.toString()} className="text-gray-900">
                                              {profileForm.watch("currency") === "USD" 
                                                ? `$${price.toLocaleString()}` 
                                                : `A$${price.toLocaleString()}`
                                              }
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Physical Attributes</h3>
                        <div className="space-y-6">
                          <FormLabel className="block mb-2">Age Range (in years)</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Min Age */}
                            <FormField
                              control={profileForm.control}
                              name="age_range_min"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Minimum Age</FormLabel>
                                  <Select 
                                    value={field.value === 0 ? "0" : (field.value?.toString() || "0")}
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="text-gray-800 border-gray-300 bg-white">
                                        <SelectValue placeholder="Select minimum age" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="text-black bg-white">
                                      <SelectItem value="0" className="text-gray-900">No Min</SelectItem>
                                      {ageValues.slice(1, -1).map(age => (
                                        <SelectItem key={age} value={age.toString()} className="text-gray-900">
                                          {age} {age === 1 ? "year" : "years"}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          
                            {/* Max Age */}
                            <FormField
                              control={profileForm.control}
                              name="age_range_max"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Maximum Age</FormLabel>
                                  <Select 
                                    value={field.value === 999 ? "999" : (field.value?.toString() || "999")}
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="text-gray-800 border-gray-300 bg-white">
                                        <SelectValue placeholder="Select maximum age" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="text-black bg-white">
                                      <SelectItem value="999" className="text-gray-900">No Max</SelectItem>
                                      {ageValues.slice(1, -1).map(age => (
                                        <SelectItem key={age} value={age.toString()} className="text-gray-900">
                                          {age} {age === 1 ? "year" : "years"}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormLabel className="block mb-2">Height Range (in hands)</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Min Height */}
                            <FormField
                              control={profileForm.control}
                              name="height_range_min"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Minimum Height</FormLabel>
                                  <Select 
                                    value={field.value === 0 ? "0" : (field.value?.toString() || "0")}
                                    onValueChange={(value) => field.onChange(parseFloat(value))}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="text-gray-800 border-gray-300 bg-white">
                                        <SelectValue placeholder="Select minimum height" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="text-black bg-white">
                                      <SelectItem value="0" className="text-gray-900">No Min</SelectItem>
                                      {heightValues.slice(1, -1).map(height => (
                                        <SelectItem key={height} value={height.toString()} className="text-gray-900">
                                          {height} hh
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          
                            {/* Max Height */}
                            <FormField
                              control={profileForm.control}
                              name="height_range_max"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Maximum Height</FormLabel>
                                  <Select 
                                    value={field.value === 99 ? "99" : (field.value?.toString() || "99")}
                                    onValueChange={(value) => field.onChange(parseFloat(value))}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="text-gray-800 border-gray-300 bg-white">
                                        <SelectValue placeholder="Select maximum height" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="text-black bg-white">
                                      <SelectItem value="99" className="text-gray-900">No Max</SelectItem>
                                      {heightValues.slice(1, -1).map(height => (
                                        <SelectItem key={height} value={height.toString()} className="text-gray-900">
                                          {height} hh
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Characteristics & Breeding</h3>
                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={profileForm.control}
                            name="preferred_breeds"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preferred Breeds</FormLabel>
                                <Select 
                                  value={field.value?.length ? field.value[0] : undefined}
                                  onValueChange={(value) => {
                                    field.onChange([value]);
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger className="text-gray-800 border-gray-300 bg-white">
                                      <SelectValue placeholder="Select breed" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="text-black bg-white">
                                    <SelectItem value="Any" className="text-gray-900">Any Breed</SelectItem>
                                    {breeds.map((breed) => (
                                      <SelectItem key={breed} value={breed} className="text-gray-900">
                                        {breed}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="breeding_preferences"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Breeding Preferences</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Cornet Obolensky line" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Enter any specific bloodlines or breeding preferences
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="preferred_characteristics"
                            render={() => (
                              <FormItem>
                                <FormLabel>Preferred Characteristics</FormLabel>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                  {characteristics.map((characteristic) => (
                                    <FormField
                                      key={characteristic}
                                      control={profileForm.control}
                                      name="preferred_characteristics"
                                      render={({ field }) => {
                                        return (
                                          <FormItem
                                            key={characteristic}
                                            className="flex flex-row items-start space-x-2"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(characteristic)}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? field.onChange([...field.value || [], characteristic])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                          (value) => value !== characteristic
                                                        )
                                                      )
                                                }}
                                              />
                                            </FormControl>
                                            <FormLabel className="font-normal cursor-pointer">
                                              {characteristic}
                                            </FormLabel>
                                          </FormItem>
                                        )
                                      }}
                                    />
                                  ))}
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </form>
                  </Form>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" onClick={profileForm.handleSubmit(onProfileSubmit)}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
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
                      <h3 className="font-semibold">Email Notifications</h3>
                      <p className="text-sm text-neutral-500">Receive email notifications for new matches and messages</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Push Notifications</h3>
                      <p className="text-sm text-neutral-500">Receive push notifications on your device</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold text-red-500 mb-2">Danger Zone</h3>
                    <p className="text-sm text-neutral-500 mb-4">
                      Once you delete your account, there is no going back. This action cannot be undone.
                    </p>
                    <Button variant="destructive" disabled={true}>
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
