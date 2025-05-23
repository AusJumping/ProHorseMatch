import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, X, Upload, Image, FileVideo } from "lucide-react";
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
  breeds: z.array(z.string()).min(1, "Select at least one breed"),
  sex: z.string().min(1, "Sex is required"),
  currency: z.string().min(1, "Currency is required"),
  age: z.number().min(1, "Age must be at least 1 year").max(40, "Age must be less than 40 years"),
  price_min: z.number().min(1, "Minimum price is required"),
  price_max: z.number().min(1, "Maximum price is required"),
  name: z.string().min(1, "Horse name is required"),
  
  // Optional fields
  sire_name: z.string().optional(),
  dam_sire_name: z.string().optional(),
  height_hands: z.number().optional(),
  height_cm: z.number().optional(),
  characteristics: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  description: z.string().optional(),
  location_radius_km: z.number().optional(),
}).refine(
  (data) => data.price_min <= data.price_max,
  {
    message: "Minimum price must be less than or equal to maximum price",
    path: ["price_max"],
  }
);

type HorseFormValues = z.infer<typeof horseFormSchema>;

export default function AddHorse() {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const isMobile = useMobile();
  const { currency } = useCurrency();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Fetch constants data
  const { data: constants, isLoading: constantsLoading } = useQuery({
    queryKey: ['/api/constants'],
  });

  const form = useForm<HorseFormValues>({
    resolver: zodResolver(horseFormSchema),
    defaultValues: {
      name: "",
      location_country: "",
      disciplines: [],
      levels: [],
      breeds: [],
      sex: "",
      currency: currency || "AUD",
      age: 5,
      price_min: 10000,
      price_max: 50000,
      sire_name: "",
      dam_sire_name: "",
      height_hands: 16,
      height_cm: 162,
      characteristics: [],
      photos: [],
      videos: [],
      description: "",
      location_radius_km: 50,
    },
  });

  const onSubmit = async (data: HorseFormValues) => {
    try {
      setIsSubmitting(true);

      if (!user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to add a horse",
          variant: "destructive",
        });
        return;
      }

      // Combine photo and video URLs
      const allPhotos = [...photoUrls, ...(data.photos || [])];
      const allVideos = [...videoUrls, ...(data.videos || [])];

      const horseData = {
        ...data,
        owner_id: user.id,
        photos: allPhotos,
        videos: allVideos,
      };

      console.log("Submitting horse data:", horseData);

      const response = await apiRequest("POST", "/api/horses", horseData);
      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Horse listing created successfully",
        });

        // Invalidate horses cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/horses'] });

        // Navigate to the horses list
        navigate("/my-horses");
      } else {
        throw new Error(result.message || "Failed to create horse listing");
      }
    } catch (error: any) {
      console.error("Submit horse error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create horse listing",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload handlers
  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (type === 'image') {
        setPhotoUrls(prev => [...prev, result.url]);
      } else {
        setVideoUrls(prev => [...prev, result.url]);
      }

      toast({
        title: "Success",
        description: `${type === 'image' ? 'Photo' : 'Video'} uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: `Failed to upload ${type}`,
        variant: "destructive",
      });
    }
  };

  const removePhotoUrl = (url: string) => {
    setPhotoUrls(photoUrls.filter(photo => photo !== url));
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
              List your horse for sale and connect with potential buyers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Basic Information Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age (years) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="40"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
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
                          <FormLabel>Sex *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sex" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {constants?.sexes?.map((sex: string) => (
                                <SelectItem key={sex} value={sex}>
                                  {sex}
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
                      name="breeds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Breeds *</FormLabel>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                            {constants?.breeds?.map((breed: string) => (
                              <div key={breed} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`breed-${breed}`}
                                  checked={field.value?.includes(breed)}
                                  onCheckedChange={(checked) => {
                                    const updatedBreeds = checked
                                      ? [...(field.value || []), breed]
                                      : (field.value || []).filter((b) => b !== breed);
                                    field.onChange(updatedBreeds);
                                  }}
                                />
                                <label htmlFor={`breed-${breed}`} className="text-sm">
                                  {breed}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Performance Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Performance & Training</h3>
                  
                  <FormField
                    control={form.control}
                    name="disciplines"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disciplines *</FormLabel>
                        <div className="flex flex-wrap gap-4">
                          {constants?.disciplines?.map((discipline: string) => (
                            <div key={discipline} className="flex items-center space-x-2">
                              <Checkbox
                                id={`discipline-${discipline}`}
                                checked={field.value?.includes(discipline)}
                                onCheckedChange={(checked) => {
                                  const updatedDisciplines = checked
                                    ? [...(field.value || []), discipline]
                                    : (field.value || []).filter((d) => d !== discipline);
                                  field.onChange(updatedDisciplines);
                                }}
                              />
                              <label htmlFor={`discipline-${discipline}`} className="text-sm font-medium">
                                {discipline}
                              </label>
                            </div>
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
                        <FormLabel>Competition Levels *</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                          {Object.entries(constants?.levels || {}).flatMap(([discipline, disciplineLevels]: [string, any]) => 
                            (disciplineLevels || []).map((level: string) => (
                              <div key={`${discipline}-${level}`} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`level-${discipline}-${level}`}
                                  checked={field.value?.includes(level)}
                                  onCheckedChange={(checked) => {
                                    const updatedLevels = checked
                                      ? [...(field.value || []), level]
                                      : (field.value || []).filter((l) => l !== level);
                                    field.onChange(updatedLevels);
                                  }}
                                />
                                <label htmlFor={`level-${discipline}-${level}`} className="text-sm">
                                  {level} ({discipline})
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="characteristics"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Characteristics</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                          {constants?.characteristics?.map((characteristic: string) => (
                            <div key={characteristic} className="flex items-center space-x-2">
                              <Checkbox
                                id={`char-${characteristic}`}
                                checked={field.value?.includes(characteristic)}
                                onCheckedChange={(checked) => {
                                  const updatedCharacteristics = checked
                                    ? [...(field.value || []), characteristic]
                                    : (field.value || []).filter((c) => c !== characteristic);
                                  field.onChange(updatedCharacteristics);
                                }}
                              />
                              <label htmlFor={`char-${characteristic}`} className="text-sm">
                                {characteristic}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Physical Details Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Physical Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="height_hands"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (hands)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="10"
                              max="20"
                              placeholder="16.2"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="height_cm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height (cm)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="100"
                              max="200"
                              placeholder="165"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
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
                      name="sire_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sire Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter sire name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dam_sire_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dam Sire Name</FormLabel>
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

                {/* Pricing & Location Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Pricing & Location</h3>
                  
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency *</FormLabel>
                        <CurrencySelector onCurrencyChange={field.onChange} defaultCurrency={field.value} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Price *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select minimum price" />
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
                              <SelectItem value="100000">
                                {form.watch("currency") === "USD" ? "$100,000" : 
                                 form.watch("currency") === "GBP" ? "£100,000" : 
                                 form.watch("currency") === "AUD" ? "A$100,000" : 
                                 "€100,000"}
                              </SelectItem>
                              <SelectItem value="250000">
                                {form.watch("currency") === "USD" ? "$250,000" : 
                                 form.watch("currency") === "GBP" ? "£250,000" : 
                                 form.watch("currency") === "AUD" ? "A$250,000" : 
                                 "€250,000"}
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

                    <FormField
                      control={form.control}
                      name="price_max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Price *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select maximum price" />
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
                              <SelectItem value="100000">
                                {form.watch("currency") === "USD" ? "$100,000" : 
                                 form.watch("currency") === "GBP" ? "£100,000" : 
                                 form.watch("currency") === "AUD" ? "A$100,000" : 
                                 "€100,000"}
                              </SelectItem>
                              <SelectItem value="250000">
                                {form.watch("currency") === "USD" ? "$250,000" : 
                                 form.watch("currency") === "GBP" ? "£250,000" : 
                                 form.watch("currency") === "AUD" ? "A$250,000" : 
                                 "€250,000"}
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
                          <FormLabel>Search Radius (km)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="1000"
                              placeholder="50"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Media & Description Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Media & Description</h3>
                  
                  {/* Photo Upload */}
                  <div className="space-y-4">
                    <FormLabel>Photos</FormLabel>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Image className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="photo-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Upload photos
                            </span>
                            <input
                              id="photo-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                if (e.target.files) {
                                  Array.from(e.target.files).forEach(file => {
                                    handleFileUpload(file, 'image');
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {photoUrls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {photoUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removePhotoUrl(url)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Video Upload */}
                  <div className="space-y-4">
                    <FormLabel>Videos</FormLabel>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <FileVideo className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="video-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Upload videos
                            </span>
                            <input
                              id="video-upload"
                              type="file"
                              className="sr-only"
                              accept="video/*"
                              multiple
                              onChange={(e) => {
                                if (e.target.files) {
                                  Array.from(e.target.files).forEach(file => {
                                    handleFileUpload(file, 'video');
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {videoUrls.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videoUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <video
                              src={url}
                              controls
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeVideoUrl(url)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your horse's temperament, training, achievements, and any other relevant information..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide detailed information about your horse to help potential buyers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Creating Listing..." : "Create Horse Listing"}
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