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
  disciplines: z.array(z.string()).min(1, "Select a discipline"),
  levels: z.array(z.string()).min(1, "Select at least one level"),
  breeds: z.array(z.string()).min(1, "Select at least one breed"),
  sex: z.string().min(1, "Sex is required"),
  colour: z.string().min(1, "Colour is required"),
  currency: z.string().min(1, "Currency is required"),
  
  // Required numeric fields
  age: z.number({
    required_error: "Age is required",
    invalid_type_error: "Age must be a valid number"
  }).min(0, "Age must be at least 0").max(30, "Age must be less than 30"),
  height_hands: z.union([
    z.number().min(10, "Height must be at least 10 hands").max(20, "Height must be less than 20 hands"),
    z.literal("young_horse")
  ], {
    required_error: "Height is required",
    invalid_type_error: "Height must be selected"
  }),
  price_min: z.number({
    required_error: "Minimum price is required",
    invalid_type_error: "Minimum price must be a valid number"
  }).min(1, "Minimum price must be at least 1"),
  price_max: z.number({
    required_error: "Maximum price is required", 
    invalid_type_error: "Maximum price must be a valid number"
  }).min(1, "Maximum price must be at least 1"),
  
  // Required for the form to work
  owner_id: z.number(),
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  
  // Required text/input fields
  height_cm: z.number().optional(),
  sire: z.string().min(1, "Sire information is required"),
  dam: z.string().min(1, "Dam information is required"),
  dam_sire: z.string().min(1, "Dam Sire information is required"),
  characteristics: z.array(z.string()).optional(),
  description: z.string().min(1, "Description is required"),
  additional_info: z.string().optional(),
  
  // Media requirements
  photos: z.array(z.string()).min(1, "At least one photo is required"),
  videos: z.array(z.string()).optional(),
}).refine((data) => {
  // Ensure that price_max is greater than or equal to price_min
  return data.price_max >= data.price_min;
}, {
  message: "Maximum price must be greater than or equal to minimum price",
  path: ["price_max"] // Show the error on the price_max field
});

type HorseFormValues = z.infer<typeof horseFormSchema>;

