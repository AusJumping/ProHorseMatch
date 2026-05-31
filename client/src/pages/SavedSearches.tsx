import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Bell, BellOff, CheckCircle, Mail, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PushStep = 'prompt' | 'enabling' | 'success' | 'unsupported' | 'denied';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const response = await fetch('/api/push/vapid-public-key');
  if (!response.ok) throw new Error('Could not get server key');
  const { publicKey } = await response.json();
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
  const p256dhKey = subscription.getKey('p256dh');
  const authKey = subscription.getKey('auth');
  await apiRequest('POST', '/api/push/subscribe', {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: p256dhKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhKey)))) : '',
      auth: authKey ? btoa(String.fromCharCode(...Array.from(new Uint8Array(authKey)))) : '',
    },
  });
}

const savedSearchSchema = z.object({
  name: z.string().min(1, "Search name is required"),
  disciplines: z.array(z.string()).optional(),
  levels: z.array(z.string()).optional(),
  breeds: z.array(z.string()).optional(),
  sexes: z.array(z.string()).optional(),
  characteristics: z.array(z.string()).optional(),
  age_min: z.number().min(0).max(50).optional(),
  age_max: z.number().min(0).max(50).optional(),
  height_min: z.number().min(10).max(20).optional(),
  height_max: z.number().min(10).max(20).optional(),
  price_min: z.number().min(0).optional(),
  price_max: z.number().min(0).optional(),
  currency: z.string().optional(),
  location_country: z.string().optional(),
  sire: z.string().optional(),
  dam_sire: z.string().optional(),
  email_notifications: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

type SavedSearchFormData = z.infer<typeof savedSearchSchema>;

export default function SavedSearches() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSearch, setEditingSearch] = useState<any>(null);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushStep, setPushStep] = useState<PushStep>('prompt');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const supportsPush = typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingSearch(null);
    setShowPushPrompt(false);
    setPushStep('prompt');
    form.reset();
  };

  const handleEnablePush = async () => {
    setPushStep('enabling');
    try {
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        setPushStep('denied');
        return;
      }
      await subscribeToPush();
      queryClient.invalidateQueries({ queryKey: ['/api/push/status'] });
      setPushStep('success');
    } catch {
      setPushStep('denied');
    }
  };

  // Get constants for form options
  const { data: constants } = useQuery({
    queryKey: ["/api/constants"],
  });

  // Get saved searches
  const { data: savedSearches = [], isLoading } = useQuery({
    queryKey: ["/api/saved-searches"],
  });

  const form = useForm<SavedSearchFormData>({
    resolver: zodResolver(savedSearchSchema),
    defaultValues: {
      name: "",
      disciplines: [],
      levels: [],
      breeds: [],
      sexes: [],
      characteristics: [],
      email_notifications: true,
      is_active: true,
    },
  });

  // Create saved search mutation
  const createMutation = useMutation({
    mutationFn: async (data: SavedSearchFormData) => {
      return apiRequest("POST", "/api/saved-searches", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      form.reset();
      // Instead of closing, show the post-save push prompt
      if (!supportsPush) {
        setPushStep('unsupported');
      } else if (Notification.permission === 'denied') {
        setPushStep('denied');
      } else {
        setPushStep('prompt');
      }
      setShowPushPrompt(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create saved search",
        variant: "destructive",
      });
    },
  });

  // Update saved search mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SavedSearchFormData> }) => {
      return apiRequest("PUT", `/api/saved-searches/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      setEditingSearch(null);
      form.reset();
      toast({
        title: "Success",
        description: "Saved search updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update saved search",
        variant: "destructive",
      });
    },
  });

  // Delete saved search mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/saved-searches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-searches"] });
      toast({
        title: "Success",
        description: "Saved search deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete saved search",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SavedSearchFormData) => {
    if (editingSearch) {
      updateMutation.mutate({ id: editingSearch.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (search: any) => {
    setEditingSearch(search);
    form.reset({
      name: search.name,
      disciplines: search.disciplines || [],
      levels: search.levels || [],
      breeds: search.breeds || [],
      sexes: search.sexes || [],
      characteristics: search.characteristics || [],
      age_min: search.age_min || undefined,
      age_max: search.age_max || undefined,
      height_min: search.height_min || undefined,
      height_max: search.height_max || undefined,
      price_min: search.price_min || undefined,
      price_max: search.price_max || undefined,
      currency: search.currency || "",
      location_country: search.location_country || "",
      sire: search.sire || "",
      dam_sire: search.dam_sire || "",
      email_notifications: search.email_notifications,
      is_active: search.is_active,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this saved search?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleNotifications = (id: number, currentValue: boolean) => {
    updateMutation.mutate({
      id,
      data: { email_notifications: !currentValue },
    });
  };

  const toggleActive = (id: number, currentValue: boolean) => {
    updateMutation.mutate({
      id,
      data: { is_active: !currentValue },
    });
  };

  if (isLoading) {
    return (
      <Layout pageTitle="Saved Searches">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading saved searches...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Saved Searches">
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Saved Searches</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your saved horse searches with email notifications
          </p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingSearch} onOpenChange={(open) => {
          if (!open) closeDialog();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Search
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {showPushPrompt ? (
              /* ── Post-save confirmation + push prompt ── */
              <div className="space-y-6 py-2">
                {/* Email confirmation — always shown */}
                <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900">Your email alert is ready.</p>
                    <p className="text-sm text-green-800 mt-0.5">
                      We'll email you when new horses match this search.
                    </p>
                  </div>
                </div>

                {/* Push prompt — varies by state */}
                {pushStep === 'unsupported' && (
                  <div className="flex items-start gap-3 rounded-lg bg-muted p-4">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Email alerts are active. Instant phone alerts are not available on this device.
                    </p>
                  </div>
                )}

                {pushStep === 'denied' && (
                  <div className="flex items-start gap-3 rounded-lg bg-muted p-4">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Email alerts are active. You can enable instant phone alerts anytime from your profile settings.
                    </p>
                  </div>
                )}

                {pushStep === 'prompt' && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Smartphone className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Want instant phone alerts too?</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Get notified on your phone as soon as a matching horse is listed. You'll still receive email alerts if you skip this.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <Button onClick={handleEnablePush} className="flex-1">
                        <Bell className="h-4 w-4 mr-2" />
                        Enable instant phone alerts
                      </Button>
                      <Button variant="outline" onClick={closeDialog} className="flex-1">
                        Email is fine for now
                      </Button>
                    </div>
                  </div>
                )}

                {pushStep === 'enabling' && (
                  <div className="flex items-center justify-center gap-3 rounded-lg border p-6 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600" />
                    Setting up instant phone alerts…
                  </div>
                )}

                {pushStep === 'success' && (
                  <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <CheckCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-900 font-medium">
                      Instant phone alerts are now enabled for this alert.
                    </p>
                  </div>
                )}

                {(pushStep === 'success' || pushStep === 'unsupported' || pushStep === 'denied') && (
                  <Button onClick={closeDialog} className="w-full">Done</Button>
                )}
              </div>
            ) : (
              /* ── Standard create / edit form ── */
              <>
            <DialogHeader>
              <DialogTitle>
                {editingSearch ? "Edit Saved Search" : "Create New Saved Search"}
              </DialogTitle>
              <DialogDescription>
                Set up search criteria and get notified when matching horses are listed
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dressage horses in Germany" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {constants && (
                  <>
                    <FormField
                      control={form.control}
                      name="disciplines"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disciplines</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                            {constants.disciplines.map((discipline: string) => (
                              <div key={discipline} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(discipline)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, discipline]);
                                    } else {
                                      field.onChange(current.filter((d) => d !== discipline));
                                    }
                                  }}
                                />
                                <Label className="text-sm">{discipline}</Label>
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
                          <FormLabel>Levels</FormLabel>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                            {constants.jumpingLevels?.map((level: string) => (
                              <div key={level} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(level)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, level]);
                                    } else {
                                      field.onChange(current.filter((l) => l !== level));
                                    }
                                  }}
                                />
                                <Label className="text-sm">{level}</Label>
                              </div>
                            ))}
                            {constants.dressageLevels?.map((level: string) => (
                              <div key={level} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(level)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, level]);
                                    } else {
                                      field.onChange(current.filter((l) => l !== level));
                                    }
                                  }}
                                />
                                <Label className="text-sm">{level}</Label>
                              </div>
                            ))}
                            {constants.eventingLevels?.map((level: string) => (
                              <div key={level} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(level)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, level]);
                                    } else {
                                      field.onChange(current.filter((l) => l !== level));
                                    }
                                  }}
                                />
                                <Label className="text-sm">{level}</Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sexes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sex</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                            {constants.sexes.map((sex: string) => (
                              <div key={sex} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={field.value?.includes(sex)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, sex]);
                                    } else {
                                      field.onChange(current.filter((s) => s !== sex));
                                    }
                                  }}
                                />
                                <Label className="text-sm">{sex}</Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 5"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 15"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="height_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Height (hands)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 15.2"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Height (hands)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 17.0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 10000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 100000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="AUD">AUD</SelectItem>
                            <SelectItem value="NZD">NZD</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sire"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sire (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Contendro I"
                            {...field}
                          />
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
                        <FormLabel>Dam Sire (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Lordanos"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control}
                    name="email_notifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Email notifications</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Active search</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingSearch ? "Update Search" : "Create Search"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
            </>
          )}
          </DialogContent>
        </Dialog>
      </div>

      {savedSearches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No saved searches yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first saved search to get notified when matching horses are listed
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {savedSearches.map((search: any) => (
            <Card key={search.id} className={search.is_active ? "" : "opacity-60"}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{search.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant={search.is_active ? "default" : "secondary"}>
                      {search.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Created {new Date(search.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {search.disciplines && search.disciplines.length > 0 && (
                    <div>
                      <span className="font-medium">Disciplines:</span> {search.disciplines.join(", ")}
                    </div>
                  )}
                  {(search.age_min || search.age_max) && (
                    <div>
                      <span className="font-medium">Age:</span>{" "}
                      {search.age_min && search.age_max
                        ? `${search.age_min} - ${search.age_max} years`
                        : search.age_min
                        ? `${search.age_min}+ years`
                        : `Up to ${search.age_max} years`}
                    </div>
                  )}
                  {(search.price_min || search.price_max) && (
                    <div>
                      <span className="font-medium">Price:</span>{" "}
                      {search.currency || ""}{" "}
                      {search.price_min && search.price_max
                        ? `${search.price_min.toLocaleString()} - ${search.price_max.toLocaleString()}`
                        : search.price_min
                        ? `${search.price_min.toLocaleString()}+`
                        : `Up to ${search.price_max?.toLocaleString()}`}
                    </div>
                  )}
                  {search.location_country && (
                    <div>
                      <span className="font-medium">Location:</span> {search.location_country}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleNotifications(search.id, search.email_notifications)}
                  >
                    {search.email_notifications ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Switch
                    checked={search.is_active}
                    onCheckedChange={() => toggleActive(search.id, search.is_active)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(search)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(search.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      </div>
    </Layout>
  );
}