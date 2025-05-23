import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useParams } from "wouter";
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

// Form schema for editing a horse
const horseFormSchema = z.object({
  id: z.number(),
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
  sire: z.string().min(1, "Sire information is required"),
  dam: z.string().optional(),
  dam_sire: z.string().min(1, "Dam Sire information is required"),
  characteristics: z.array(z.string()).optional(),
  price_min: z.number().min(1, "Minimum price must be at least 1"),
  price_max: z.number().min(1, "Maximum price must be at least 1"),
  currency: z.string().min(1, "Currency is required"),
  description: z.string().optional(),
  photos: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
});

type HorseFormValues = z.infer<typeof horseFormSchema>;

export default function EditHorse() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { id } = useParams();
  const horseId = parseInt(id);
  
  const [activeTab, setActiveTab] = useState("details");
  const [photoUrl, setPhotoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMobile();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });
  
  // Fetch constants for dropdowns
  const { data: constants, isLoading: constantsLoading } = useQuery({
    queryKey: ['/api/constants'],
  });

  // Fetch horse data
  const { data: horse, isLoading: horseLoading } = useQuery({
    queryKey: [`/api/horses/${horseId}`],
    enabled: !!horseId
  });

  const form = useForm<HorseFormValues>({
    resolver: zodResolver(horseFormSchema),
    defaultValues: {
      id: 0,
      name: "",
      owner_id: 0,
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

  // Update form values when horse data is loaded
  useEffect(() => {
    if (horse) {
      form.reset({
        id: horse.id,
        name: horse.name,
        owner_id: horse.owner_id,
        location_country: horse.location_country,
        location_radius_km: horse.location_radius_km || 0,
        disciplines: horse.disciplines,
        levels: horse.levels,
        breeds: horse.breeds,
        age: horse.age,
        height_hands: horse.height_hands || 0,
        height_cm: horse.height_cm || 0,
        sex: horse.sex,
        sire: horse.sire || "",
        dam: horse.dam || "",
        dam_sire: horse.dam_sire || "",
        characteristics: horse.characteristics || [],
        price_min: horse.price_min,
        price_max: horse.price_max,
        currency: horse.currency,
        description: horse.description || "",
        photos: horse.photos || [],
        videos: horse.videos || [],
      });
    }
  }, [horse, form]);

  // This function is called when the form is submitted
  const onSubmit = async (data: HorseFormValues) => {
    console.log("Form submission started", data);
    try {
      setIsSubmitting(true);
      
      // Create a clean request object with proper types
      const requestData = {
        ...data,
        // Ensure numeric fields are numbers
        age: Number(data.age),
        height_hands: Number(data.height_hands),
        height_cm: Number(data.height_cm || 0),
        price_min: Number(data.price_min),
        price_max: Number(data.price_max),
        location_radius_km: Number(data.location_radius_km || 0),
        // Ensure array fields are properly formatted
        disciplines: Array.isArray(data.disciplines) ? data.disciplines : [],
        levels: Array.isArray(data.levels) ? data.levels : [],
        breeds: Array.isArray(data.breeds) ? data.breeds : [],
        characteristics: Array.isArray(data.characteristics) ? data.characteristics : [],
        photos: Array.isArray(data.photos) ? data.photos : [],
        videos: Array.isArray(data.videos) ? data.videos : [],
      };
      
      // Log the cleaned data for debugging
      console.log("Submitting form data:", JSON.stringify(requestData, null, 2));
      
      // Make the API request and store the response
      const updatedHorse = await apiRequest("PUT", `/api/horses/${horseId}`, requestData);
      console.log("Response from server:", updatedHorse);
      
      // Show success message
      toast({
        title: "Horse updated",
        description: "Your horse has been updated successfully",
      });
      
      // Invalidate cached horse data with immediate refetch to update UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/horses'] }),
        queryClient.invalidateQueries({ queryKey: [`/api/horses/${horseId}`] }),
        queryClient.invalidateQueries({ queryKey: ['/api/horses/owner'] })
      ]);
      
      // Force a refetch of all horses to ensure fresh data
      await queryClient.refetchQueries({ queryKey: ['/api/horses'] });
      
      // Show a success message first before navigating
      setTimeout(() => {
        // Navigate back to My Horses page after a small delay
        navigate("/my-horses");
      }, 1500);
    } catch (error) {
      console.error("Error updating horse:", error);
      toast({
        title: "Error",
        description: "There was an error updating your horse",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPhoto = () => {
    if (!photoUrl) return;
    
    const currentPhotos = form.getValues("photos") || [];
    form.setValue("photos", [...currentPhotos, photoUrl]);
    setPhotoUrl("");
  };

  const removePhoto = (index: number) => {
    const currentPhotos = form.getValues("photos") || [];
    form.setValue("photos", currentPhotos.filter((_, i) => i !== index));
  };

  const addVideo = () => {
    if (!videoUrl) return;
    
    const currentVideos = form.getValues("videos") || [];
    form.setValue("videos", [...currentVideos, videoUrl]);
    setVideoUrl("");
  };

  const removeVideo = (index: number) => {
    const currentVideos = form.getValues("videos") || [];
    form.setValue("videos", currentVideos.filter((_, i) => i !== index));
  };

  if (userLoading || constantsLoading || horseLoading) {
    return (
      <Layout pageTitle="Edit Horse">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      pageTitle="Edit Horse" 
      showBackButton 
      onBackClick={() => navigate('/my-horses')}
    >
      <div className="container max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-accent">Edit Horse</CardTitle>
            <CardDescription>Update details for your horse listing</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="details">Basic Details</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="pedigree">Pedigree</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-6 pt-4">
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sex"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sex</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sex" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {constants?.sexes.map((sex: string) => (
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
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age (years)</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value?.toString() || ""} 
                                onValueChange={(value) => field.onChange(parseInt(value))}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select age" />
                                </SelectTrigger>
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
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="height_hands"
                        render={({ field }) => {
                          // Format the height value to a string with one decimal place for comparison
                          const formattedValue = field.value ? field.value.toFixed(1) : "";
                          
                          return (
                            <FormItem>
                              <FormLabel>Height (hands)</FormLabel>
                              <FormControl>
                                <Select 
                                  value={formattedValue.toString()} 
                                  onValueChange={(value) => field.onChange(parseFloat(value))}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select height" />
                                  </SelectTrigger>
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
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location_country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value || ""} 
                                onValueChange={(value) => field.onChange(value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Australia">Australia</SelectItem>
                                  <SelectItem value="Germany">Germany</SelectItem>
                                  <SelectItem value="Netherlands">Netherlands</SelectItem>
                                  <SelectItem value="Belgium">Belgium</SelectItem>
                                  <SelectItem value="France">France</SelectItem>
                                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                  <SelectItem value="United States">United States</SelectItem>
                                  <SelectItem value="Ireland">Ireland</SelectItem>
                                  <SelectItem value="Sweden">Sweden</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="font-medium">Price Range</div>
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
                                        <SelectValue placeholder="Select min price" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="5000">5,000</SelectItem>
                                      <SelectItem value="10000">10,000</SelectItem>
                                      <SelectItem value="15000">15,000</SelectItem>
                                      <SelectItem value="20000">20,000</SelectItem>
                                      <SelectItem value="25000">25,000</SelectItem>
                                      <SelectItem value="30000">30,000</SelectItem>
                                      <SelectItem value="35000">35,000</SelectItem>
                                      <SelectItem value="40000">40,000</SelectItem>
                                      <SelectItem value="45000">45,000</SelectItem>
                                      <SelectItem value="50000">50,000</SelectItem>
                                      <SelectItem value="60000">60,000</SelectItem>
                                      <SelectItem value="70000">70,000</SelectItem>
                                      <SelectItem value="80000">80,000</SelectItem>
                                      <SelectItem value="90000">90,000</SelectItem>
                                      <SelectItem value="100000">100,000</SelectItem>
                                      <SelectItem value="150000">150,000</SelectItem>
                                      <SelectItem value="200000">200,000</SelectItem>
                                      <SelectItem value="250000">250,000</SelectItem>
                                      <SelectItem value="300000">300,000</SelectItem>
                                      <SelectItem value="350000">350,000</SelectItem>
                                      <SelectItem value="400000">400,000</SelectItem>
                                      <SelectItem value="450000">450,000</SelectItem>
                                      <SelectItem value="500000">500,000</SelectItem>
                                      <SelectItem value="1000000">1,000,000+</SelectItem>
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
                                  <Select onValueChange={value => {
                                    const newValue = parseInt(value);
                                    field.onChange(newValue);
                                    
                                    // Check if min price is greater than new max price
                                    const currentMinPrice = form.getValues("price_min");
                                    if (currentMinPrice > newValue) {
                                      // Update min price to match max price
                                      form.setValue("price_min", newValue);
                                      toast({
                                        description: "Minimum price has been adjusted to match the new maximum price.",
                                      });
                                    }
                                  }} value={field.value?.toString()}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select max price" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="10000">10,000</SelectItem>
                                      <SelectItem value="15000">15,000</SelectItem>
                                      <SelectItem value="20000">20,000</SelectItem>
                                      <SelectItem value="25000">25,000</SelectItem>
                                      <SelectItem value="30000">30,000</SelectItem>
                                      <SelectItem value="35000">35,000</SelectItem>
                                      <SelectItem value="40000">40,000</SelectItem>
                                      <SelectItem value="45000">45,000</SelectItem>
                                      <SelectItem value="50000">50,000</SelectItem>
                                      <SelectItem value="60000">60,000</SelectItem>
                                      <SelectItem value="70000">70,000</SelectItem>
                                      <SelectItem value="80000">80,000</SelectItem>
                                      <SelectItem value="90000">90,000</SelectItem>
                                      <SelectItem value="100000">100,000</SelectItem>
                                      <SelectItem value="150000">150,000</SelectItem>
                                      <SelectItem value="200000">200,000</SelectItem>
                                      <SelectItem value="250000">250,000</SelectItem>
                                      <SelectItem value="300000">300,000</SelectItem>
                                      <SelectItem value="350000">350,000</SelectItem>
                                      <SelectItem value="400000">400,000</SelectItem>
                                      <SelectItem value="450000">450,000</SelectItem>
                                      <SelectItem value="500000">500,000</SelectItem>
                                      <SelectItem value="1000000">1,000,000+</SelectItem>
                                      <SelectItem value="2000000">2,000,000+</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="AUD">AUD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="breeds"
                      render={({ field }) => {
                        // Ensure field.value is always an array
                        const selectedBreed = Array.isArray(field.value) && field.value.length > 0 
                          ? field.value[0] 
                          : "Warmblood"; // Default value if no breed is selected
                        
                        return (
                          <FormItem>
                            <FormLabel>Breed</FormLabel>
                            <Select 
                              value={selectedBreed}
                              onValueChange={(value) => {
                                // Convert single selection to array for compatibility with schema
                                console.log("Selected breed:", value);
                                field.onChange([value]);
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select breed" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {constants?.breeds.map((breed: string) => (
                                  <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter horse description" 
                              className="min-h-32" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="performance" className="space-y-6 pt-4">
                    <FormField
                      control={form.control}
                      name="disciplines"
                      render={({ field }) => {
                        // Ensure field.value is always an array
                        const selectedDiscipline = Array.isArray(field.value) && field.value.length > 0 
                          ? field.value[0] 
                          : undefined;
                        
                        return (
                          <FormItem>
                            <FormLabel>Discipline</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange([value])} 
                              value={selectedDiscipline}
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
                        );
                      }}
                    />
                    
                    <FormField
                      control={form.control}
                      name="levels"
                      render={({ field }) => {
                        // Get the selected discipline (or default to empty array)
                        const selectedDiscipline = Array.isArray(form.getValues("disciplines")) && form.getValues("disciplines").length > 0 
                          ? form.getValues("disciplines")[0] 
                          : "";
                        
                        // Get available levels for the selected discipline
                        const availableLevels = selectedDiscipline && constants?.levels?.[selectedDiscipline] || [];
                        
                        // Get the current selected level (if any)
                        const selectedLevel = Array.isArray(field.value) && field.value.length > 0 
                          ? field.value[0] 
                          : undefined;
                        
                        return (
                          <FormItem>
                            <FormLabel>Performance Level</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange([value])} 
                              value={selectedLevel}
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
                    
                    <FormField
                      control={form.control}
                      name="characteristics"
                      render={({ field }) => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel>Characteristics</FormLabel>
                            <FormDescription>Select all that apply</FormDescription>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {constants?.characteristics.map((trait: string) => {
                              // Ensure field.value is always an array
                              const characteristics = Array.isArray(field.value) ? field.value : [];
                              
                              // Debug log to see what's happening
                              console.log(`Characteristic ${trait} checked:`, characteristics.includes(trait));
                              
                              return (
                                <div
                                  key={trait}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <Checkbox
                                    id={`trait-${trait}`}
                                    checked={characteristics.includes(trait)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        // Add the trait if it's not already in the array
                                        if (!characteristics.includes(trait)) {
                                          const newCharacteristics = [...characteristics, trait];
                                          console.log("Adding characteristic:", newCharacteristics);
                                          field.onChange(newCharacteristics);
                                        }
                                      } else {
                                        // Remove the trait if it's in the array
                                        const newCharacteristics = characteristics.filter((value) => value !== trait);
                                        console.log("Removing characteristic:", newCharacteristics);
                                        field.onChange(newCharacteristics);
                                      }
                                    }}
                                  />
                                  <label 
                                    htmlFor={`trait-${trait}`}
                                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {trait}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="pedigree" className="space-y-6 pt-4">
                    <FormField
                      control={form.control}
                      name="sire"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sire (Father)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter sire's name" {...field} />
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
                          <FormLabel>Dam (Mother)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter dam's name" {...field} />
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
                          <FormLabel>Dam's Sire (Maternal Grandfather)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter dam's sire's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="media" className="space-y-6 pt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Photos</h3>
                      <div className="flex flex-col md:flex-row gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => document.getElementById('photo-upload-edit')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Select Photo
                        </Button>
                        <input
                          id="photo-upload-edit"
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
                              const currentPhotos = form.getValues("photos") || [];
                              form.setValue("photos", [...currentPhotos, data.url]);
                              
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
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {form.watch("photos")?.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={photo} 
                              alt={`Horse photo ${index + 1}`} 
                              className="w-full h-40 object-cover rounded-md"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://via.placeholder.com/300x200?text=Image+Error";
                              }}
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removePhoto(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <Separator className="my-6" />
                      
                      <h3 className="text-lg font-medium">Videos</h3>
                      <div className="flex flex-col md:flex-row gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => document.getElementById('video-upload-edit')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Select Video
                        </Button>
                        <input
                          id="video-upload-edit"
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
                              const currentVideos = form.getValues("videos") || [];
                              form.setValue("videos", [...currentVideos, data.url]);
                              
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
                      
                      <div className="space-y-2 mt-4">
                        {form.watch("videos")?.map((video, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                            <div className="flex items-center gap-2">
                              <FileVideo className="h-4 w-4 text-neutral-500" />
                              <span className="truncate flex-1">{video.split('/').pop()}</span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeVideo(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate('/my-horses')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Horse
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}