export default function AddHorse() {
  const isMobile = useMobile();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Mobile navigation functions
  const nextTab = () => {
    if (activeTab === "basic") setActiveTab("details");
    else if (activeTab === "details") setActiveTab("media");
  };

  const prevTab = () => {
    if (activeTab === "media") setActiveTab("details");
    else if (activeTab === "details") setActiveTab("basic");
  };
  
  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });
  
  // Fetch constants for dropdowns
  const { data: constants, isLoading: constantsLoading } = useQuery({
    queryKey: ['/api/constants'],
  });

  const ownerID = user?.id || 1; // Default to 1 for demo purposes

  const form = useForm<HorseFormValues>({
    resolver: zodResolver(horseFormSchema),
    defaultValues: {
      name: "",
      owner_id: ownerID,
      location_country: "",
      disciplines: [],
      levels: [],
      breeds: [],
      age: undefined,
      height_hands: undefined,
      height_cm: undefined,
      sex: "",
      colour: "",
      sire: "",
      dam: "",
      dam_sire: "",
      characteristics: [],
      price_min: undefined,
      price_max: undefined,
      currency: "AUD",
      description: "",
      photos: [],
      videos: [],
    }
  });

  // This function is called when the form is submitted
  // Function to check if price range is valid
  const isPriceRangeValid = (min: number, max: number) => {
    return max >= min;
  };
  
  const onSubmit = async (data: HorseFormValues) => {
    console.log("Form submission started", data);
    
    // Always include the photo and video URLs in the form data from state
    // This solves the issue of the URLs not being passed to the form
    data.photos = photoUrls;
    data.videos = videoUrls;
    
    // Manually trigger validation to ensure all errors are captured
    const isValid = await form.trigger();
    const errors = form.formState.errors;
    
    if (!isValid || Object.keys(errors).length > 0) {
      console.log("Form validation errors:", errors);
      
      // Find the first error message to display
      const errorFields = Object.keys(errors);
      const firstErrorField = errorFields[0];
      const firstError = errors[firstErrorField];
      const errorMessage = firstError?.message || "Please complete all required fields";
      
      toast({
        title: "Please complete all required fields",
        description: `${firstErrorField}: ${errorMessage}`,
        variant: "destructive",
      });
      return;
    }
    
    // Add debug toast to confirm the form submission was triggered
    toast({
      title: "Submitting form...",
      description: "Processing your horse listing submission",
    });
    
    try {
      setIsSubmitting(true);
      
      // Photos and videos already updated above before validation
      
      const submissionData = {
        ...data,
        owner_id: ownerID,
      };
      
      console.log("Submitting data with photos:", { 
        ...submissionData, 
        photoCount: photoUrls.length 
      });
      
      // Convert height from hands to cm if needed
      if (submissionData.height_hands && !submissionData.height_cm) {
        submissionData.height_cm = Math.round(submissionData.height_hands * 10.16);
      }
      
      // Get the auth token from localStorage for the header
      const authToken = localStorage.getItem('authToken');
      console.log("Auth token for request:", authToken);
      
      // Make the API request with the complete data using fetch directly with credentials
      const response = await fetch("/api/horses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { "Authorization": `Bearer ${authToken}` }),
        },
        credentials: "include", // Important! This ensures cookies are sent with the request
        body: JSON.stringify(submissionData),
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", [...response.headers.entries()]);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || errorData?.error || "Failed to add horse. Server returned an error.";
        throw new Error(errorMessage);
      }
      
      toast({
        title: "Horse added successfully",
        description: "Your horse has been listed for sale.",
      });
      
      // Invalidate horses query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/horses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/horses/owner'] });
      
      // Use client-side navigation with a delay to allow the toast to display
      setTimeout(() => {
        // Redirect to My Horses page instead of home
        navigate("/my-horses");
      }, 1500);
    } catch (error) {
      console.error("Error submitting horse:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add horse. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removePhotoUrl = (url: string) => {
    const updatedPhotos = photoUrls.filter(photo => photo !== url);
    setPhotoUrls(updatedPhotos);
    // Update the form field value for validation
    form.setValue("photos", updatedPhotos);
  };

  const removeVideoUrl = (url: string) => {
    setVideoUrls(videoUrls.filter(video => video !== url));
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
                  <div className="space-y-4">
                    <TabsList className="grid grid-cols-3 w-full md:grid-cols-3 gap-1 h-auto p-1">
                      <TabsTrigger value="basic" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap overflow-hidden">
                        <span className="hidden sm:inline">Basic Information</span>
                        <span className="sm:hidden">Basic</span>
                      </TabsTrigger>
                      <TabsTrigger value="details" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap overflow-hidden">
                        <span className="hidden sm:inline">Horse Details</span>
                        <span className="sm:hidden">Details</span>
                      </TabsTrigger>
                      <TabsTrigger value="media" className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap overflow-hidden">
                        <span className="hidden sm:inline">Media & Description</span>
                        <span className="sm:hidden">Media</span>
                      </TabsTrigger>
                    </TabsList>
                    
                  </div>
                  
                  <ScrollArea className={isMobile ? "h-[calc(100vh-430px)]" : ""}>
                    <TabsContent value="basic" className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Horse Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter horse name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Currency and price section with better layout */}
                      <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 mb-6">
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
                            <FormLabel className="block mb-4">Price Range (in {form.watch("currency")}) *</FormLabel>
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
                                          <SelectItem value="999999">
                                            {formatPriceWithCurrency(999999, form.watch("currency") || "USD").replace(/999,999|999999/, "Over 500,000")}
                                          </SelectItem>
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
                                          <SelectItem value="999999">
                                            {formatPriceWithCurrency(999999, form.watch("currency") || "USD").replace(/999,999|999999/, "Over 500,000")}
                                          </SelectItem>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="location_country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {constants && constants.countries ? (
                                      constants.countries.map((country) => (
                                        <SelectItem key={country} value={country}>
                                          {country}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <>
                                        <SelectItem value="Australia">Australia</SelectItem>
                                        <SelectItem value="New Zealand">New Zealand</SelectItem>
                                        <SelectItem value="North America">North America</SelectItem>
                                        <SelectItem value="Northern Europe">Northern Europe</SelectItem>
                                        <SelectItem value="Central Europe">Central Europe</SelectItem>
                                        <SelectItem value="Southern Europe">Southern Europe</SelectItem>
                                        <SelectItem value="United Kingdom and Ireland">United Kingdom and Ireland</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          

                        </div>


                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age *</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select age" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="0">Weanling</SelectItem>
                                  <SelectItem value="1">Yearling</SelectItem>
                                  <SelectItem value="2">2 years</SelectItem>
                                  <SelectItem value="3">3 years</SelectItem>
                                  <SelectItem value="4">4 years</SelectItem>
                                  <SelectItem value="5">5 years</SelectItem>
                                  <SelectItem value="6">6 years</SelectItem>
                                  <SelectItem value="7">7 years</SelectItem>
                                  <SelectItem value="8">8 years</SelectItem>
                                  <SelectItem value="9">9 years</SelectItem>
                                  <SelectItem value="10">10 years</SelectItem>
                                  <SelectItem value="11">11 years</SelectItem>
                                  <SelectItem value="12">12 years</SelectItem>
                                  <SelectItem value="13">13 years</SelectItem>
                                  <SelectItem value="14">14 years</SelectItem>
                                  <SelectItem value="15">15 years</SelectItem>
                                  <SelectItem value="16">16 years</SelectItem>
                                  <SelectItem value="17">17 years</SelectItem>
                                  <SelectItem value="18">18 years</SelectItem>
                                  <SelectItem value="19">19 years</SelectItem>
                                  <SelectItem value="20">20 years</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="height_hands"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Height (hands) *</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value === "young_horse" ? "young_horse" : parseFloat(value))} 
                                value={field.value === "young_horse" ? "young_horse" : field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    {field.value === "young_horse" ? "Young Horse" : <SelectValue placeholder="Select height" />}
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="young_horse">Young Horse</SelectItem>
                                  <SelectItem value="14.0">14.0 hh</SelectItem>
                                  <SelectItem value="14.1">14.1 hh</SelectItem>
                                  <SelectItem value="14.2">14.2 hh</SelectItem>
                                  <SelectItem value="14.3">14.3 hh</SelectItem>
                                  <SelectItem value="15.0">15.0 hh</SelectItem>
                                  <SelectItem value="15.1">15.1 hh</SelectItem>
                                  <SelectItem value="15.2">15.2 hh</SelectItem>
                                  <SelectItem value="15.3">15.3 hh</SelectItem>
                                  <SelectItem value="16.0">16.0 hh</SelectItem>
                                  <SelectItem value="16.1">16.1 hh</SelectItem>
                                  <SelectItem value="16.2">16.2 hh</SelectItem>
                                  <SelectItem value="16.3">16.3 hh</SelectItem>
                                  <SelectItem value="17.0">17.0 hh</SelectItem>
                                  <SelectItem value="17.1">17.1 hh</SelectItem>
                                  <SelectItem value="17.2">17.2 hh</SelectItem>
                                  <SelectItem value="17.3">17.3 hh</SelectItem>
                                  <SelectItem value="18.0">18.0 hh</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="sex"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {constants && constants.sexes ? (
                                    <>
                                      <SelectItem value="Colt">Colt</SelectItem>
                                      <SelectItem value="Filly">Filly</SelectItem>
                                      {constants.sexes.map((sex) => (
                                        <SelectItem key={sex} value={sex}>
                                          {sex}
                                        </SelectItem>
                                      ))}
                                    </>
                                  ) : (
                                    <>
                                      <SelectItem value="Colt">Colt</SelectItem>
                                      <SelectItem value="Filly">Filly</SelectItem>
                                      <SelectItem value="Mare">Mare</SelectItem>
                                      <SelectItem value="Gelding">Gelding</SelectItem>
                                      <SelectItem value="Stallion">Stallion</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="colour"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Colour</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a colour" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {constants && constants.colours ? (
                                    constants.colours.map((colour) => (
                                      <SelectItem key={colour} value={colour}>
                                        {colour}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <>
                                      <SelectItem value="Bay">Bay</SelectItem>
                                      <SelectItem value="Brown">Brown</SelectItem>
                                      <SelectItem value="Black">Black</SelectItem>
                                      <SelectItem value="Grey">Grey</SelectItem>
                                      <SelectItem value="Chestnut">Chestnut</SelectItem>
                                      <SelectItem value="Palomino">Palomino</SelectItem>
                                      <SelectItem value="Tobiano">Tobiano</SelectItem>
                                      <SelectItem value="Buckskin">Buckskin</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="breeds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Breed *</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange([value])} 
                                defaultValue={field.value?.length ? field.value[0] : undefined}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a breed" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {constants && constants.breeds ? (
                                    constants.breeds.map((breed) => (
                                      <SelectItem key={breed} value={breed}>
                                        {breed}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <>
                                      <SelectItem value="Warmblood">Warmblood</SelectItem>
                                      <SelectItem value="Thoroughbred">Thoroughbred</SelectItem>
                                      <SelectItem value="Arabian">Arabian</SelectItem>
                                      <SelectItem value="Quarter Horse">Quarter Horse</SelectItem>
                                      <SelectItem value="Hanoverian">Hanoverian</SelectItem>
                                      <SelectItem value="Dutch Warmblood">Dutch Warmblood</SelectItem>
                                      <SelectItem value="Oldenburg">Oldenburg</SelectItem>
                                      <SelectItem value="Holsteiner">Holsteiner</SelectItem>
                                      <SelectItem value="Selle Français">Selle Français</SelectItem>
                                      <SelectItem value="Irish Sport Horse">Irish Sport Horse</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="sire"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sire *</FormLabel>
                              <FormControl>
                                <Input placeholder="Sire" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="dam"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dam</FormLabel>
                              <FormControl>
                                <Input placeholder="Dam" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="dam_sire"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dam Sire *</FormLabel>
                              <FormControl>
                                <Input placeholder="Dam Sire" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="border-t border-gray-100 pt-6">
                        <FormField
                          control={form.control}
                          name="disciplines"
                          render={({ field }) => {
                            // Get the selected discipline (first item in array for backwards compatibility)
                            const selectedDiscipline = Array.isArray(field.value) && field.value.length > 0 
                              ? field.value[0] 
                              : undefined;
                            
                            return (
                              <FormItem>
                                <FormLabel>Main Discipline *</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange([value])} 
                                  value={selectedDiscipline}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select the primary discipline" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {constants && constants.disciplines ? (
                                      constants.disciplines.map((discipline) => (
                                        <SelectItem key={discipline} value={discipline}>
                                          {discipline}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <>
                                        <SelectItem value="Jumping">Jumping</SelectItem>
                                        <SelectItem value="Dressage">Dressage</SelectItem>
                                        <SelectItem value="Eventing">Eventing</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Choose the primary discipline for this horse
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>
                      
                      <div className="border-t border-gray-100 pt-6">
                        <FormField
                          control={form.control}
                          name="levels"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Competition Level *</FormLabel>
                              <div className="grid grid-cols-1 gap-2">
                                <Select 
                                  onValueChange={(value) => {
                                    // Get current levels
                                    const currentLevels = field.value || [];
                                    
                                    // Check if the value is already selected
                                    if (currentLevels.includes(value)) {
                                      // If it is, remove it
                                      field.onChange(currentLevels.filter((level) => level !== value));
                                    } else {
                                      // If it's not, add it
                                      field.onChange([...currentLevels, value]);
                                    }
                                  }}
                                  value={field.value?.length ? field.value[0] : undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select the level the horse is currently competing at" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {constants && constants.levels ? (
                                      // Get discipline from form value
                                      (() => {
                                        const disciplineValue = form.getValues("disciplines");
                                        const discipline = disciplineValue && disciplineValue.length > 0 ? disciplineValue[0] : "Jumping";
                                        
                                        // Get levels for this discipline
                                        const disciplineLevels = constants.levels[discipline] || [];
                                        
                                        // Create combined array with special options at the top
                                        const allLevels = ["Not Applicable", "Young Horse", ...disciplineLevels];
                                        
                                        return allLevels.map((level) => (
                                          <SelectItem key={level} value={level}>
                                            {level}
                                          </SelectItem>
                                        ));
                                      })()
                                    ) : (
                                      <>
                                        <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                                        <SelectItem value="Young Horse">Young Horse</SelectItem>
                                        <SelectItem value="1.00m">1.00m</SelectItem>
                                        <SelectItem value="1.10m">1.10m</SelectItem>
                                        <SelectItem value="1.20m">1.20m</SelectItem>
                                        <SelectItem value="1.30m">1.30m</SelectItem>
                                        <SelectItem value="1.40m">1.40m</SelectItem>
                                        <SelectItem value="1.50m">1.50m</SelectItem>
                                        <SelectItem value="1.60m">1.60m</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {field.value && field.value.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {field.value.map((level) => (
                                    <div key={level} className="bg-primary/10 text-primary rounded-md px-2 py-1 text-sm flex items-center">
                                      {level}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          field.onChange(field.value?.filter((l) => l !== level));
                                        }}
                                        className="ml-1 text-primary hover:text-primary/80"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="border-t border-gray-100 pt-6">
                        <FormField
                          control={form.control}
                          name="characteristics"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Characteristics</FormLabel>
                              <div className="grid grid-cols-1 gap-2">
                                <Select 
                                  onValueChange={(value) => {
                                    // Get current characteristics
                                    const currentCharacteristics = field.value || [];
                                    
                                    // Check if the value is already selected
                                    if (currentCharacteristics.includes(value)) {
                                      // If it is, remove it
                                      field.onChange(currentCharacteristics.filter((char) => char !== value));
                                    } else {
                                      // If it's not, add it
                                      field.onChange([...currentCharacteristics, value]);
                                    }
                                  }}
                                  value={""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select characteristics" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {constants && constants.characteristics ? (
                                      constants.characteristics.map((characteristic) => (
                                        <SelectItem key={characteristic} value={characteristic}>
                                          {characteristic}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <>
                                        <SelectItem value="Forward">Forward</SelectItem>
                                        <SelectItem value="Brave">Brave</SelectItem>
                                        <SelectItem value="Careful">Careful</SelectItem>
                                        <SelectItem value="Scopey">Scopey</SelectItem>
                                        <SelectItem value="Athletic">Athletic</SelectItem>
                                        <SelectItem value="Balanced">Balanced</SelectItem>
                                        <SelectItem value="Quick">Quick</SelectItem>
                                        <SelectItem value="Powerful">Powerful</SelectItem>
                                        <SelectItem value="Adjustable">Adjustable</SelectItem>
                                        <SelectItem value="Easy">Easy</SelectItem>
                                        <SelectItem value="Gentle">Gentle</SelectItem>
                                        <SelectItem value="Competitive">Competitive</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {field.value && field.value.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {field.value.map((characteristic) => (
                                    <div key={characteristic} className="bg-primary/10 text-primary rounded-md px-2 py-1 text-sm flex items-center">
                                      {characteristic}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          field.onChange(field.value?.filter((c) => c !== characteristic));
                                        }}
                                        className="ml-1 text-primary hover:text-primary/80"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      

                    </TabsContent>
                    
                    <TabsContent value="media" className="space-y-4 pt-4">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Photos *</h3>
                        <div className="space-y-4 mb-6">
                          <div className="border rounded-md p-4">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) {
                                      setPhotoUploading(false);
                                      return;
                                    }
                                    
                                    try {
                                      setPhotoUploading(true);
                                      
                                      // Try Cloudinary endpoint first
                                      let formData = new FormData();
                                      formData.append("image", file);
                                      
                                      // Get auth token for authenticated request
                                      const authToken = localStorage.getItem('authToken');
                                      const headers: Record<string, string> = {};
                                      if (authToken) {
                                        headers['Authorization'] = `Bearer ${authToken}`;
                                      }
                                      
                                      let response = await fetch("/api/upload-image", {
                                        method: "POST",
                                        headers,
                                        body: formData,
                                        credentials: 'include'
                                      });
                                      
                                      // No fallback - force Cloudinary only for persistence
                                      if (!response.ok) {
                                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                                        throw new Error(`Cloudinary upload failed (${response.status}): ${errorData.error || 'Please try again'}`);
                                      }
                                      
                                      if (!response.ok) {
                                        throw new Error("Failed to upload file");
                                      }
                                      
                                      const data = await response.json();
                                      
                                      // Add the URL to the list
                                      const updatedPhotoUrls = [...photoUrls, data.url];
                                      setPhotoUrls(updatedPhotoUrls);
                                      
                                      // Update the form field value for validation
                                      form.setValue("photos", updatedPhotoUrls);
                                      
                                      // Clear the input
                                      e.target.value = "";
                                      
                                      toast({
                                        title: "Photo uploaded successfully",
                                        description: "Your photo has been uploaded and added to the listing.",
                                      });
                                    } catch (error) {
                                      console.error("Upload error:", error);
                                      toast({
                                        title: "Upload failed",
                                        description: "There was an error uploading your image. Please try again.",
                                        variant: "destructive",
                                      });
                                    } finally {
                                      setPhotoUploading(false);
                                    }
                                  }}
                                  className="flex-1"
                                />
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  disabled={photoUploading}
                                  onClick={() => {
                                    // Find the file input and trigger a click
                                    const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
                                    if (fileInput) {
                                      fileInput.click();
                                    }
                                  }}
                                >
                                  {photoUploading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-1" /> Add Photo
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {photoUrls.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                              {photoUrls.map((url, index) => (
                                <div key={index} className="relative group rounded-md overflow-hidden">
                                  <img
                                    src={url}
                                    alt={`Horse photo ${index + 1}`}
                                    className="h-40 w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://placehold.co/600x400?text=Error+Loading+Image";
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removePhotoUrl(url)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="border border-dashed border-gray-300 rounded-md p-8 text-center">
                              <Image className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-semibold text-gray-900">No photos added</h3>
                              <p className="mt-1 text-sm text-gray-500">Add at least one photo of your horse</p>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-medium mb-4 mt-8">Videos</h3>
                        <div className="space-y-4 mb-6">
                          <div className="border rounded-md p-4">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="video/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) {
                                      setVideoUploading(false);
                                      return;
                                    }
                                    
                                    // Check file size (max 500MB)
                                    const maxSizeMB = 500;
                                    const fileSizeMB = file.size / (1024 * 1024);
                                    
                                    if (fileSizeMB > maxSizeMB) {
                                      setVideoUploading(false);
                                      toast({
                                        title: "File too large",
                                        description: `Video file is ${fileSizeMB.toFixed(1)}MB. Maximum size is ${maxSizeMB}MB.`,
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    
                                    try {
                                      setVideoUploading(true);
                                      
                                      // Try Cloudinary endpoint first
                                      let formData = new FormData();
                                      formData.append("video", file);
                                      
                                      // Get auth token for authenticated request
                                      const authToken = localStorage.getItem('authToken');
                                      const headers: Record<string, string> = {};
                                      if (authToken) {
                                        headers['Authorization'] = `Bearer ${authToken}`;
                                      }
                                      
                                      let response = await fetch("/api/upload-video", {
                                        method: "POST",
                                        headers,
                                        body: formData,
                                        credentials: 'include'
                                      });
                                      
                                      // No fallback - force Cloudinary only for persistence
                                      if (!response.ok) {
                                        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                                        throw new Error(`Cloudinary video upload failed (${response.status}): ${errorData.error || 'Please try again'}`);
                                      }
                                      
                                      if (!response.ok) {
                                        throw new Error("Failed to upload file");
                                      }
                                      
                                      const data = await response.json();
                                      
                                      // Add the URL to the list
                                      const updatedVideoUrls = [...videoUrls, data.url];
                                      setVideoUrls(updatedVideoUrls);
                                      
                                      // Update the form field value for validation
                                      form.setValue("videos", updatedVideoUrls);
                                      
                                      // Clear the input
                                      e.target.value = "";
                                      
                                      toast({
                                        title: "Video uploaded successfully",
                                        description: "Your video has been uploaded and added to the listing.",
                                      });
                                    } catch (error) {
                                      console.error("Upload error:", error);
                                      toast({
                                        title: "Upload failed",
                                        description: "There was an error uploading your video. Please try again.",
                                        variant: "destructive",
                                      });
                                    } finally {
                                      setVideoUploading(false);
                                    }
                                  }}
                                  className="flex-1"
                                />
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  disabled={videoUploading}
                                  onClick={() => {
                                    // Find the file input and trigger a click
                                    const fileInput = document.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement;
                                    if (fileInput) {
                                      fileInput.click();
                                    }
                                  }}
                                >
                                  {videoUploading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-1" /> Add Video
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {videoUrls.length > 0 ? (
                            <div className="space-y-2 mt-4">
                              {videoUrls.map((url, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                  <div className="flex items-center">
                                    <FileVideo className="h-5 w-5 mr-2 text-gray-500" />
                                    <span className="text-sm truncate max-w-[250px]">{url}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeVideoUrl(url)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="border border-dashed border-gray-300 rounded-md p-8 text-center">
                              <FileVideo className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-semibold text-gray-900">No videos added</h3>
                              <p className="mt-1 text-sm text-gray-500">Videos are optional but recommended</p>
                            </div>
                          )}
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Provide a detailed description of your horse"
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="additional_info"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Additional Information</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Any additional information (veterinary history, competition results, etc.)"
                                  className="min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                    </TabsContent>
                  </ScrollArea>
                  
                  {/* Bottom navigation buttons */}
                  <div className="mt-4 pt-4 border-t bg-background">
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevTab}
                        disabled={activeTab === "basic"}
                        className="flex items-center gap-2"
                      >
                        ← Previous
                      </Button>
                      {activeTab === "media" ? (
                        <Button 
                          type="button" 
                          disabled={isSubmitting}
                          className="flex items-center gap-2"
                          onClick={() => {
                            console.log("Submit button clicked", {
                              photos: photoUrls,
                              videos: videoUrls
                            });
                            
                            // Create a complete data object with all required fields
                            const formData = form.getValues();
                            
                            // Set the media directly in the form data
                            formData.photos = photoUrls;
                            formData.videos = videoUrls;
                            
                            // Directly call the submission function with the complete data
                            onSubmit(formData);
                          }}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Create Horse Listing"
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={nextTab}
                          className="flex items-center gap-2"
                        >
                          Next →
                        </Button>
                      )}
                    </div>
                  </div>
                </Tabs>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}