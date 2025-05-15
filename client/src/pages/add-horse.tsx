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
import { Loader2, Plus, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { useMobile } from "@/hooks/use-mobile";

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
  price: z.number().min(1, "Price must be at least 1"),
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
      price: 0,
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
                        
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <Select onValueChange={value => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select price range" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="5000">€5,000</SelectItem>
                                  <SelectItem value="10000">€10,000</SelectItem>
                                  <SelectItem value="15000">€15,000</SelectItem>
                                  <SelectItem value="20000">€20,000</SelectItem>
                                  <SelectItem value="25000">€25,000</SelectItem>
                                  <SelectItem value="30000">€30,000</SelectItem>
                                  <SelectItem value="40000">€40,000</SelectItem>
                                  <SelectItem value="50000">€50,000</SelectItem>
                                  <SelectItem value="75000">€75,000</SelectItem>
                                  <SelectItem value="100000">€100,000</SelectItem>
                                  <SelectItem value="150000">€150,000</SelectItem>
                                  <SelectItem value="200000">€200,000+</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                                  <SelectItem value="AUD">Australian Dollar (AUD)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
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
                          render={() => (
                            <FormItem>
                              <FormLabel>Disciplines</FormLabel>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {constants?.disciplines?.map((discipline: string) => (
                                  <FormField
                                    key={discipline}
                                    control={form.control}
                                    name="disciplines"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={discipline}
                                          className="flex flex-row items-start space-x-2"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(discipline)}
                                              onCheckedChange={(checked) => {
                                                return checked
                                                  ? field.onChange([...field.value, discipline])
                                                  : field.onChange(
                                                      field.value?.filter(
                                                        (value) => value !== discipline
                                                      )
                                                    )
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="font-normal cursor-pointer">
                                            {discipline}
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
                        
                        <FormField
                          control={form.control}
                          name="levels"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Performance Level</FormLabel>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                {form.watch("disciplines").includes("Jumping") && constants?.levels?.Jumping?.map((level: string) => (
                                  <FormItem
                                    key={level}
                                    className="flex flex-row items-start space-x-2"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(level)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, level])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== level
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {level}
                                    </FormLabel>
                                  </FormItem>
                                ))}
                                
                                {form.watch("disciplines").includes("Dressage") && constants?.levels?.Dressage?.map((level: string) => (
                                  <FormItem
                                    key={level}
                                    className="flex flex-row items-start space-x-2"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(level)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, level])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== level
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {level}
                                    </FormLabel>
                                  </FormItem>
                                ))}
                                
                                {form.watch("disciplines").includes("Eventing") && constants?.levels?.Eventing?.map((level: string) => (
                                  <FormItem
                                    key={level}
                                    className="flex flex-row items-start space-x-2"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(level)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, level])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== level
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {level}
                                    </FormLabel>
                                  </FormItem>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
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
                            <div className="flex gap-2">
                              <Input
                                value={newPhotoUrl}
                                onChange={(e) => setNewPhotoUrl(e.target.value)}
                                placeholder="Enter photo URL"
                              />
                              <Button type="button" size="icon" onClick={addPhotoUrl}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormDescription className="mt-1">
                              Enter a URL for each photo you want to add
                            </FormDescription>
                          </div>
                          
                          <div className="space-y-2">
                            {photoUrls.map((url, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <img src={url} alt={`Photo ${index + 1}`} className="w-12 h-12 object-cover rounded" />
                                <span className="flex-1 truncate text-sm">{url}</span>
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
                            <div className="flex gap-2">
                              <Input
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                placeholder="Enter video URL"
                              />
                              <Button type="button" size="icon" onClick={addVideoUrl}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormDescription className="mt-1">
                              Enter a URL for each video you want to add
                            </FormDescription>
                          </div>
                          
                          <div className="space-y-2">
                            {videoUrls.map((url, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-12 h-12 bg-neutral-200 rounded flex items-center justify-center">
                                  <svg className="h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <span className="flex-1 truncate text-sm">{url}</span>
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
