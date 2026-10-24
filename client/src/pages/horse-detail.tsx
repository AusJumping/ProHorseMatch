import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Horse } from "@shared/schema";
import { ownsHorse } from "@shared/horsePermissions";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Loader2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function HorseDetail() {
  const [, params] = useRoute("/horse/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const touchStart = useRef<number | null>(null);

  const reportMutation = useMutation({
    mutationFn: (data: { horse_id: number; reason: string; details?: string }) =>
      apiRequest("POST", "/api/reports", data),
    onSuccess: () => {
      setReportDialogOpen(false);
      setReportReason("");
      setReportDetails("");
      toast({ title: "Report submitted", description: "Thanks for letting us know, our team will review this listing." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit report. Please try again.", variant: "destructive" });
    },
  });

  const { data: horse, isLoading, isError, refetch } = useQuery<Horse>({
    queryKey: [`/api/horses/${params?.id}`],
    enabled: !!params?.id,
  });
  const isOwner = Boolean(horse && ownsHorse(user?.id, horse));
  const isBuyer = Boolean(isAuthenticated && user && horse && !isOwner);
  const photos = Array.isArray(horse?.photos) ? horse.photos : [];

  useEffect(() => {
    setPhotoIndex(0);
    setGalleryOpen(false);
  }, [params?.id]);

  useEffect(() => {
    let cancelled = false;
    const checkFavorite = async () => {
      if (!isAuthenticated || !params?.id) {
        setIsSaved(false);
        return;
      }
      try {
        const matches = await apiRequest("GET", "/api/matches");
        if (!cancelled) {
          const liked = matches.some((match: any) =>
            match.horse_id === Number(params.id) && match.is_liked
          );
          setIsSaved(liked);
        }
      } catch (error) {
        console.error("Error checking if horse is favorite:", error);
        if (!cancelled) setIsSaved(false);
      }
    };
    checkFavorite();
    return () => { cancelled = true; };
  }, [params?.id, isAuthenticated]);

  useEffect(() => {
    if (!galleryOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setGalleryOpen(false);
      if (event.key === "ArrowRight" && photos.length > 1) setPhotoIndex((index) => (index + 1) % photos.length);
      if (event.key === "ArrowLeft" && photos.length > 1) setPhotoIndex((index) => (index + photos.length - 1) % photos.length);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [galleryOpen, photos.length]);

  const requireSignIn = (action: string) => {
    if (isAuthenticated && user) return true;
    toast({ title: "Login required", description: `Please log in to ${action}.`, variant: "destructive" });
    navigate("/auth");
    return false;
  };

  const handleSave = async () => {
    if (isOwner || !horse || !params?.id) return;
    if (!requireSignIn("save this horse to favourites")) return;
    try {
      const matches = await apiRequest("GET", "/api/matches");
      const existing = matches.find((match: any) =>
        match.horse_id === Number(params.id) && match.customer_id === user!.id
      );
      if (existing) {
        const liked = !existing.is_liked;
        await apiRequest("PATCH", `/api/matches/${existing.id}`, { is_liked: liked });
        setIsSaved(liked);
        queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
        toast({
          title: liked ? "Horse saved" : "Horse removed",
          description: liked ? "This horse has been added to your favourites." : "This horse has been removed from your favourites.",
        });
      } else {
        await apiRequest("POST", "/api/matches", {
          customer_id: user!.id,
          horse_id: Number(params.id),
          is_liked: true,
        });
        setIsSaved(true);
        queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
        toast({ title: "Horse saved", description: "This horse has been added to your favourites." });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Error", description: "Failed to save horse. Please try again.", variant: "destructive" });
    }
  };

  const handleSendMessage = async () => {
    if (isOwner || !horse || !messageContent.trim()) return;
    if (!requireSignIn("send messages")) return;
    try {
      await apiRequest("POST", "/api/messages", {
        customer_id: user!.id,
        owner_id: horse.owner_id,
        horse_id: horse.id,
        content: messageContent,
        sender_type: "customer",
      });
      toast({ title: "Message sent", description: "Your message has been sent to the owner." });
      setMessageContent("");
      setIsMessageOpen(false);
      navigate("/messages");
    } catch {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) window.history.back();
    else navigate("/");
  };

  const showReportDialog = () => {
    if (!requireSignIn("report this listing")) return;
    setReportDialogOpen(true);
  };

  const startSwipe = (event: React.TouchEvent) => { touchStart.current = event.touches[0]?.clientX ?? null; };
  const finishSwipe = (event: React.TouchEvent) => {
    if (touchStart.current === null || photos.length < 2) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > 45) setPhotoIndex((index) => (index + (distance < 0 ? 1 : photos.length - 1)) % photos.length);
    touchStart.current = null;
  };
  const stepPhoto = (direction: number) => setPhotoIndex((index) => photos.length ? (index + direction + photos.length) % photos.length : 0);

  if (isLoading) {
    return (
      <Layout pageTitle="Horse detail" showBackButton onBackClick={handleBack}>
        <div className="mx-auto max-w-xl animate-pulse space-y-5">
          <div className="h-[38vh] min-h-64 rounded-2xl bg-neutral-200" />
          <div className="h-8 w-2/3 rounded bg-neutral-200" />
          <div className="grid grid-cols-2 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 rounded-lg bg-neutral-200" />)}</div>
        </div>
      </Layout>
    );
  }

  if (isError || !horse) {
    return (
      <Layout pageTitle="Horse detail" showBackButton onBackClick={handleBack}>
        <section className="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
          <h2 className="font-accent text-xl font-bold text-neutral-800">We couldn’t load this listing</h2>
          <p className="mt-2 text-sm text-neutral-600">Please check your connection and try again.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={handleBack}><ArrowLeft className="mr-2 h-4 w-4" />Go back</Button>
            <Button onClick={() => refetch()}>Try again</Button>
          </div>
        </section>
      </Layout>
    );
  }

  const details = [
    ["Discipline", horse.disciplines?.filter(Boolean).join(", ")],
    ["Level", horse.levels?.filter(Boolean).join(", ")],
    ["Age", horse.age === 1 ? "Yearling" : `${horse.age} years`],
    ["Sex", horse.sex],
    ["Height", horse.height_hands ? `${horse.height_hands} hands` : "Not specified"],
    ["Colour", horse.colour],
    ["Breed", horse.breeds?.filter(Boolean).join(", ")],
    ["Country", horse.location_country],
  ] as const;
  const pedigree = [
    ["Sire", horse.sire],
    ["Dam", horse.dam],
    ["Dam sire", horse.dam_sire],
  ].filter((item): item is [string, string] => Boolean(item[1]?.trim()));

  return (
      <Layout pageTitle={horse.name} showBackButton onBackClick={handleBack} hideHeader hideMobileNavigation>
      <div className={`mx-auto w-full ${isOwner ? "pb-4" : isBuyer ? "pb-32" : "pb-12"} max-w-3xl`}>
        {isOwner && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#cdac6e]/35 bg-[#cdac6e]/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-neutral-800">You’re viewing your listing</p>
              <p className="mt-0.5 text-xs text-neutral-600">Only you can see and manage your listing details.</p>
            </div>
            <Button size="sm" className="shrink-0 bg-[#cdac6e] text-white hover:bg-[#b99a5e]" onClick={() => navigate(`/edit-horse/${horse.id}`)}>Edit listing</Button>
          </div>
        )}

        <div
          className="group relative h-[42vh] min-h-[280px] max-h-[520px] overflow-hidden rounded-2xl bg-neutral-200 sm:h-[48vh]"
          onTouchStart={startSwipe}
          onTouchEnd={finishSwipe}
        >
          {photos.length ? (
            <button
              type="button"
              className="absolute inset-0 block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#cdac6e]"
              onClick={() => setGalleryOpen(true)}
              aria-label={`Open photo ${photoIndex + 1} of ${photos.length} in full screen`}
            >
              <img src={photos[photoIndex]} alt={`${horse.name}, photo ${photoIndex + 1}`} className="h-full w-full object-cover object-center" />
            </button>
          ) : (
            <div className="flex h-full items-center justify-center bg-[#e8e6df] text-center">
              <p className="font-accent text-sm text-neutral-500">Photos coming soon</p>
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button type="button" aria-label="Previous photo" onClick={() => stepPhoto(-1)} className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950/45 text-white transition hover:bg-neutral-950/65"><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" aria-label="Next photo" onClick={() => stepPhoto(1)} className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950/45 text-white transition hover:bg-neutral-950/65"><ChevronRight className="h-5 w-5" /></button>
              <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-neutral-950/55 px-3 py-1 text-xs font-medium tracking-wide text-white">{photoIndex + 1} / {photos.length}</div>
            </>
          )}
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-3 flex gap-1.5" aria-label="Choose photo">
              {photos.map((photo, index) => (
                <button key={`${photo}-${index}`} type="button" onClick={() => setPhotoIndex(index)} aria-label={`Show photo ${index + 1}`} aria-current={index === photoIndex} className={`h-1.5 rounded-full transition-all ${index === photoIndex ? "w-6 bg-white" : "w-2 bg-white/60"}`} />
              ))}
            </div>
          )}
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
            <button type="button" onClick={handleBack} aria-label="Back to listings" className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-950/50 text-white shadow-sm backdrop-blur-sm transition hover:bg-neutral-950/70"><ArrowLeft className="h-5 w-5" /></button>
            {isBuyer ? (
              <button type="button" onClick={handleSave} aria-label={isSaved ? "Remove from favourites" : "Save to favourites"} aria-pressed={isSaved} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-sm backdrop-blur-sm transition hover:bg-white">
                <Heart className={`h-5 w-5 ${isSaved ? "fill-[#cdac6e] text-[#cdac6e]" : ""}`} />
              </button>
            ) : <span className="h-11 w-11" aria-hidden="true" />}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-950/35 to-transparent" />
          {photos.length > 0 && <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-medium tracking-wide text-white/90">Tap to view photos</p>}
        </div>

        <article className="px-1 pt-5 sm:px-3">
          <h1 className="font-accent break-words text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">{horse.name}</h1>

          <section aria-label="Horse details" className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 border-y border-neutral-200 py-5 sm:gap-x-10">
            {details.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-neutral-500">{label}</p>
                <p className="mt-1 break-words text-sm font-bold leading-snug text-neutral-900">{value || "Not specified"}</p>
              </div>
            ))}
          </section>

          <section aria-labelledby="horse-pedigree-heading" className="mt-6">
            <h2 id="horse-pedigree-heading" className="font-accent text-lg font-semibold text-neutral-900">Pedigree</h2>
            {pedigree.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-4 border-l-2 border-[#cdac6e] pl-4">
                {pedigree.map(([label, value]) => <div key={label}><p className="text-xs font-medium text-neutral-500">{label}</p><p className="mt-1 break-words text-sm font-semibold text-neutral-900">{value}</p></div>)}
              </div>
            ) : isOwner ? (
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Add pedigree details to help buyers understand this horse’s breeding.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-neutral-600">Pedigree not provided by seller</p>
            )}
          </section>

          <section className="mt-7">
            <h2 className="font-accent text-xl font-semibold text-neutral-900">About {horse.name}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{horse.description || "No description provided."}</p>
          </section>

          {horse.additional_info && (
            <section className="mt-7">
              <h2 className="font-accent text-lg font-semibold text-neutral-900">Additional Information</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{horse.additional_info}</p>
            </section>
          )}

          {horse.education_level && (
            <section className="mt-7">
              <h2 className="font-accent text-lg font-semibold text-neutral-900">Level of Education</h2>
              <Badge variant="outline" className="mt-2 border-[#cdac6e]/50 bg-[#cdac6e]/10 text-neutral-800">{horse.education_level}</Badge>
            </section>
          )}

          {isMessageOpen && isBuyer && (
            <section className="mt-7 rounded-xl border border-neutral-200 bg-white p-4">
              <h2 className="font-accent text-lg font-semibold">Message the seller</h2>
              <label className="sr-only" htmlFor="seller-message">Your message</label>
              <textarea
                id="seller-message"
                className="mt-3 w-full rounded-lg border border-neutral-300 bg-[#fbfaf7] p-3 text-sm outline-none focus:border-[#cdac6e] focus:ring-2 focus:ring-[#cdac6e]/25"
                rows={4}
                placeholder={`Ask a question about ${horse.name}...`}
                value={messageContent}
                onChange={(event) => setMessageContent(event.target.value)}
              />
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={() => setIsMessageOpen(false)}>Cancel</Button>
                <Button onClick={handleSendMessage} disabled={!messageContent.trim()}><MessageSquare className="mr-2 h-4 w-4" />Send message</Button>
              </div>
            </section>
          )}

          {isBuyer && (
            <div className="mt-9 flex justify-center pb-2">
              <button type="button" onClick={showReportDialog} className="text-xs text-neutral-400 transition-colors hover:text-neutral-600 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e]">Report this listing</button>
            </div>
          )}
        </article>
      </div>

      {isBuyer && !isMessageOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-[#f5f4f0]/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl">
            <Button className="h-12 w-full bg-[#cdac6e] text-base font-semibold text-white hover:bg-[#b99a5e]" onClick={() => setIsMessageOpen(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />Contact Seller
            </Button>
          </div>
        </div>
      )}

      {galleryOpen && (
        <div className="fixed inset-0 z-[70] flex h-[100dvh] flex-col bg-neutral-950 text-white" role="dialog" aria-modal="true" aria-label={`${horse.name} photo gallery`}>
          <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
            <button type="button" onClick={() => setGalleryOpen(false)} aria-label="Back to listing" className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900/60 text-white transition hover:bg-neutral-800"><ArrowLeft className="h-5 w-5" /></button>
            {isBuyer && (
              <button type="button" onClick={handleSave} aria-label={isSaved ? "Remove from favourites" : "Save to favourites"} aria-pressed={isSaved} className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900/60 text-[#cdac6e] transition hover:bg-neutral-800">
                <Heart className={`h-5 w-5 ${isSaved ? "fill-[#cdac6e]" : ""}`} />
              </button>
            )}
          </header>
          {photos.length ? (
            <div className="flex min-h-0 flex-1 items-center justify-center px-2 py-20" onTouchStart={startSwipe} onTouchEnd={finishSwipe}>
              <img src={photos[photoIndex]} alt={`${horse.name}, photo ${photoIndex + 1}`} className="max-h-full max-w-full select-none object-contain" />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">No photos available</div>
          )}
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => stepPhoto(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/60 text-white"><ChevronLeft className="h-6 w-6" /></button>
              <button type="button" onClick={() => stepPhoto(1)} aria-label="Next photo" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/60 text-white"><ChevronRight className="h-6 w-6" /></button>
            </>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-sm text-white/75">{photos.length ? `${photoIndex + 1} / ${photos.length}` : horse.name}</div>
        </div>
      )}

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this listing</DialogTitle>
            <DialogDescription>Let us know what’s wrong. Our team will review it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Reason</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="misleading_listing">Misleading or inaccurate listing</SelectItem>
                  <SelectItem value="inappropriate_content">Inappropriate content</SelectItem>
                  <SelectItem value="scam">Scam or fraud</SelectItem>
                  <SelectItem value="not_available">Horse no longer available</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="report-details">Details (optional)</label>
              <Textarea id="report-details" value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} placeholder="Anything else we should know?" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
            <Button disabled={!reportReason || reportMutation.isPending} onClick={() => reportMutation.mutate({ horse_id: horse.id, reason: reportReason, details: reportDetails.trim() || undefined })}>
              {reportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
