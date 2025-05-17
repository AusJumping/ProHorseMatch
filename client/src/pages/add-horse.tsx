import { useState, useRef } from "react";
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
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  owner_id: z.number(),
  location_country: z.string().min(1, "Country is required"),
  location_radius_km: z.number().optional(),
  disciplines: z.array(z.string()).min(1, "Select at least one discipline"),
  levels: z.array(z.string()).min(1, "Select at least one level"),
  breeds: z.array(z.string()).min(1, "Select at least one breed"),
  age: z.number().min(0, "Age must be at least 0").max(30, "Age must be less than 30"),
  height_hands: z.number().min(10, "Height must be at least 10 hands").max(20, "Height must be less than 20 hands"),
  height_cm: z.number().optional(),
  sex: z.string().min(1, "Sex is required"),
  sire: z.string().optional(),
  dam: z.string().optional(),
  dam_sire: z.string().optional(),
  characteristics: z.array(z.string()).optional(),
  price_min: z.number().min(1, "Minimum price must be at least 1"),
  price_max: z.number().min(1, "Maximum price must be at least 1"),
  currency: z.string().min(1, "Currency is required"),
  description: z.string().optional(),
  additional_info: z.string().optional(),
  photos: z.array(z.string()).min(1, "At least one photo is required"),
  videos: z.array(z.string()).optional(),
});

type HorseFormValues = z.infer<typeof horseFormSchema>;

export default function AddHorse() {
  const isMobile = useMobile();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
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
      location_country: "",
      location_radius_km: 0,
      disciplines: [],
      levels: [],
      breeds: ["Warmblood"],
      age: 0,
      height_hands: 0,
      height_cm: 0,
      sex: "",
      sire: "",
      dam: "",
      dam_sire: "",
      characteristics: [],
      price_min: 0,
      price_max: 0,
      currency: "EUR",
      description: "",
      photos: [],
      videos: [],
    }
  });

  // This function is called when the form is submitted
  const onSubmit = async (data: HorseFormValues) => {
    console.log("Form submission started", data);
    try {
      setIsSubmitting(true);
      
      // Include the photo and video URLs in the form data
      const submissionData = {
        ...data,
        photos: photoUrls,
        videos: videoUrls,
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
      
      // Make the API request with the complete data
      await apiRequest("POST", "/api/horses", submissionData);
      
      toast({
        title: "Horse added successfully",
        description: "Your horse has been listed for sale.",
      });
      
      // Invalidate horses query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/horses'] });
      
      // Redirect to the horses page
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add horse. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPhotoUrl = () => {
    if (newPhotoUrl && !photoUrls.includes(newPhotoUrl)) {
      setPhotoUrls([...photoUrls, newPhotoUrl]);
      setNewPhotoUrl("");
    }
  };

  const removePhotoUrl = (url: string) => {
    setPhotoUrls(photoUrls.filter(photo => photo !== url));
  };

  const addVideoUrl = () => {
    if (newVideoUrl && !videoUrls.includes(newVideoUrl)) {
      setVideoUrls([...videoUrls, newVideoUrl]);
      setNewVideoUrl("");
    }
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
                                      <Select onValueChange={value => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
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
                                      <Select onValueChange={value => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
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
                          
                          <FormField
                            control={form.control}
                            name="location_radius_km"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Radius (km)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    placeholder="Distance radius in kilometers" 
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  How far from your location are you willing to show this horse?
                                </FormDescription>
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
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Age in years" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                />
                              </FormControl>
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
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Height in hands" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                />
                              </FormControl>
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
                              <FormLabel>Sex</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a sex" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {constants && constants.sexes ? (
                                    constants.sexes.map((sex) => (
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
                          name="breeds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Breed</FormLabel>
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
                                      constants.levels.map((level) => (
                                        <SelectItem key={level} value={level}>
                                          {level}
                                        </SelectItem>
                                      ))
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
                          <div className="flex items-end gap-2">
                            <Input
                              value={newPhotoUrl}
                              onChange={(e) => setNewPhotoUrl(e.target.value)}
                              placeholder="Enter URL for photo"
                              className="flex-1"
                            />
                            <Button type="button" onClick={addPhotoUrl} size="sm">
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
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
                          <div className="flex items-end gap-2">
                            <Input
                              value={newVideoUrl}
                              onChange={(e) => setNewVideoUrl(e.target.value)}
                              placeholder="Enter URL for video (YouTube, Vimeo, etc.)"
                              className="flex-1"
                            />
                            <Button type="button" onClick={addVideoUrl} size="sm">
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
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
                        <Button type="submit" disabled={isSubmitting}>
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