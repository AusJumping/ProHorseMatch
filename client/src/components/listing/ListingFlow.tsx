import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, FileVideo, LoaderCircle, Plus, Share2, X } from "lucide-react";
import type { Horse } from "@shared/schema";
import { ownsHorse } from "@shared/horsePermissions";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import ListingPhotos from "./ListingPhotos";
import ListingLevelPicker from "./ListingLevelPicker";
import ListingBuyerPreview from "./ListingBuyerPreview";
import {
  AGE_OPTIONS_CREATE,
  AGE_OPTIONS_EDIT,
  HEIGHT_OPTIONS_CREATE,
  HEIGHT_OPTIONS_EDIT,
  freshListing,
  editableListingValues,
  validateListing,
  validateListingStep,
  type ListingData,
  type ListingMode,
  type ListingStep,
} from "./listing-model";

type Constants = { countries?: string[]; disciplines?: string[]; levels?: Record<string, string[]>; breeds?: string[]; sexes?: string[]; colours?: string[]; characteristics?: string[]; educationLevels?: string[] };

const STEPS: { id: ListingStep; title: string; eyebrow: string }[] = [
  { id: "photos", title: "Photos", eyebrow: "01 / Photos" },
  { id: "facts", title: "Key facts", eyebrow: "02 / Key facts" },
  { id: "pedigree", title: "Pedigree", eyebrow: "03 / Pedigree" },
  { id: "description", title: "About your horse", eyebrow: "04 / Description" },
  { id: "price", title: "Price range", eyebrow: "05 / Price range" },
  { id: "preview", title: "Preview", eyebrow: "06 / Preview" },
];
const createMinPrices = [5000,10000,15000,20000,25000,30000,35000,40000,45000,50000,55000,60000,65000,70000,75000,80000,85000,90000,95000,100000,150000,200000,250000,300000,350000,400000,450000,500000];
const createMaxPrices = [...createMinPrices.slice(1), 999999];
const editMinPrices = [...createMinPrices, 1000000];
const editMaxPrices = [...createMinPrices.slice(1), 1000000, 2000000];

function formatPriceOption(option: string, currency: string, mode: ListingMode) {
  if (option === "999999") {
    const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "AUD" ? "A$" : currency === "NZD" ? "NZ$" : "$";
    return `${symbol}Over 500,000`;
  }
  const amount = Number(option).toLocaleString();
  if (mode === "edit") return option === "1000000" || option === "2000000" ? `${amount}+` : amount;
  const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "AUD" ? "A$" : currency === "NZD" ? "NZ$" : "$";
  return `${symbol}${amount}`;
}

function ChipGroup({ label, options, selected, onChange, multiple = false }: { label: string; options: string[]; selected: string[]; onChange: (values: string[]) => void; multiple?: boolean }) {
  return <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold text-[#34332f]">{label}</legend><div className="flex flex-wrap gap-2">{options.map((option) => {
    const active = selected.includes(option);
    return <button key={option} type="button" aria-pressed={active} onClick={() => onChange(multiple ? active ? selected.filter((item) => item !== option) : [...selected, option] : active ? [] : [option])}
      className={`min-h-10 rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e] ${active ? "border-[#2b2b2b] bg-[#2b2b2b] text-white" : "border-[#d9d7d0] bg-[#fbfaf7] text-[#34332f] hover:border-[#cdac6e]"}`}>{option}</button>;
  })}</div></fieldset>;
}
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block space-y-2"><span className="text-sm font-semibold text-[#34332f]">{label}</span>{children}{hint ? <span className="block text-xs leading-5 text-[#77756f]">{hint}</span> : null}</label>;
}
function SelectField({ label, value, options, onChange, placeholder = "Choose one", optionLabel }: { label: string; value: string; options: string[]; onChange: (value: string) => void; placeholder?: string; optionLabel?: (option: string) => string }) {
  return <Field label={label}><Select value={value} onValueChange={onChange}><SelectTrigger className="h-12 rounded-xl border-[#dedbd2] bg-[#fbfaf7]"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.filter(Boolean).map((option) => <SelectItem key={option} value={option}>{optionLabel?.(option) ?? option}</SelectItem>)}</SelectContent></Select></Field>;
}

