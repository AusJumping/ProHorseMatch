import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, X, Upload, Image, FileVideo } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { useMobile } from "@/hooks/use-mobile";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useCurrency } from "@/contexts/CurrencyContext";

// Helper function to format price with currency symbol
const formatPriceWithCurrency = (amount: number, currency: string): string => {
  switch (currency) {
    case "USD":
      return `$${amount.toLocaleString()}`;
    case "GBP":
      return `£${amount.toLocaleString()}`;
    case "EUR":
      return `€${amount.toLocaleString()}`;
    case "AUD":
      return `A$${amount.toLocaleString()}`;
    case "NZD":
      return `NZ$${amount.toLocaleString()}`;
    default:
      return `$${amount.toLocaleString()}`;
  }
};

// Price range options for horse listings
const priceOptions = [
  5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000,
  55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000, 95000, 100000,
  150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000
];

// Form schema for adding a horse
const horseFormSchema = z.object({
  // Required fields - all dropdown selections must be completed
  location_country: z.string().min(1, "Country is required"),
  disciplines: z.array(z.string()).min(1, "Select at least one discipline"),
  levels: z.array(z.string()).min(1, "Select at least one level"),
  breeds: z.array(z.string()).min(1, "Select at least one breed"),
  sex: z.string().min(1, "Sex is required"),
  colour: z.string().min(1, "Colour is required"),
  currency: z.string().min(1, "Currency is required"),
  
  // Required numeric fields
  age: z.number().min(0, "Age must be at least 0").max(30, "Age must be less than 30"),
  height_hands: z.number().min(10, "Height must be at least 10 hands").max(20, "Height must be less than 20 hands"),
  price_min: z.number().min(1, "Minimum price must be at least 1"),
  price_max: z.number().min(1, "Maximum price must be at least 1"),
  
  // Required for the form to work
  owner_id: z.number(),
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  
  // Optional text/input fields
  height_cm: z.number().optional(),
  sire: z.string().min(1, "Sire information is required"),
  dam: z.string().optional(),
  dam_sire: z.string().min(1, "Dam Sire information is required"),
  location_radius_km: z.number().min(1, "Radius must be at least 1km").max(500, "Radius must be less than 500km"),
  characteristics: z.string().optional(),
  description: z.string().optional(),
  photos: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
});

type HorseFormValues = z.infer<typeof horseFormSchema>;

export default function AddHorseNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "media">("basic");
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  // Get constants for dropdowns
  const { data: constants, isLoading: constantsLoading } = useQuery({
    queryKey: ["/api/constants"],
  });

  // Get current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const form = useForm<HorseFormValues>({
    resolver: zodResolver(horseFormSchema),
    defaultValues: {
      name: "",
      location_country: "",
      location_radius_km: 50,
      disciplines: [],
      levels: [],
      breeds: [],
      age: 5,
      sex: "",
      colour: "",
      height_hands: 15,
      height_cm: 152,
      sire: "",
      dam: "",
      dam_sire: "",
      price_min: 10000,
      price_max: 50000,
      currency: "AUD",
      characteristics: "",
      description: "",
      photos: [],
      videos: [],
      owner_id: 0,
    },
  });

  // Set owner_id when user data is available
  React.useEffect(() => {
    if (user?.id) {
      form.setValue("owner_id", user.id);
    }
  }, [user, form]);

  const onSubmit = async (data: HorseFormValues) => {
    console.log("Form submission started");
    
    try {
      await apiRequest("/api/horses", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          photos,
          videos,
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/horses"] });
      toast({
        title: "Success",
        description: "Horse listing has been created successfully.",
      });
      setLocation("/");
    } catch (error: any) {
      console.error("Horse creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create horse listing. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Navigate to the next tab
  const nextTab = () => {
    if (activeTab === "basic") {
      setActiveTab("details");
    } else if (activeTab === "details") {
      setActiveTab("media");
    }
    // We don't need the "media" case since the submit button is a form submit button
  };

  const prevTab = () => {
    if (activeTab === "details") {
      setActiveTab("basic");
    } else if (activeTab === "media") {
      setActiveTab("details");
    }
  };

  if (userLoading || constantsLoading) {
    return (
      <Layout pageTitle="Add Horse">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Add Horse">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add Horse Listing</CardTitle>
            <CardDescription>
              Please complete ALL FIELDS to help us find the best potential buyers for your horse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="details">Horse Details</TabsTrigger>
                    <TabsTrigger value="media">Media & Description</TabsTrigger>
                  </TabsList>
                  
                  <ScrollArea className={isMobile ? "h-[calc(100vh-380px)]" : ""}>
                    <TabsContent value="basic" className="space-y-6 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Horse Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter horse name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Currency and price section with better layout */}
                      <div className="grid grid-cols-1 gap-6 border-t border-gray-100 pt-6 mb-8">
                        {/* Currency selector takes full width */}
                        <div className="w-full mb-2">
                          <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <CurrencySelector 
                                    defaultValue={field.value}
                                    onChange={(value) => {
                                      field.onChange(value);
                                      form.setValue("currency", value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                          
                        {/* Price range section with Min and Max labels */}
                        {form.watch("currency") && (
                          <div className="w-full">
                            <FormLabel className="block mb-4">Price Range (in {form.watch("currency")})</FormLabel>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <FormLabel className="block mb-2">Min</FormLabel>
                                <FormField
                                  control={form.control}
                                  name="price_min"
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select onValueChange={value => {
                                        const newValue = parseInt(value);
                                        field.onChange(newValue);
                                        
                                        // Check if max price is less than new min price
                                        const currentMaxPrice = form.getValues("price_max");
                                        if (currentMaxPrice < newValue) {
                                          // Update max price to match min price
                                          form.setValue("price_max", newValue);
                                          toast({
                                            description: "Maximum price has been adjusted to match the new minimum price.",
                                          });
                                        }
                                      }} value={field.value?.toString()}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Minimum Price" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {priceOptions.map((price) => (
                                            <SelectItem key={price} value={price.toString()}>
                                              {formatPriceWithCurrency(price, form.watch("currency") || "USD")}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <div>
                                <FormLabel className="block mb-2">Max</FormLabel>
                                <FormField
                                  control={form.control}
                                  name="price_max"
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select 
                                        value={field.value?.toString()}
                                        onValueChange={value => {
                                          const newValue = parseInt(value);
                                          const currentMinPrice = form.getValues("price_min");
                                          
                                          // Only update if the new max price is greater than or equal to min price
                                          if (newValue >= currentMinPrice) {
                                            field.onChange(newValue);
                                          } else {
                                            // Keep the current value and show an error toast
                                            toast({
                                              title: "Invalid price range",
                                              description: "Maximum price must be greater than or equal to minimum price",
                                              variant: "destructive"
                                            });
                                          }
                                        }}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Maximum Price" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {priceOptions.map((price) => (
                                            <SelectItem key={price} value={price.toString()}>
                                              {formatPriceWithCurrency(price, form.watch("currency") || "USD")}
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
                        )}
                      </div>

                      {/* Location section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                        <FormField
                          control={form.control}
                          name="location_country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {constants?.countries?.map((country: string) => (
                                    <SelectItem key={country} value={country}>
                                      {country}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="location_radius_km"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Search Radius (km)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end mt-8">
                        <Button type="button" onClick={nextTab}>
                          Next: Horse Details
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Rest of the form content would continue here... */}
                    
                  </ScrollArea>
                </Tabs>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}