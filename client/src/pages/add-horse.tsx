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
                    <TabsTrigger value="details">Specifications</TabsTrigger>
                    <TabsTrigger value="media">Media & Description</TabsTrigger>
                  </TabsList>
                  
                  <ScrollArea className={isMobile ? "h-[calc(100vh-380px)]" : ""}>
                    <TabsContent value="basic" className="space-y-6 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        
                        <div>
                          <FormLabel className="block mb-2">Currency & Price Range</FormLabel>
                          
                          {/* Currency Selector */}
                          <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                              <FormItem className="mb-4">
                                <FormControl>
                                  <CurrencySelector 
                                    defaultValue={field.value}
                                    onChange={(value) => {
                                      field.onChange(value);
                                      // Update form currency value
                                      form.setValue("currency", value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Only show price range after currency is selected */}
                          {form.watch("currency") && (
                            <>
                              <FormLabel className="block mb-2 mt-4">Price Range (in {form.watch("currency")})</FormLabel>
                              <div className="grid grid-cols-2 gap-3">
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
                                          <SelectItem value="40000">
                                            {form.watch("currency") === "USD" ? "$40,000" : 
                                             form.watch("currency") === "GBP" ? "£40,000" : 
                                             form.watch("currency") === "AUD" ? "A$40,000" : 
                                             "€40,000"}
                                          </SelectItem>
                                          <SelectItem value="50000">
                                            {form.watch("currency") === "USD" ? "$50,000" : 
                                             form.watch("currency") === "GBP" ? "£50,000" : 
                                             form.watch("currency") === "AUD" ? "A$50,000" : 
                                             "€50,000"}
                                          </SelectItem>
                                          <SelectItem value="75000">
                                            {form.watch("currency") === "USD" ? "$75,000" : 
                                             form.watch("currency") === "GBP" ? "£75,000" : 
                                             form.watch("currency") === "AUD" ? "A$75,000" : 
                                             "€75,000"}
                                          </SelectItem>
                                          <SelectItem value="100000">
                                            {form.watch("currency") === "USD" ? "$100,000" : 
                                             form.watch("currency") === "GBP" ? "£100,000" : 
                                             form.watch("currency") === "AUD" ? "A$100,000" : 
                                             "€100,000"}
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
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
                                          <SelectItem value="25000">
                                            {form.watch("currency") === "USD" ? "$25,000" : 
                                             form.watch("currency") === "GBP" ? "£25,000" : 
                                             form.watch("currency") === "AUD" ? "A$25,000" : 
                                             "€25,000"}
                                          </SelectItem>
                                          <SelectItem value="50000">
                                            {form.watch("currency") === "USD" ? "$50,000" : 
                                             form.watch("currency") === "GBP" ? "£50,000" : 
                                             form.watch("currency") === "AUD" ? "A$50,000" : 
                                             "€50,000"}
                                          </SelectItem>
                                          <SelectItem value="75000">
                                            {form.watch("currency") === "USD" ? "$75,000" : 
                                             form.watch("currency") === "GBP" ? "£75,000" : 
                                             form.watch("currency") === "AUD" ? "A$75,000" : 
                                             "€75,000"}
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
                                          <SelectItem value="400000">
                                            {form.watch("currency") === "USD" ? "$400,000" : 
                                             form.watch("currency") === "GBP" ? "£400,000" : 
                                             form.watch("currency") === "AUD" ? "A$400,000" : 
                                             "€400,000"}
                                          </SelectItem>
                                          <SelectItem value="500000">
                                            {form.watch("currency") === "USD" ? "$500,000+" : 
                                             form.watch("currency") === "GBP" ? "£500,000+" : 
                                             form.watch("currency") === "AUD" ? "A$500,000+" : 
                                             "€500,000+"}
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </>
                          )}
                        
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
                                  <SelectItem value="Australia">Australia</SelectItem>
                                  <SelectItem value="Belgium">Belgium</SelectItem>
                                  <SelectItem value="France">France</SelectItem>
                                  <SelectItem value="Germany">Germany</SelectItem>
                                  <SelectItem value="Netherlands">Netherlands</SelectItem>
                                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                  <SelectItem value="United States">United States</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="disciplines"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discipline</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange([value])} 
                                value={field.value?.length ? field.value[0] : undefined}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a discipline" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {constants?.disciplines?.map((discipline: string) => (
                                    <SelectItem key={discipline} value={discipline}>
                                      {discipline}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Choose the primary discipline for this horse
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="levels"
                          render={({ field }) => {
                            // Get the selected discipline (or default to empty array)
                            const selectedDiscipline = form.watch("disciplines")[0] || "";
                            // Get all available levels for the selected discipline
                            const availableLevels = selectedDiscipline && constants?.levels?.[selectedDiscipline] || [];

                            return (
                              <FormItem>
                                <FormLabel>Performance Level</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange([value])} 
                                  value={field.value?.length ? field.value[0] : undefined}
                                  disabled={!selectedDiscipline}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={selectedDiscipline ? "Select a performance level" : "Please select a discipline first"} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableLevels.map((level: string) => (
                                      <SelectItem key={level} value={level}>
                                        {level}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Choose the current performance level for this horse
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="space-y-6 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age (years)</FormLabel>
                              <Select onValueChange={value => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select age" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
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
                                  <SelectItem value="16">16+ years</SelectItem>
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
                                onValueChange={value => {
                                  field.onChange(parseFloat(value));
                                  // Calculate cm equivalent for height_cm field
                                  form.setValue("height_cm", Math.round(parseFloat(value) * 10.16));
                                }} 
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select height" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="14.0">14.0 hh (142 cm)</SelectItem>
                                  <SelectItem value="14.1">14.1 hh (144 cm)</SelectItem>
                                  <SelectItem value="14.2">14.2 hh (147 cm)</SelectItem>
                                  <SelectItem value="14.3">14.3 hh (150 cm)</SelectItem>
                                  <SelectItem value="15.0">15.0 hh (152 cm)</SelectItem>
                                  <SelectItem value="15.1">15.1 hh (155 cm)</SelectItem>
                                  <SelectItem value="15.2">15.2 hh (157 cm)</SelectItem>
                                  <SelectItem value="15.3">15.3 hh (160 cm)</SelectItem>
                                  <SelectItem value="16.0">16.0 hh (163 cm)</SelectItem>
                                  <SelectItem value="16.1">16.1 hh (165 cm)</SelectItem>
                                  <SelectItem value="16.2">16.2 hh (168 cm)</SelectItem>
                                  <SelectItem value="16.3">16.3 hh (170 cm)</SelectItem>
                                  <SelectItem value="17.0">17.0 hh (173 cm)</SelectItem>
                                  <SelectItem value="17.1">17.1 hh (175 cm)</SelectItem>
                                  <SelectItem value="17.2">17.2 hh (178 cm)</SelectItem>
                                  <SelectItem value="17.3">17.3 hh (180 cm)</SelectItem>
                                  <SelectItem value="18.0">18.0 hh (183 cm)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Standard measurement for horses (hands high)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="sex"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sex</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select sex" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {constants?.sexes?.map((sex: string) => (
                                    <SelectItem key={sex} value={sex}>{sex}</SelectItem>
                                  ))}
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
                                defaultValue={field.value[0] || "Warmblood"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select breed" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Warmblood">Warmblood</SelectItem>
                                  <SelectItem value="Thoroughbred">Thoroughbred</SelectItem>
                                  <SelectItem value="OTT Thoroughbred">OTT Thoroughbred</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Breeding Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="sire"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sire</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter sire name" {...field} />
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
                                  <Input placeholder="Enter dam name" {...field} />
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
                                  <Input placeholder="Enter dam sire name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <FormField
                        control={form.control}
                        name="characteristics"
                        render={() => (
                          <FormItem>
                            <FormLabel>Characteristics</FormLabel>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                              {constants?.characteristics?.map((characteristic: string) => (
                                <FormField
                                  key={characteristic}
                                  control={form.control}
                                  name="characteristics"
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="media" className="space-y-6 pt-4">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide details about your horse's background, training, temperament, etc." 
                                  className="min-h-[150px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Be detailed and honest to attract serious buyers.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Photos</h3>
                        <p className="text-sm text-neutral-500">Add photos of your horse (minimum 1)</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="flex-1"
                                  onClick={() => document.getElementById('photo-upload')?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Select photo
                                </Button>
                                <input
                                  id="photo-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    
                                    try {
                                      const response = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: formData,
                                      });
                                      
                                      if (!response.ok) throw new Error('Upload failed');
                                      
                                      const data = await response.json();
                                      setPhotoUrls([...photoUrls, data.url]);
                                      
                                      // Reset the input
                                      e.target.value = '';
                                    } catch (error) {
                                      console.error('Upload error:', error);
                                      toast({
                                        title: "Upload failed",
                                        description: "There was an error uploading your photo. Please try again.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                />
                              </div>
                              <FormDescription>
                                Select photos from your device to upload
                              </FormDescription>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {photoUrls.map((url, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-12 h-12 bg-neutral-100 rounded flex items-center justify-center overflow-hidden">
                                  <img src={url.startsWith('http') ? url : url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                </div>
                                <span className="flex-1 truncate text-sm">{url.split('/').pop()}</span>
                                <Button type="button" size="icon" variant="ghost" onClick={() => removePhotoUrl(url)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {photoUrls.length === 0 && (
                              <p className="text-sm text-neutral-500 italic">No photos added yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Videos (Optional)</h3>
                        <p className="text-sm text-neutral-500">Add videos of your horse in action</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="flex-1"
                                  onClick={() => document.getElementById('video-upload')?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Select video
                                </Button>
                                <input
                                  id="video-upload"
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    
                                    try {
                                      const response = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: formData,
                                      });
                                      
                                      if (!response.ok) throw new Error('Upload failed');
                                      
                                      const data = await response.json();
                                      setVideoUrls([...videoUrls, data.url]);
                                      
                                      // Reset the input
                                      e.target.value = '';
                                    } catch (error) {
                                      console.error('Upload error:', error);
                                      toast({
                                        title: "Upload failed",
                                        description: "There was an error uploading your video. Please try again.",
                                        variant: "destructive"
                                      });
                                    }
                                  }}
                                />
                              </div>
                              <FormDescription>
                                Select videos from your device to upload
                              </FormDescription>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {videoUrls.map((url, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-12 h-12 bg-neutral-200 rounded flex items-center justify-center">
                                  <FileVideo className="h-6 w-6 text-neutral-500" />
                                </div>
                                <span className="flex-1 truncate text-sm">{url.split('/').pop()}</span>
                                <Button type="button" size="icon" variant="ghost" onClick={() => removeVideoUrl(url)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {videoUrls.length === 0 && (
                              <p className="text-sm text-neutral-500 italic">No videos added yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {photoUrls.length === 0 && (
                        <div className="bg-orange-100 border border-orange-200 text-orange-800 px-4 py-3 rounded">
                          <p className="text-sm font-medium">You must add at least one photo to continue</p>
                        </div>
                      )}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
                {/* Form buttons inside the form tag */}
                <div className="flex justify-between pt-6">
                  <Button type="button" variant="outline" onClick={prevTab} disabled={activeTab === "basic"}>
                    Previous
                  </Button>
                  {activeTab === "media" ? (
                    <Button 
                      type="button"
                      onClick={() => {
                        // Manually validate form and submit
                        form.setValue("photos", photoUrls);
                        form.setValue("videos", videoUrls);
                        form.handleSubmit(onSubmit)();
                      }}
                      disabled={isSubmitting || photoUrls.length === 0}
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
                  ) : (
                    <Button 
                      type="button"
                      onClick={nextTab}
                      disabled={isSubmitting}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
          {/* No CardFooter here since we moved the buttons inside the form */}
        </Card>
      </div>
    </Layout>
  );
}