export default function ListingFlow({ mode }: { mode: ListingMode }) {
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const horseId = mode === "edit" ? Number(params.id) : null;
  const invalidHorseId = mode === "edit" && (!Number.isInteger(horseId) || Number(horseId) < 1);
  const { user, isLoading: authLoading } = useAuth();
  const { toast: notify } = useToast();
  const activeNotice = useRef<{ dismiss: () => void } | null>(null);
  const toast = (options: Parameters<typeof notify>[0]) => {
    activeNotice.current?.dismiss();
    const notice = notify(options);
    activeNotice.current = notice;
    return notice;
  };
  const { data: constantsData, isLoading: constantsLoading, isError: constantsError, refetch: retryConstants } = useQuery<Constants>({ queryKey: ["/api/constants"] });
  const { data: horse, isLoading: horseLoading, isError: horseError, refetch: retryHorse } = useQuery<Horse>({
    queryKey: [`/api/horses/${horseId}`], enabled: mode === "edit" && Boolean(user?.is_selling) && !invalidHorseId,
  });
  const constants = constantsData || {};
  const [values, setValues] = useState<ListingData>(() => freshListing(0));
  const valuesRef = useRef(values);
  const [step, setStep] = useState<ListingStep>("photos");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoUrlError, setVideoUrlError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [pedigreeReminder, setPedigreeReminder] = useState(false);
  const [promotionDialog, setPromotionDialog] = useState(false);
  const [promotion, setPromotion] = useState<boolean | null>(null);
  const [published, setPublished] = useState<Horse | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareDialog, setShareDialog] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  const shareInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const loadedIdentity = useRef("");
  const photoBusyRef = useRef(false);
  const draftKey = user ? `phm-listing-draft:${user.id}:${mode}:${horseId ?? "new"}` : "";
  const identityKey = user ? `${mode}:${user.id}:${horseId ?? "new"}:${user.is_selling ? "seller" : "buyer"}` : "";
  const currentStepIndex = STEPS.findIndex((item) => item.id === step);
  const authorized = mode === "create" ? Boolean(user?.is_selling) : Boolean(user?.is_selling && horse && (ownsHorse(user.id, horse) || user.email === "info@australianjumping.com.au"));

  useEffect(() => {
    if (!user || mode !== "create" || loadedIdentity.current === identityKey) return;
    if (!user.is_selling) {
      loadedIdentity.current = identityKey;
      setLoadError("Only seller accounts can create horse listings.");
      setInitialized(true);
      return;
    }
    loadedIdentity.current = identityKey;
    setLoadError("");
    const key = `phm-listing-draft:${user.id}:create:new`;
    let draftReadFailed = false;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.ownerId === user.id && draft?.values) {
          const restored = { ...freshListing(user.id), ...draft.values, owner_id: user.id };
          valuesRef.current = restored;
          setValues(restored);
          if (STEPS.some((item) => item.id === draft.step)) setStep(draft.step);
        } else { const initial = freshListing(user.id); valuesRef.current = initial; setValues(initial); }
      } else { const initial = freshListing(user.id); valuesRef.current = initial; setValues(initial); }
    } catch {
      const initial = freshListing(user.id);
      valuesRef.current = initial;
      setValues(initial);
      draftReadFailed = true;
    }
    setInitialized(true);
    setSaved(!draftReadFailed);
    setSaveError(draftReadFailed);
  }, [user, mode, initialized, identityKey]);

  useEffect(() => {
    if (!user || mode !== "edit" || loadedIdentity.current === identityKey) return;
    if (!user.is_selling) {
      loadedIdentity.current = identityKey;
      setLoadError("Only seller accounts can edit horse listings.");
      setInitialized(true);
      return;
    }
    if (invalidHorseId) {
      loadedIdentity.current = identityKey;
      setLoadError("The listing address is invalid.");
      setInitialized(true);
      return;
    }
    if (horseError && !horse) {
      loadedIdentity.current = identityKey;
      setLoadError("This listing couldn’t be loaded. Nothing has been changed.");
      setInitialized(true);
      return;
    }
    if (!horse) return;
    if (!ownsHorse(user.id, horse) && user.email !== "info@australianjumping.com.au") {
      loadedIdentity.current = identityKey;
      setLoadError("This listing belongs to another account. You can’t edit it.");
      setInitialized(true);
      return;
    }
    setLoadError("");
    const fromHorse = (): ListingData => ({
      ...freshListing(user.id), owner_id: Number(horse.owner_id),
      name: horse.name || "", location_country: horse.location_country || "", location_radius_km: Number(horse.location_radius_km) || 0,
      disciplines: horse.disciplines || [], other_disciplines: horse.other_disciplines || [], levels: horse.levels || [], breeds: horse.breeds || [],
      age: Number(horse.age) || 0, height_hands: horse.height_hands === null ? "young_horse" : Number(horse.height_hands) || "young_horse",
      height_cm: Number(horse.height_cm) || 0,
      sex: horse.sex || "", colour: horse.colour || "", sire: horse.sire || "", dam: horse.dam || "", dam_sire: horse.dam_sire || "",
      education_level: horse.education_level || "", characteristics: horse.characteristics || [], description: horse.description || "",
      additional_info: horse.additional_info || "", photos: horse.photos || [], videos: horse.videos || [],
      price_min: Number(horse.price_min) || 0, price_max: Number(horse.price_max) || 0, currency: horse.currency || "AUD",
    });
    let loaded = fromHorse();
    let draftReadFailed = false;
    try {
      const raw = localStorage.getItem(`phm-listing-draft:${user.id}:edit:${horseId}`);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.ownerId === user.id && draft?.listingId === horseId && draft?.values) loaded = { ...loaded, ...draft.values, owner_id: Number(horse.owner_id) };
        if (draft?.ownerId === user.id && draft?.listingId === horseId && STEPS.some((item) => item.id === draft.step)) setStep(draft.step);
      }
    } catch {
      draftReadFailed = true;
    }
    valuesRef.current = loaded;
    setValues(loaded);
    loadedIdentity.current = identityKey;
    setInitialized(true);
    setSaved(!draftReadFailed);
    setSaveError(draftReadFailed);
  }, [user, mode, horse, horseId, initialized, horseError, invalidHorseId, identityKey]);

  const persistDraft = useCallback((nextValues: ListingData, nextStep: ListingStep) => {
    if (!initialized || !user || !draftKey || published || !authorized || loadedIdentity.current !== identityKey) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ownerId: user.id, listingId: horseId, step: nextStep, values: nextValues }));
      setSaved(true);
      setSaveError(false);
    } catch {
      setSaved(false);
      setSaveError(true);
    }
  }, [authorized, draftKey, horseId, identityKey, initialized, published, user]);
  const update = (key: keyof ListingData, value: unknown) => {
    activeNotice.current?.dismiss();
    const next = { ...valuesRef.current, [key]: value };
    valuesRef.current = next;
    setValues(next);
    setSaved(false);
    persistDraft(next, step);
  };
  const goToStep = (nextStep: ListingStep) => {
    if (photoBusyRef.current || videoBusy) return;
    activeNotice.current?.dismiss();
    setStep(nextStep);
    persistDraft(valuesRef.current, nextStep);
  };
  useEffect(() => {
    if (!initialized || !user || !authorized || loadedIdentity.current !== identityKey) return;
    const onPageHide = () => persistDraft(valuesRef.current, step);
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [authorized, identityKey, initialized, persistDraft, step, user]);
  const stepErrors = (target: ListingStep): string[] => validateListingStep(mode, values, target);
  const goNext = () => {
    const errors = stepErrors(step);
    if (errors.length) {
      toast({ title: "A few details still need attention", description: errors[0], variant: "destructive" });
      return;
    }
    if (step === "pedigree" && !values.sire.trim() && !values.dam.trim() && !values.dam_sire.trim()) {
      setPedigreeReminder(true);
      return;
    }
    if (currentStepIndex < STEPS.length - 1) goToStep(STEPS[currentStepIndex + 1].id);
  };
  const movePhoto = (from: number, to: number) => {
    const currentPhotos = valuesRef.current.photos;
    if (photoBusyRef.current || to < 0 || to >= currentPhotos.length || from === to) return;
    const photos = [...currentPhotos]; const [item] = photos.splice(from, 1); photos.splice(to, 0, item); update("photos", photos);
  };
  const uploadPhotos = async (files: FileList | null) => {
    if (!files?.length || photoBusyRef.current) return;
    const available = mode === "create" ? Math.max(0, 4 - valuesRef.current.photos.length) : files.length;
    if (!available) { toast({ title: "Maximum photos reached", description: "You can add up to four photos.", variant: "destructive" }); return; }
    if (files.length > available) toast({ title: `Only ${available} photo${available === 1 ? "" : "s"} can be added`, description: "Four photos is the maximum for a listing." });
    photoBusyRef.current = true;
    setPhotoBusy(true);
    const additions: string[] = [];
    for (const file of Array.from(files).slice(0, available)) {
      if (!file.type.startsWith("image/")) { toast({ title: "Unsupported file", description: `${file.name} is not an image.`, variant: "destructive" }); continue; }
      try {
        const headers: Record<string,string> = {}; const token = localStorage.getItem("authToken"); if (token) headers.Authorization = `Bearer ${token}`;
        const form = new FormData(); form.append("image", file);
        const response = await fetch("/api/upload-image", { method: "POST", headers, body: form, credentials: "include" });
        if (!response.ok) { const err = await response.json().catch(() => null); throw new Error(err?.error || `Upload failed (${response.status})`); }
        const result = await response.json(); if (result?.url) additions.push(result.url); else throw new Error("Upload did not return an image URL.");
      } catch (error) { toast({ title: "Photo upload failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); }
    }
    if (additions.length) {
      const photos = [...valuesRef.current.photos, ...additions];
      update("photos", mode === "create" ? photos.slice(0, 4) : photos);
    }
    photoBusyRef.current = false;
    setPhotoBusy(false);
  };
  const uploadVideo = async (file?: File) => {
    if (!file) return;
    const sizeMB = file.size / (1024 * 1024);
    if (!file.type.startsWith("video/")) { toast({ title: "Unsupported file", description: "Choose a video file.", variant: "destructive" }); return; }
    if (sizeMB > 500) { toast({ title: "File too large", description: `Video is ${sizeMB.toFixed(1)}MB. Maximum size is 500MB.`, variant: "destructive" }); return; }
    setVideoBusy(true);
    try {
      const headers: Record<string,string> = {}; const token = localStorage.getItem("authToken"); if (token) headers.Authorization = `Bearer ${token}`;
      const form = new FormData(); form.append("video", file);
      const response = await fetch("/api/upload-video", { method: "POST", headers, body: form, credentials: "include" });
      if (!response.ok) { const err = await response.json().catch(() => null); throw new Error(err?.error || `Upload failed (${response.status})`); }
      const result = await response.json(); if (!result?.url) throw new Error("Upload did not return a video URL.");
      update("videos", [...valuesRef.current.videos, result.url]);
    } catch (error) { toast({ title: "Video upload failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); }
    finally { setVideoBusy(false); if (videoInput.current) videoInput.current.value = ""; }
  };
  const addVideoUrl = () => {
    try {
      const parsed = new URL(videoUrl.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("invalid");
      update("videos", [...valuesRef.current.videos, videoUrl.trim()]);
      setVideoUrl("");
      setVideoUrlError("");
    } catch {
      setVideoUrlError("Enter a complete video URL beginning with https://.");
    }
  };
  const publish = async () => {
    if (photoBusyRef.current || videoBusy) {
      toast({ title: "Media upload in progress", description: "Wait for the upload to finish before publishing.", variant: "destructive" });
      return;
    }
    if (mode === "create" && promotion === null) return;
    const validation = validateListing(mode, values);
    if (validation) {
      toast({ title: "Please finish the listing", description: validation.message, variant: "destructive" });
      goToStep(validation.step);
      setPromotionDialog(false);
      return;
    }
    setPublishing(true);
    const payload: any = {
      ...editableListingValues(values), owner_id: mode === "create" ? user!.id : Number(horse!.owner_id),
      age: Number(values.age), height_hands: values.height_hands === "young_horse" ? "young_horse" : Number(values.height_hands),
      height_cm: values.height_hands === "young_horse" ? Number(values.height_cm || 0) : Number(values.height_cm || Math.round(Number(values.height_hands) * 10.16)),
      price_min: Number(values.price_min), price_max: Number(values.price_max), location_radius_km: Number(values.location_radius_km || 0),
      disciplines: values.disciplines || [], other_disciplines: values.other_disciplines || [], levels: values.levels || [], breeds: values.breeds || [],
      characteristics: values.characteristics || [], photos: values.photos || [], videos: values.videos || [],
      social_media_promotion: mode === "create" ? promotion : (horse as any)?.social_media_promotion ?? false,
    };
    try {
      const response = mode === "create" ? await apiRequest<Horse>("POST", "/api/horses", payload) : await apiRequest<Horse>("PUT", `/api/horses/${horseId}`, payload);
      activeNotice.current?.dismiss();
      setPublished(response);
      try {
        if (draftKey) localStorage.removeItem(draftKey);
      } catch {
        setSaveError(true);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/horses"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/horses/owner"] }),
        ...(mode === "edit" ? [queryClient.invalidateQueries({ queryKey: [`/api/horses/${horseId}`] })] : []),
      ].map((result) => result.catch(() => undefined)));
    } catch (error) {
      toast({ title: mode === "create" ? "Listing not published" : "Changes not saved", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally { setPublishing(false); setPromotionDialog(false); }
  };
  const backToListings = () => navigate(mode === "edit" && user?.email === "info@australianjumping.com.au" ? "/admin" : "/my-horses");
  const shareListing = async (listing: Horse) => {
    const url = `${window.location.origin}/horse/${listing.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.name, url });
        return;
      } catch { /* provide the URL in a visible fallback if the share sheet is unavailable or dismissed */ }
    }
    setShareUrl(url);
    setShareFeedback("");
    setShareDialog(true);
  };
  const copyShareUrl = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable.");
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback("Link copied. It’s ready to share.");
    } catch {
      shareInput.current?.select();
      setShareFeedback("Copy isn’t available here. Select the link above and copy it to share.");
    }
  };
  const detailHorse = (published || (mode === "edit" ? horse : null)) as Horse | null;
  const preview = { ...values, height_hands: values.height_hands === "young_horse" ? null : values.height_hands, id: horseId || 0, owner_id: user?.id || 0, created_at: detailHorse?.created_at || new Date().toISOString() } as Horse;
  const loading = authLoading || (Boolean(user?.is_selling && !invalidHorseId) && constantsLoading) || (mode === "edit" && Boolean(user?.is_selling) && !invalidHorseId && horseLoading) || (Boolean(user) && !initialized && !invalidHorseId) || (Boolean(user) && loadedIdentity.current !== identityKey && !invalidHorseId);
  const displayError = invalidHorseId ? "The listing address is invalid." : loadError || (mode === "edit" && horseError ? "This listing couldn’t be loaded. Nothing has been changed." : "");

  if (published) return <Layout pageTitle={mode === "create" ? "Listing published" : "Listing updated"} hideMobileNavigation>
    <section className="mx-auto flex min-h-[75dvh] max-w-xl flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#cdac6e]/15 text-[#8b713c]"><Check className="h-8 w-8" /></div>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#8b713c]">{mode === "create" ? "A new chapter" : "All up to date"}</p>
      <h1 className="mt-3 font-accent text-3xl font-bold text-[#2b2b2b]">{mode === "create" ? "Your listing is live." : "Your listing is updated."}</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-[#77756f]">{published.name} is ready for buyers to discover.</p>
      {saveError ? <p role="status" className="mt-3 max-w-sm text-xs leading-5 text-[#9e5344]">Your listing is live, but its local draft couldn’t be removed from this device.</p> : null}
      <Button className="mt-8 h-12 rounded-full bg-[#2b2b2b] px-7 hover:bg-[#1c1c1c]" onClick={() => navigate(`/horse/${published.id}`)}>View my listing <ArrowRight className="ml-2 h-4 w-4" /></Button>
      <Button variant="ghost" className="mt-3 rounded-full text-[#705d37]" onClick={() => void shareListing(published)}><Share2 className="mr-2 h-4 w-4" />Share your listing</Button>
      <button type="button" onClick={backToListings} className="mt-4 text-sm text-[#77756f] underline underline-offset-4">Return to My Horses</button>
    </section>
    <Dialog open={shareDialog} onOpenChange={setShareDialog}>
      <DialogContent className="rounded-[1.5rem] border-[#dedbd2] bg-[#fbfaf7]">
        <DialogHeader><DialogTitle className="font-accent text-2xl">Share your listing</DialogTitle><DialogDescription>Copy this public link to share {published.name} with buyers.</DialogDescription></DialogHeader>
        <Input ref={shareInput} aria-label="Public listing URL" readOnly value={shareUrl} onFocus={(event)=>event.currentTarget.select()} className="h-12 rounded-xl border-[#dedbd2] bg-white" />
        {shareFeedback ? <p role="status" className="text-sm text-[#705d37]">{shareFeedback}</p> : null}
        <DialogFooter><Button type="button" variant="outline" className="rounded-full" onClick={()=>setShareDialog(false)}>Close</Button><Button type="button" className="rounded-full bg-[#2b2b2b]" onClick={()=>void copyShareUrl()}>Copy link</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </Layout>;

  if (loading) return <Layout pageTitle={mode === "create" ? "Add a horse" : "Edit listing"} hideMobileNavigation><div className="mx-auto max-w-3xl animate-pulse space-y-6 px-4 py-7"><div className="h-3 w-1/2 rounded bg-[#e8e6df]" /><div className="h-12 w-3/4 rounded bg-[#e8e6df]" /><div className="h-72 rounded-[1.5rem] bg-[#e8e6df]" /><div className="h-12 rounded-xl bg-[#e8e6df]" /></div></Layout>;
  if (!user) return <Layout pageTitle={mode === "create" ? "Add a horse" : "Edit listing"} hideMobileNavigation><section className="mx-auto mt-12 max-w-lg rounded-[1.5rem] border border-[#dedbd2] bg-[#fbfaf7] px-6 py-10 text-center"><h1 className="font-accent text-2xl font-bold text-[#34332f]">Sign in to continue</h1><p className="mt-3 text-sm leading-6 text-[#77756f]">Your listing drafts stay private to your account. Sign in to create or manage a horse listing.</p><div className="mt-6 flex justify-center gap-3"><Button onClick={()=>navigate("/auth")} className="rounded-full bg-[#2b2b2b]">Sign in</Button><Button variant="outline" onClick={backToListings}>Back to browsing</Button></div></section></Layout>;
  if (constantsError && authorized) return <Layout pageTitle={mode === "create" ? "Add a horse" : "Edit listing"} hideMobileNavigation><section className="mx-auto mt-12 max-w-lg rounded-[1.5rem] border border-[#dedbd2] bg-[#fbfaf7] px-6 py-10 text-center"><h1 className="font-accent text-2xl font-bold text-[#34332f]">We couldn’t load listing options</h1><p className="mt-3 text-sm leading-6 text-[#77756f]">Your saved draft and listing remain untouched. Retry to load the available choices.</p><div className="mt-6 flex justify-center gap-3"><Button onClick={()=>void retryConstants()} className="rounded-full bg-[#2b2b2b]">Retry choices</Button><Button variant="outline" onClick={backToListings}>Back</Button></div></section></Layout>;
  if (displayError || !authorized) return <Layout pageTitle={mode === "create" ? "Add a horse" : "Edit listing"} hideMobileNavigation><section className="mx-auto mt-12 max-w-lg rounded-[1.5rem] border border-[#dedbd2] bg-[#fbfaf7] px-6 py-10 text-center"><h1 className="font-accent text-2xl font-bold text-[#34332f]">{displayError ? "We couldn’t open this listing" : "Seller access required"}</h1><p className="mt-3 text-sm leading-6 text-[#77756f]">{displayError || "Only seller accounts can create or edit horse listings. This listing has not been changed."}</p><div className="mt-6 flex justify-center gap-3"><Button variant="outline" onClick={backToListings}>Back to My Horses</Button>{mode === "edit" && horseError ? <Button onClick={() => void retryHorse()}>Try again</Button> : null}</div></section></Layout>;

  const selectedStep = STEPS[currentStepIndex];
  const levels = Array.from(new Set([
    ...(mode === "create" ? ["Unbroken", "Not Competing", "Young Horse"] : ["Unbroken", "Young Horse"]),
    ...(constants.levels?.[values.disciplines[0]] || []),
    ...values.levels,
  ]));
  const ages = mode === "create" ? AGE_OPTIONS_CREATE : AGE_OPTIONS_EDIT;
  const heights = mode === "create" ? HEIGHT_OPTIONS_CREATE : HEIGHT_OPTIONS_EDIT;
  const ageOptions = values.age !== undefined && !ages.includes(values.age) ? [...ages, values.age].sort((a,b)=>a-b) : ages;
  const heightOptions = values.height_hands !== undefined && values.height_hands !== "young_horse" && !heights.includes(values.height_hands) ? [...heights, values.height_hands].sort((a,b)=>a-b) : heights;
  const keepCurrent = (options: string[], current?: string | string[]) => Array.from(new Set([...options, ...(Array.isArray(current) ? current : current ? [current] : [])]));
  const title = values.name.trim() || "Your horse";
  return <Layout pageTitle={mode === "create" ? "Add a horse" : "Edit listing"} hideMobileNavigation>
    <main className="mx-auto w-full max-w-5xl px-0 pb-28 pt-2 sm:px-5 sm:pb-12">
      <header className="mb-7 px-4 sm:px-0">
        <div className="mb-6 flex items-center justify-between"><button type="button" onClick={backToListings} className="inline-flex items-center gap-2 text-sm font-medium text-[#77756f] hover:text-[#2b2b2b]"><ArrowLeft className="h-4 w-4" /> My horses</button><span aria-live="polite" className={`text-xs font-medium ${saveError ? "text-[#9e5344]" : "text-[#8b713c]"}`}>{saveError ? "Draft could not be saved on this device" : saved ? <><Check className="mr-1 inline h-3.5 w-3.5" />Saved</> : "Saving…"}</span></div>
        <div className="flex items-center gap-2" role="progressbar" aria-label="Listing progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={currentStepIndex + 1}>
          {STEPS.map((item, index) => <span key={item.id} className={`h-1.5 flex-1 rounded-full ${index <= currentStepIndex ? "bg-[#cdac6e]" : "bg-[#e5e2da]"}`} />)}
        </div>
        <nav aria-label="Listing steps" style={{ scrollbarWidth: "none" }} className="mt-2 flex gap-4 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden">
          {STEPS.map((item, index) => <button key={item.id} type="button" data-step={item.id} onClick={() => goToStep(item.id)} aria-current={step === item.id ? "step" : undefined} disabled={photoBusy || videoBusy || (mode === "create" && index > currentStepIndex)} className={`min-h-11 shrink-0 text-xs font-medium disabled:opacity-40 ${step === item.id ? "text-[#705d37]" : "text-neutral-500"}`}>{["Photos", "Key facts", "Pedigree", "Description", "Price range", "Preview"][index]}</button>)}
        </nav>
        <div className="mt-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b713c]">{selectedStep.eyebrow}</span><span className="text-xs text-[#77756f]">{mode === "edit" ? "Select any step to edit" : "Your progress saves on this device"}</span></div>
        <h1 className="mt-3 font-accent text-[2rem] font-bold leading-tight tracking-[-0.03em] text-[#2b2b2b] sm:text-4xl">{selectedStep.title}</h1>
      </header>
      <section data-listing-step={step} className="min-h-[52dvh] px-4 sm:rounded-[1.5rem] sm:border sm:border-[#e4e1d8] sm:bg-[#fbfaf7] sm:px-8 sm:py-8">
        {step === "photos" && <ListingPhotos
          name={title}
          photos={values.photos}
          uploading={photoBusy}
          maximum={mode === "create" ? 4 : undefined}
          onFiles={(files) => void uploadPhotos(files)}
          onRemove={(index) => !photoBusy && update("photos", valuesRef.current.photos.filter((_, item) => item !== index))}
          onMove={movePhoto}
          onAddUrl={(url) => {
            if (photoBusy) return;
            if (mode === "create" && valuesRef.current.photos.length >= 4) {
              toast({ title: "Maximum photos reached", description: "You can add up to four photos.", variant: "destructive" });
              return;
            }
            update("photos", [...valuesRef.current.photos, url]);
          }}
        />}
        {step === "facts" && <div className="mx-auto max-w-3xl space-y-7">
          <Field label="Horse name"><Input value={values.name} maxLength={50} onChange={(e) => update("name",e.target.value)} placeholder="The name buyers will remember" className="h-12 rounded-xl border-[#dedbd2] bg-[#fbfaf7]" /></Field>
          <ChipGroup label="Primary discipline" options={keepCurrent(constants.disciplines || [], values.disciplines)} selected={values.disciplines} onChange={(v) => { if (v[0] !== values.disciplines[0]) update("levels",[]); update("disciplines",v); }} />
          <ChipGroup label="Also competes in" options={keepCurrent((constants.disciplines || []).filter((d) => d !== values.disciplines[0]), values.other_disciplines)} selected={values.other_disciplines} onChange={(v) => update("other_disciplines",v)} multiple />
          <ListingLevelPicker options={levels} selected={values.levels} onChange={next => update("levels", next)} />
          <div className="grid gap-6 sm:grid-cols-2"><Field label="Age"><Select value={values.age === undefined ? "" : String(values.age)} onValueChange={(v) => update("age",Number(v))}><SelectTrigger className="h-12 rounded-xl border-[#dedbd2] bg-[#fbfaf7]"><SelectValue placeholder="Choose age" /></SelectTrigger><SelectContent>{ageOptions.map((age)=><SelectItem key={age} value={String(age)}>{age===0?"Weanling":age===1?"Yearling":`${age} years`}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Height"><Select value={values.height_hands === undefined ? "" : String(values.height_hands)} onValueChange={(v) => update("height_hands",v === "young_horse" ? v : Number(v))}><SelectTrigger className="h-12 rounded-xl border-[#dedbd2] bg-[#fbfaf7]"><SelectValue placeholder="Choose height" /></SelectTrigger><SelectContent><SelectItem value="young_horse">Young Horse</SelectItem>{heightOptions.map((height)=><SelectItem key={height} value={String(height)}>{height.toFixed(1)} hh</SelectItem>)}</SelectContent></Select></Field></div>
          <ChipGroup label="Sex" options={keepCurrent(["Colt","Filly",...(constants.sexes || [])],values.sex)} selected={values.sex?[values.sex]:[]} onChange={(v) => update("sex",v[0] || "")} />
          <ChipGroup label="Colour" options={keepCurrent(constants.colours || [],values.colour)} selected={values.colour?[values.colour]:[]} onChange={(v) => update("colour",v[0] || "")} />
          <div className="space-y-2"><ChipGroup label="Breed" options={Array.from(new Set([...(constants.breeds || []),...values.breeds]))} selected={values.breeds} onChange={(v)=>update("breeds",v)} multiple /><p className="text-xs text-[#77756f]">Select every breed that applies.</p></div>
          <SelectField label="Country" value={values.location_country} options={keepCurrent(constants.countries || [],values.location_country)} onChange={(v)=>update("location_country",v)} />
          <SelectField label={`Level of education${mode === "create" ? " *" : ""}`} value={values.education_level} options={keepCurrent(constants.educationLevels || [],values.education_level)} onChange={(v)=>update("education_level",v)} />
          <ChipGroup label="Characteristics" options={Array.from(new Set([...(constants.characteristics || []),...values.characteristics]))} selected={values.characteristics} onChange={(v)=>update("characteristics",v)} multiple />
        </div>}
        {step === "pedigree" && <div className="mx-auto max-w-2xl">
          <div className="mb-7 rounded-2xl border-l-2 border-[#cdac6e] bg-[#f0efeb] px-5 py-4 text-sm leading-6 text-[#57564f]">Buyers look for breeding first. Adding the pedigree helps your horse stand out.</div>
          <div className="space-y-6"><Field label="Sire"><Input value={values.sire} onChange={(e)=>update("sire",e.target.value)} placeholder="Sire’s name" className="h-12 rounded-xl border-[#dedbd2] bg-[#fbfaf7]" /></Field><Field label="Dam"><Input value={values.dam} onChange={(e)=>update("dam",e.target.value)} placeholder="Dam’s name" className="h-12 rounded-xl border-[#dedbd2] bg-[#fbfaf7]" /></Field><Field label="Dam sire"><Input value={values.dam_sire} onChange={(e)=>update("dam_sire",e.target.value)} placeholder="Maternal grandsire" className="h-12 rounded-xl border-[#dedbd2] bg-[#fbfaf7]" /></Field></div>
          <p className="mt-5 text-xs leading-5 text-[#77756f]">Every pedigree field is optional. You can add or update these details later.</p>
        </div>}
        {step === "description" && <div className="mx-auto max-w-3xl space-y-7">
          <Field label="About this horse" hint="Describe your horse's temperament, experience and results."><Textarea value={values.description} onChange={(e)=>update("description",e.target.value)} placeholder="Describe your horse's temperament, experience and results" rows={9} className="min-h-[16rem] resize-y rounded-2xl border-[#dedbd2] bg-[#fbfaf7] p-4 text-base leading-7" /></Field>
          <Field label="Additional information" hint="Veterinary history, competition results or anything else buyers should know."><Textarea value={values.additional_info} onChange={(e)=>update("additional_info",e.target.value)} placeholder="Share any additional details" rows={4} className="min-h-28 rounded-2xl border-[#dedbd2] bg-[#fbfaf7] p-4 leading-6" /></Field>
          <div className="rounded-2xl border border-[#e4e1d8] p-4"><div className="flex items-center gap-2"><FileVideo className="h-4 w-4 text-[#8b713c]" /><span className="text-sm font-semibold">Optional video</span></div><p className="mt-1 text-xs text-[#77756f]">A short clip can give buyers a feel for movement and manner.</p><input ref={videoInput} type="file" accept="video/*" className="sr-only" onChange={(e)=>void uploadVideo(e.target.files?.[0])} /><Button type="button" variant="outline" disabled={videoBusy} className="mt-3 rounded-full" onClick={()=>videoInput.current?.click()}>{videoBusy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}{videoBusy ? "Uploading…" : "Add a video"}</Button>
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]"><Input aria-label="Video URL" type="url" value={videoUrl} onChange={(event)=>{setVideoUrl(event.target.value);setVideoUrlError("");}} placeholder="Add video from a URL" className="h-11 rounded-xl border-[#dedbd2] bg-[#fbfaf7]" /><Button type="button" variant="outline" disabled={!videoUrl.trim()} onClick={addVideoUrl} className="rounded-full"><Plus className="mr-2 h-4 w-4" />Add URL</Button></div>
            {videoUrlError?<p role="alert" className="mt-2 text-xs text-[#9e5344]">{videoUrlError}</p>:null}
            {values.videos.length ? <ul className="mt-3 space-y-2">{values.videos.map((url,index)=><li key={`${url}-${index}`} className="flex items-center justify-between gap-2 rounded-lg bg-[#f0efeb] px-3 py-2 text-xs"><span className="truncate">{url}</span><button type="button" aria-label="Remove video" onClick={()=>update("videos",valuesRef.current.videos.filter((_,i)=>i!==index))}><X className="h-4 w-4" /></button></li>)}</ul> : null}</div>
        </div>}
        {step === "price" && <div className="mx-auto max-w-2xl">
          <p className="mb-7 max-w-xl text-sm leading-6 text-[#77756f]">Set a useful search range for buyers. Your exact price range is never shown on the listing or to buyers; it only helps the right people find your horse.</p>
          <div className="mb-7 grid grid-cols-2 gap-3 rounded-2xl bg-[#f0efeb] p-4">
            <SelectField label="Currency" value={values.currency} options={keepCurrent(["AUD","NZD","USD","GBP","EUR"],values.currency)} onChange={(v)=>update("currency",v)} />
            <div className="hidden sm:block" aria-hidden="true" />
            <SelectField label="Minimum" value={values.price_min === undefined ? "" : String(values.price_min)} options={keepCurrent((mode === "create" ? createMinPrices : editMinPrices).map(String),values.price_min === undefined ? undefined : String(values.price_min))} onChange={(v)=>{
              const next=Number(v);
              if (mode === "create" && values.price_max !== undefined && values.price_max < next) {
                update("price_min",next);
                update("price_max",next);
                toast({description:"Maximum price has been adjusted to match the new minimum price."});
              } else if (mode === "edit" && values.price_max !== undefined && values.price_max < next) {
                update("price_min",next);
                update("price_max",next);
                toast({description:"Maximum price has been adjusted to match the new minimum price."});
              } else update("price_min",next);
            }} optionLabel={(option)=>formatPriceOption(option,values.currency,mode)} />
            <SelectField label="Maximum" value={values.price_max === undefined ? "" : String(values.price_max)} options={keepCurrent((mode === "create" ? createMaxPrices : editMaxPrices).filter((n)=>values.price_min === undefined || n >= values.price_min).map(String),values.price_max === undefined ? undefined : String(values.price_max))} onChange={(v)=>{
              const next=Number(v);
              if (mode === "create" && values.price_min !== undefined && next < values.price_min) {
                toast({title:"Invalid price range",description:"Maximum price must be greater than or equal to minimum price",variant:"destructive"});
                return;
              }
              if (mode === "edit" && values.price_min !== undefined && values.price_min > next) {
                update("price_min",next);
                toast({description:"Minimum price has been adjusted to match the new maximum price."});
              }
              update("price_max",next);
            }} optionLabel={(option)=>formatPriceOption(option,values.currency,mode)} />
          </div>
          <div className="rounded-xl border border-[#e4e1d8] px-4 py-3 text-xs leading-5 text-[#77756f]"><span className="font-semibold text-[#34332f]">A private search signal.</span> Your listing card and horse page won’t display a price.</div>
        </div>}
        {step === "preview" && <ListingBuyerPreview horse={preview} />}
      </section>
      {step !== "preview" || mode === "edit" ? <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dedbd3] bg-[#f8f7f4]/95 px-4 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-md"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4"><button type="button" onClick={()=>currentStepIndex>0&&goToStep(STEPS[currentStepIndex-1].id)} disabled={currentStepIndex===0||photoBusy||videoBusy} className="min-h-11 text-sm font-medium text-[#77756f] disabled:invisible">Back</button>{step==="preview" ? <Button type="button" disabled={publishing||photoBusy||videoBusy} onClick={()=> mode==="create" ? setPromotionDialog(true) : void publish()} className="h-12 min-w-44 rounded-full bg-[#2b2b2b] px-7 text-base text-white hover:bg-[#1c1c1c]">{publishing?<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />:null}{mode==="create"?"Publish listing":"Save changes"}</Button> : <Button type="button" disabled={photoBusy||videoBusy} onClick={goNext} className="h-12 min-w-44 rounded-full bg-[#2b2b2b] px-7 text-base text-white hover:bg-[#1c1c1c]">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>}</div></footer> : <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dedbd3] bg-[#f8f7f4]/95 px-4 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-md"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4"><button type="button" onClick={()=>goToStep("price")} disabled={photoBusy||videoBusy} className="min-h-11 text-sm font-medium text-[#77756f] disabled:invisible">Back</button><Button type="button" disabled={publishing||photoBusy||videoBusy} onClick={()=> mode==="create" ? setPromotionDialog(true) : void publish()} className="h-12 min-w-44 rounded-full bg-[#2b2b2b] px-7 text-base text-white hover:bg-[#1c1c1c]">{publishing?<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />:null}{mode==="create"?"Publish listing":"Save changes"}</Button></div></footer>}
      <Dialog open={pedigreeReminder} onOpenChange={setPedigreeReminder}>
        <DialogContent className="rounded-[1.5rem] border-[#dedbd2] bg-[#fbfaf7]">
          <DialogHeader><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b713c]">One gentle reminder</p><DialogTitle className="font-accent text-2xl">Add the pedigree now?</DialogTitle><DialogDescription>Performance-horse buyers often start with breeding. Add a name now, or skip and come back whenever you like.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="ghost" className="rounded-full" onClick={()=>{setPedigreeReminder(false);goToStep("description");}}>Skip for now</Button><Button className="rounded-full bg-[#2b2b2b]" onClick={()=>setPedigreeReminder(false)}>Add pedigree</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={promotionDialog} onOpenChange={setPromotionDialog}>
        <DialogContent className="rounded-[1.5rem] border-[#dedbd2] bg-[#fbfaf7]">
          <DialogHeader><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8b713c]">Before publishing</p><DialogTitle className="font-accent text-2xl">May we share your horse?</DialogTitle><DialogDescription>Would you like ProHorseMatch to promote this listing on social media?</DialogDescription></DialogHeader>
          <div className="mt-3 grid grid-cols-2 gap-3" role="group" aria-label="Social media promotion consent">{[{label:"Yes, thank you",value:true},{label:"No, thank you",value:false}].map((choice)=><button key={choice.label} type="button" aria-pressed={promotion===choice.value} onClick={()=>setPromotion(choice.value)} className={`min-h-12 rounded-full border text-sm font-semibold ${promotion===choice.value?"border-[#2b2b2b] bg-[#2b2b2b] text-white":"border-[#dedbd2] bg-white text-[#34332f]"}`}>{choice.label}</button>)}</div>
          <DialogFooter><Button variant="ghost" className="rounded-full" onClick={()=>setPromotionDialog(false)}>Review listing</Button><Button disabled={promotion===null||publishing} className="rounded-full bg-[#2b2b2b]" onClick={()=>void publish()}>{publishing?<LoaderCircle className="mr-2 h-4 w-4 animate-spin" />:null}Publish</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  </Layout>;
}
