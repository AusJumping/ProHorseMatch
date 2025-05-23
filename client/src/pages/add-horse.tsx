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

// Form schema for adding a horse
const horseFormSchema = z.object({
  // Required fields - all dropdown selections must be completed
  location_country: z.string().min(1, "Country is required"),
  disciplines: z.array(z.string()).min(1, "Select at least one discipline"),
  levels: z.array(z.string()).min(1, "Select at least one level"),
  breed: z.string().min(1, "Breed is required"),
  sex: z.string().min(1, "Sex is required"),
  currency: z.string().min(1, "Currency is required"),
  
  // Required numeric fields
  age: z.number({ required_error: "Age is required" }).min(0, "Age must be at least 0").max(30, "Age must be less than 30"),
  height_hands: z.number({ required_error: "Height in hands is required" }).min(10, "Height must be at least 10 hands").max(20, "Height must be less than 20 hands"),
  price_min: z.number({ required_error: "Minimum price is required" }).min(1, "Minimum price must be at least 1"),
  price_max: z.number({ required_error: "Maximum price is required" }).min(1, "Maximum price must be at least 1"),
  
  // Required for the form to work
  owner_id: z.number(),
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  
  // Optional calculated field
  height_cm: z.number().optional(),
  sire: z.string().min(1, "Sire information is required"),
  dam: z.string().min(1, "Dam information is required"),
  dam_sire: z.string().min(1, "Dam Sire information is required"),
  characteristics: z.array(z.string()).min(1, "Select at least one characteristic"),
  
  // Optional fields (only Video and Description)
  description: z.string().optional(),
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
  const [activeTab, setActiveTab] = useState("basic");
  
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
      location_country: "", // This will trigger validation if left empty
      disciplines: [], // This will trigger validation if left empty
      levels: [], // This will trigger validation if left empty
      breed: "", // Changed to empty to require selection
      age: undefined as any, // This will trigger validation if left empty
      height_hands: undefined as any, // This will trigger validation if left empty
      height_cm: undefined as any, // This will trigger validation if left empty
      sex: "", // This will trigger validation if left empty
      sire: "",
      dam: "",
      dam_sire: "",
      characteristics: [], // This will trigger validation if left empty
      price_min: undefined as any, // This will trigger validation if left empty
      price_max: undefined as any, // This will trigger validation if left empty
      currency: "", // Changed to empty to require selection
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
    
    // Trigger validation for all fields to show individual error messages
    const isValid = await form.trigger();
    console.log("Validation result:", isValid);
    console.log("Form errors:", form.formState.errors);
    console.log("Current form values:", form.getValues());
    
    if (!isValid) {
      // Before showing errors, let's update calculated fields and photos
      const currentValues = form.getValues();
      
      // Update height_cm from height_hands if needed
      if (currentValues.height_hands && !currentValues.height_cm) {
        const heightCm = Math.round(currentValues.height_hands * 10.16);
        form.setValue("height_cm", heightCm);
      }
      
      // Update photos from state
      if (photoUrls.length > 0) {
        form.setValue("photos", photoUrls);
      }
      
      // Re-trigger validation after updating values
      const isValidAfterUpdate = await form.trigger();
      if (isValidAfterUpdate) {
        // If valid now, proceed with submission
        console.log("Validation passed after updating calculated fields");
      } else {
        // Show detailed error information
        const errors = form.formState.errors;
        const errorFields = Object.keys(errors);
        console.log("Fields with errors:", errorFields);
        console.log("Detailed errors:", errors);
        
        toast({
          title: "Please complete all required fields",
          description: `Missing: ${errorFields.join(', ')}. Check the form for red error messages.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Add debug toast to confirm the form submission was triggered
    toast({
      title: "Submitting form...",
      description: "Processing your horse listing submission",
    });
    
    try {
      setIsSubmitting(true);
      
      // Always include the photo and video URLs in the form data from state
      // This solves the issue of the URLs not being passed to the form
      data.photos = photoUrls;
      data.videos = videoUrls;
      
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
      
      // Make the API request with the complete data using fetch directly with credentials
      const response = await fetch("/api/horses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important! This ensures cookies are sent with the request
        body: JSON.stringify(submissionData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add horse. Server returned an error.");
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
    setPhotoUrls(photoUrls.filter(photo => photo !== url));
  };

  const removeVideoUrl = (url: string) => {
    setVideoUrls(videoUrls.filter(video => video !== url));
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
              List your horse for sale and connect with potential buyers
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
                                <FormLabel>Currency *</FormLabel>
                                <FormControl>
                                  <CurrencySelector 
                                    defaultValue={field.value}
                                    onChange={(value) => {
                                      field.onChange(value);
                                      form.setValue("currency", value);
                                      // Trigger validation for this field specifically
                                      form.trigger("currency");
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
                                          <SelectItem value="5000">
                                            {form.watch("currency") === "USD" ? "$5,000" : 
                                             form.watch("currency") === "GBP" ? "£5,000" : 
                                             form.watch("currency") === "AUD" ? "A$5,000" : 
                                             "€5,000"}
                                          </SelectItem>
                                          <SelectItem value="10000">
                                            {form.watch("currency") === "USD" ? "$10,000" : 
                                             form.watch("currency") === "GBP" ? "£10,000" : 
                                             form.watch("currency") === "AUD" ? "A$10,000" : 
                                             "€10,000"}
                                          </SelectItem>
                                          <SelectItem value="15000">
                                            {form.watch("currency") === "USD" ? "$15,000" : 
                                             form.watch("currency") === "GBP" ? "£15,000" : 
                                             form.watch("currency") === "AUD" ? "A$15,000" : 
                                             "€15,000"}
                                          </SelectItem>
                                          <SelectItem value="20000">
                                            {form.watch("currency") === "USD" ? "$20,000" : 
                                             form.watch("currency") === "GBP" ? "£20,000" : 
                                             form.watch("currency") === "AUD" ? "A$20,000" : 
                                             "€20,000"}
                                          </SelectItem>
                                          <SelectItem value="25000">
                                            {form.watch("currency") === "USD" ? "$25,000" : 
                                             form.watch("currency") === "GBP" ? "£25,000" : 
                                             form.watch("currency") === "AUD" ? "A$25,000" : 
                                             "€25,000"}
                                          </SelectItem>
                                          <SelectItem value="30000">
                                            {form.watch("currency") === "USD" ? "$30,000" : 
                                             form.watch("currency") === "GBP" ? "£30,000" : 
                                             form.watch("currency") === "AUD" ? "A$30,000" : 
                                             "€30,000"}
                                          </SelectItem>
                                          <SelectItem value="35000">
                                            {form.watch("currency") === "USD" ? "$35,000" : 
                                             form.watch("currency") === "GBP" ? "£35,000" : 
                                             form.watch("currency") === "AUD" ? "A$35,000" : 
                                             "€35,000"}
                                          </SelectItem>
                                          <SelectItem value="40000">
                                            {form.watch("currency") === "USD" ? "$40,000" : 
                                             form.watch("currency") === "GBP" ? "£40,000" : 
                                             form.watch("currency") === "AUD" ? "A$40,000" : 
                                             "€40,000"}
                                          </SelectItem>
                                          <SelectItem value="45000">
                                            {form.watch("currency") === "USD" ? "$45,000" : 
                                             form.watch("currency") === "GBP" ? "£45,000" : 
                                             form.watch("currency") === "AUD" ? "A$45,000" : 
                                             "€45,000"}
                                          </SelectItem>
                                          <SelectItem value="50000">
                                            {form.watch("currency") === "USD" ? "$50,000" : 
                                             form.watch("currency") === "GBP" ? "£50,000" : 
                                             form.watch("currency") === "AUD" ? "A$50,000" : 
                                             "€50,000"}
                                          </SelectItem>
                                          <SelectItem value="55000">
                                            {form.watch("currency") === "USD" ? "$55,000" : 
                                             form.watch("currency") === "GBP" ? "£55,000" : 
                                             form.watch("currency") === "AUD" ? "A$55,000" : 
                                             "€55,000"}
                                          </SelectItem>
                                          <SelectItem value="60000">
                                            {form.watch("currency") === "USD" ? "$60,000" : 
                                             form.watch("currency") === "GBP" ? "£60,000" : 
                                             form.watch("currency") === "AUD" ? "A$60,000" : 
                                             "€60,000"}
                                          </SelectItem>
                                          <SelectItem value="65000">
                                            {form.watch("currency") === "USD" ? "$65,000" : 
                                             form.watch("currency") === "GBP" ? "£65,000" : 
                                             form.watch("currency") === "AUD" ? "A$65,000" : 
                                             "€65,000"}
                                          </SelectItem>
                                          <SelectItem value="70000">
                                            {form.watch("currency") === "USD" ? "$70,000" : 
                                             form.watch("currency") === "GBP" ? "£70,000" : 
                                             form.watch("currency") === "AUD" ? "A$70,000" : 
                                             "€70,000"}
                                          </SelectItem>
                                          <SelectItem value="75000">
                                            {form.watch("currency") === "USD" ? "$75,000" : 
                                             form.watch("currency") === "GBP" ? "£75,000" : 
                                             form.watch("currency") === "AUD" ? "A$75,000" : 
                                             "€75,000"}
                                          </SelectItem>
                                          <SelectItem value="80000">
                                            {form.watch("currency") === "USD" ? "$80,000" : 
                                             form.watch("currency") === "GBP" ? "£80,000" : 
                                             form.watch("currency") === "AUD" ? "A$80,000" : 
                                             "€80,000"}
                                          </SelectItem>
                                          <SelectItem value="85000">
                                            {form.watch("currency") === "USD" ? "$85,000" : 
                                             form.watch("currency") === "GBP" ? "£85,000" : 
                                             form.watch("currency") === "AUD" ? "A$85,000" : 
                                             "€85,000"}
                                          </SelectItem>
                                          <SelectItem value="90000">
                                            {form.watch("currency") === "USD" ? "$90,000" : 
                                             form.watch("currency") === "GBP" ? "£90,000" : 
                                             form.watch("currency") === "AUD" ? "A$90,000" : 
                                             "€90,000"}
                                          </SelectItem>
                                          <SelectItem value="95000">
                                            {form.watch("currency") === "USD" ? "$95,000" : 
                                             form.watch("currency") === "GBP" ? "£95,000" : 
                                             form.watch("currency") === "AUD" ? "A$95,000" : 
                                             "€95,000"}
                                          </SelectItem>
                                          <SelectItem value="100000">
                                            {form.watch("currency") === "USD" ? "$100,000" : 
                                             form.watch("currency") === "GBP" ? "£100,000" : 
                                             form.watch("currency") === "AUD" ? "A$100,000" : 
                                             "€100,000"}
                                          </SelectItem>
                                          <SelectItem value="150000">
                                            {form.watch("currency") === "USD" ? "$150,000" : 
                                             form.watch("currency") === "GBP" ? "£150,000" : 
                                             form.watch("currency") === "AUD" ? "A$150,000" : 
                                             "€150,000"}
                                          </SelectItem>
                                          <SelectItem value="200000">
                                            {form.watch("currency") === "USD" ? "$200,000" : 
                                             form.watch("currency") === "GBP" ? "£200,000" : 
                                             form.watch("currency") === "AUD" ? "A$200,000" : 
                                             "€200,000"}
                                          </SelectItem>
                                          <SelectItem value="250000">
                                            {form.watch("currency") === "USD" ? "$250,000" : 
                                             form.watch("currency") === "GBP" ? "£250,000" : 
                                             form.watch("currency") === "AUD" ? "A$250,000" : 
                                             "€250,000"}
                                          </SelectItem>
                                          <SelectItem value="300000">
                                            {form.watch("currency") === "USD" ? "$300,000" : 
                                             form.watch("currency") === "GBP" ? "£300,000" : 
                                             form.watch("currency") === "AUD" ? "A$300,000" : 
                                             "€300,000"}
                                          </SelectItem>
                                          <SelectItem value="350000">
                                            {form.watch("currency") === "USD" ? "$350,000" : 
                                             form.watch("currency") === "GBP" ? "£350,000" : 
                                             form.watch("currency") === "AUD" ? "A$350,000" : 
                                             "€350,000"}
                                          </SelectItem>
                                          <SelectItem value="400000">
                                            {form.watch("currency") === "USD" ? "$400,000" : 
                                             form.watch("currency") === "GBP" ? "£400,000" : 
                                             form.watch("currency") === "AUD" ? "A$400,000" : 
                                             "€400,000"}
                                          </SelectItem>
                                          <SelectItem value="450000">
                                            {form.watch("currency") === "USD" ? "$450,000" : 
                                             form.watch("currency") === "GBP" ? "£450,000" : 
                                             form.watch("currency") === "AUD" ? "A$450,000" : 
                                             "€450,000"}
                                          </SelectItem>
                                          <SelectItem value="500000">
                                            {form.watch("currency") === "USD" ? "$500,000" : 
                                             form.watch("currency") === "GBP" ? "£500,000" : 
                                             form.watch("currency") === "AUD" ? "A$500,000" : 
                                             "€500,000"}
                                          </SelectItem>
                                          <SelectItem value="999999">
                                            {form.watch("currency") === "USD" ? "Over $500,000" : 
                                             form.watch("currency") === "GBP" ? "Over £500,000" : 
                                             form.watch("currency") === "AUD" ? "Over A$500,000" : 
                                             "Over €500,000"}
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
                                          <SelectItem value="5000">
                                            {form.watch("currency") === "USD" ? "$5,000" : 
                                             form.watch("currency") === "GBP" ? "£5,000" : 
                                             form.watch("currency") === "AUD" ? "A$5,000" : 
                                             "€5,000"}
                                          </SelectItem>
                                          <SelectItem value="10000">
                                            {form.watch("currency") === "USD" ? "$10,000" : 
                                             form.watch("currency") === "GBP" ? "£10,000" : 
                                             form.watch("currency") === "AUD" ? "A$10,000" : 
                                             "€10,000"}
                                          </SelectItem>
                                          <SelectItem value="15000">
                                            {form.watch("currency") === "USD" ? "$15,000" : 
                                             form.watch("currency") === "GBP" ? "£15,000" : 
                                             form.watch("currency") === "AUD" ? "A$15,000" : 
                                             "€15,000"}
                                          </SelectItem>
                                          <SelectItem value="20000">
                                            {form.watch("currency") === "USD" ? "$20,000" : 
                                             form.watch("currency") === "GBP" ? "£20,000" : 
                                             form.watch("currency") === "AUD" ? "A$20,000" : 
                                             "€20,000"}
                                          </SelectItem>
                                          <SelectItem value="25000">
                                            {form.watch("currency") === "USD" ? "$25,000" : 
                                             form.watch("currency") === "GBP" ? "£25,000" : 
                                             form.watch("currency") === "AUD" ? "A$25,000" : 
                                             "€25,000"}
                                          </SelectItem>
                                          <SelectItem value="30000">
                                            {form.watch("currency") === "USD" ? "$30,000" : 
                                             form.watch("currency") === "GBP" ? "£30,000" : 
                                             form.watch("currency") === "AUD" ? "A$30,000" : 
                                             "€30,000"}
                                          </SelectItem>
                                          <SelectItem value="35000">
                                            {form.watch("currency") === "USD" ? "$35,000" : 
                                             form.watch("currency") === "GBP" ? "£35,000" : 
                                             form.watch("currency") === "AUD" ? "A$35,000" : 
                                             "€35,000"}
                                          </SelectItem>
                                          <SelectItem value="40000">
                                            {form.watch("currency") === "USD" ? "$40,000" : 
                                             form.watch("currency") === "GBP" ? "£40,000" : 
                                             form.watch("currency") === "AUD" ? "A$40,000" : 
                                             "€40,000"}
                                          </SelectItem>
                                          <SelectItem value="45000">
                                            {form.watch("currency") === "USD" ? "$45,000" : 
                                             form.watch("currency") === "GBP" ? "£45,000" : 
                                             form.watch("currency") === "AUD" ? "A$45,000" : 
                                             "€45,000"}
                                          </SelectItem>
                                          <SelectItem value="50000">
                                            {form.watch("currency") === "USD" ? "$50,000" : 
                                             form.watch("currency") === "GBP" ? "£50,000" : 
                                             form.watch("currency") === "AUD" ? "A$50,000" : 
                                             "€50,000"}
                                          </SelectItem>
                                          <SelectItem value="55000">
                                            {form.watch("currency") === "USD" ? "$55,000" : 
                                             form.watch("currency") === "GBP" ? "£55,000" : 
                                             form.watch("currency") === "AUD" ? "A$55,000" : 
                                             "€55,000"}
                                          </SelectItem>
                                          <SelectItem value="60000">
                                            {form.watch("currency") === "USD" ? "$60,000" : 
                                             form.watch("currency") === "GBP" ? "£60,000" : 
                                             form.watch("currency") === "AUD" ? "A$60,000" : 
                                             "€60,000"}
                                          </SelectItem>
                                          <SelectItem value="65000">
                                            {form.watch("currency") === "USD" ? "$65,000" : 
                                             form.watch("currency") === "GBP" ? "£65,000" : 
                                             form.watch("currency") === "AUD" ? "A$65,000" : 
                                             "€65,000"}
                                          </SelectItem>
                                          <SelectItem value="70000">
                                            {form.watch("currency") === "USD" ? "$70,000" : 
                                             form.watch("currency") === "GBP" ? "£70,000" : 
                                             form.watch("currency") === "AUD" ? "A$70,000" : 
                                             "€70,000"}
                                          </SelectItem>
                                          <SelectItem value="75000">
                                            {form.watch("currency") === "USD" ? "$75,000" : 
                                             form.watch("currency") === "GBP" ? "£75,000" : 
                                             form.watch("currency") === "AUD" ? "A$75,000" : 
                                             "€75,000"}
                                          </SelectItem>
                                          <SelectItem value="80000">
                                            {form.watch("currency") === "USD" ? "$80,000" : 
                                             form.watch("currency") === "GBP" ? "£80,000" : 
                                             form.watch("currency") === "AUD" ? "A$80,000" : 
                                             "€80,000"}
                                          </SelectItem>
                                          <SelectItem value="85000">
                                            {form.watch("currency") === "USD" ? "$85,000" : 
                                             form.watch("currency") === "GBP" ? "£85,000" : 
                                             form.watch("currency") === "AUD" ? "A$85,000" : 
                                             "€85,000"}
                                          </SelectItem>
                                          <SelectItem value="90000">
                                            {form.watch("currency") === "USD" ? "$90,000" : 
                                             form.watch("currency") === "GBP" ? "£90,000" : 
                                             form.watch("currency") === "AUD" ? "A$90,000" : 
                                             "€90,000"}
                                          </SelectItem>
                                          <SelectItem value="95000">
                                            {form.watch("currency") === "USD" ? "$95,000" : 
                                             form.watch("currency") === "GBP" ? "£95,000" : 
                                             form.watch("currency") === "AUD" ? "A$95,000" : 
                                             "€95,000"}
                                          </SelectItem>
                                          <SelectItem value="100000">
                                            {form.watch("currency") === "USD" ? "$100,000" : 
                                             form.watch("currency") === "GBP" ? "£100,000" : 
                                             form.watch("currency") === "AUD" ? "A$100,000" : 
                                             "€100,000"}
                                          </SelectItem>
                                          <SelectItem value="150000">
                                            {form.watch("currency") === "USD" ? "$150,000" : 
                                             form.watch("currency") === "GBP" ? "£150,000" : 
                                             form.watch("currency") === "AUD" ? "A$150,000" : 
                                             "€150,000"}
                                          </SelectItem>
                                          <SelectItem value="200000">
                                            {form.watch("currency") === "USD" ? "$200,000" : 
                                             form.watch("currency") === "GBP" ? "£200,000" : 
                                             form.watch("currency") === "AUD" ? "A$200,000" : 
                                             "€200,000"}
                                          </SelectItem>
                                          <SelectItem value="250000">
                                            {form.watch("currency") === "USD" ? "$250,000" : 
                                             form.watch("currency") === "GBP" ? "£250,000" : 
                                             form.watch("currency") === "AUD" ? "A$250,000" : 
                                             "€250,000"}
                                          </SelectItem>
                                          <SelectItem value="300000">
                                            {form.watch("currency") === "USD" ? "$300,000" : 
                                             form.watch("currency") === "GBP" ? "£300,000" : 
                                             form.watch("currency") === "AUD" ? "A$300,000" : 
                                             "€300,000"}
                                          </SelectItem>
                                          <SelectItem value="350000">
                                            {form.watch("currency") === "USD" ? "$350,000" : 
                                             form.watch("currency") === "GBP" ? "£350,000" : 
                                             form.watch("currency") === "AUD" ? "A$350,000" : 
                                             "€350,000"}
                                          </SelectItem>
                                          <SelectItem value="400000">
                                            {form.watch("currency") === "USD" ? "$400,000" : 
                                             form.watch("currency") === "GBP" ? "£400,000" : 
                                             form.watch("currency") === "AUD" ? "A$400,000" : 
                                             "€400,000"}
                                          </SelectItem>
                                          <SelectItem value="450000">
                                            {form.watch("currency") === "USD" ? "$450,000" : 
                                             form.watch("currency") === "GBP" ? "£450,000" : 
                                             form.watch("currency") === "AUD" ? "A$450,000" : 
                                             "€450,000"}
                                          </SelectItem>
                                          <SelectItem value="500000">
                                            {form.watch("currency") === "USD" ? "$500,000" : 
                                             form.watch("currency") === "GBP" ? "£500,000" : 
                                             form.watch("currency") === "AUD" ? "A$500,000" : 
                                             "€500,000"}
                                          </SelectItem>
                                          <SelectItem value="999999">
                                            {form.watch("currency") === "USD" ? "Over $500,000" : 
                                             form.watch("currency") === "GBP" ? "Over £500,000" : 
                                             form.watch("currency") === "AUD" ? "Over A$500,000" : 
                                             "Over €500,000"}
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
                                <FormLabel>Country</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Australia">Australia</SelectItem>
                                    <SelectItem value="United States">United States</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          

                        </div>

                        <div className="w-full mt-4">
                          <Button onClick={nextTab} type="button" className="w-full">
                            Next: Horse Details
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="space-y-6 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age</FormLabel>
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
                                  <SelectItem value="1">1 year</SelectItem>
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
                              <FormLabel>Height (hands)</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseFloat(value))} 
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select height" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="12.0">12.0 hh</SelectItem>
                                  <SelectItem value="12.1">12.1 hh</SelectItem>
                                  <SelectItem value="12.2">12.2 hh</SelectItem>
                                  <SelectItem value="12.3">12.3 hh</SelectItem>
                                  <SelectItem value="13.0">13.0 hh</SelectItem>
                                  <SelectItem value="13.1">13.1 hh</SelectItem>
                                  <SelectItem value="13.2">13.2 hh</SelectItem>
                                  <SelectItem value="13.3">13.3 hh</SelectItem>
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
                              <FormLabel>Sex *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a sex" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {constants && constants.sexes ? (
                                    constants.sexes.map((sex: string) => (
                                      <SelectItem key={sex} value={sex}>
                                        {sex}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <>
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
                          name="breed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Breed *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a breed" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {constants && constants.breeds ? (
                                    constants.breeds.map((breed: string) => (
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
                              <FormLabel>Sire</FormLabel>
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
                              <FormLabel>Dam Sire</FormLabel>
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
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Disciplines</FormLabel>
                              <div className="grid grid-cols-1 gap-2">
                                <Select 
                                  onValueChange={(value) => {
                                    // Get current disciplines
                                    const currentDisciplines = field.value || [];
                                    
                                    // Check if the value is already selected
                                    if (currentDisciplines.includes(value)) {
                                      // If it is, remove it
                                      field.onChange(currentDisciplines.filter((discipline) => discipline !== value));
                                    } else {
                                      // If it's not, add it
                                      field.onChange([...currentDisciplines, value]);
                                    }
                                  }}
                                  value={field.value?.length ? field.value[0] : undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select at least one discipline" />
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
                              </div>
                              
                              {field.value && field.value.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {field.value.map((discipline) => (
                                    <div key={discipline} className="bg-primary/10 text-primary rounded-md px-2 py-1 text-sm flex items-center">
                                      {discipline}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          field.onChange(field.value?.filter((d) => d !== discipline));
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
                          name="levels"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Performance Levels</FormLabel>
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
                                      <SelectValue placeholder="Select at least one level" />
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
                                        
                                        return disciplineLevels.map((level) => (
                                          <SelectItem key={level} value={level}>
                                            {level}
                                          </SelectItem>
                                        ));
                                      })()
                                    ) : (
                                      <>
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
                      
                      <div className="flex justify-between mt-4">
                        <Button onClick={prevTab} type="button" variant="outline">
                          Back
                        </Button>
                        <Button onClick={nextTab} type="button">
                          Next: Media & Description
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="media" className="space-y-6 pt-4">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Photos</h3>
                        <div className="space-y-4 mb-6">
                          <div className="border rounded-md p-4">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    // Create form data
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    
                                    try {
                                      // Upload the file directly without loading toast
                                      const response = await fetch("/api/upload", {
                                        method: "POST",
                                        body: formData,
                                      });
                                      
                                      if (!response.ok) {
                                        throw new Error("Failed to upload file");
                                      }
                                      
                                      const data = await response.json();
                                      
                                      // Add the URL to the list
                                      setPhotoUrls([...photoUrls, data.url]);
                                      
                                      // Clear the input
                                      e.target.value = "";
                                      
                                      // Success notification removed
                                    } catch (error) {
                                      console.error("Upload error:", error);
                                      toast({
                                        title: "Upload failed",
                                        description: "There was an error uploading your image. Please try again.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  className="flex-1"
                                />
                                <Button type="button" size="sm" onClick={() => {
                                  // Find the file input and trigger a click
                                  const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
                                  if (fileInput) {
                                    fileInput.click();
                                  }
                                }}>
                                  <Plus className="h-4 w-4 mr-1" /> Add Photo
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
                                    if (!file) return;
                                    
                                    // Check file size (max 25MB)
                                    if (file.size > 25 * 1024 * 1024) {
                                      toast({
                                        title: "File too large",
                                        description: "Video must be less than 25MB.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    
                                    // Create form data
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    
                                    try {
                                      // Upload the file directly without loading toast
                                      const response = await fetch("/api/upload", {
                                        method: "POST",
                                        body: formData,
                                      });
                                      
                                      if (!response.ok) {
                                        throw new Error("Failed to upload file");
                                      }
                                      
                                      const data = await response.json();
                                      
                                      // Add the URL to the list
                                      setVideoUrls([...videoUrls, data.url]);
                                      
                                      // Clear the input
                                      e.target.value = "";
                                      
                                      // Success notification removed
                                    } catch (error) {
                                      console.error("Upload error:", error);
                                      toast({
                                        title: "Upload failed",
                                        description: "There was an error uploading your video. Please try again.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  className="flex-1"
                                />
                                <Button type="button" size="sm" onClick={() => {
                                  // Find the file input and trigger a click
                                  const fileInput = document.querySelector('input[type="file"][accept="video/*"]') as HTMLInputElement;
                                  if (fileInput) {
                                    fileInput.click();
                                  }
                                }}>
                                  <Plus className="h-4 w-4 mr-1" /> Add Video
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
                      
                      <div className="flex justify-between mt-8">
                        <Button onClick={prevTab} type="button" variant="outline">
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          disabled={isSubmitting}
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
                            "Submit Listing"
                          )}
                        </Button>
                      </div>
                    </TabsContent>
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