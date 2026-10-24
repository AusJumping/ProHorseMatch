import { useState } from "react";
import { Heart, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import type { Horse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { BrowseHorsePreview } from "@/components/browse/BrowseHorseGrid";
import { HorseIdentity, HorseListingSections } from "@/components/horse/HorseListingPresentation";
import { getBuyerDetailFields } from "./listing-model";

export default function ListingBuyerPreview({ horse }: { horse: Horse }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = Array.isArray(horse.photos) ? horse.photos : [];
  const summaryFacts = getBuyerDetailFields(horse).filter(([label, value]) =>
    ["Discipline", "Level", "Age", "Sex", "Height"].includes(label) &&
    Boolean(value?.trim()) && !value.startsWith("Not specified") && !value.startsWith("null ")
  );
  const stepPhoto = (direction: number) => setPhotoIndex((index) => photos.length ? (index + direction + photos.length) % photos.length : 0);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-5 text-sm leading-6 text-[#77756f]">Buyer-view preview. The detail page shows your country; the card has no location.</p>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.5fr)]">
        <div className="max-w-sm">
          <BrowseHorsePreview horse={horse} />
          <p className="mt-3 text-xs leading-5 text-[#77756f]">The buyer-card heart and “View horse” are preview-only and won’t save or navigate.</p>
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b713c]">Buyer detail · preview only</p>
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(230px,0.95fr)]">
            <div className="min-w-0 space-y-3.5">
              <div className="group relative h-[36vh] min-h-[250px] max-h-[440px] overflow-hidden rounded-xl bg-neutral-200">
                {photos.length ? <img src={photos[photoIndex]} alt={`${horse.name}, photo ${photoIndex + 1}`} className="h-full w-full object-cover object-center" /> : <div className="flex h-full items-center justify-center bg-[#e8e6df] text-center"><p className="font-accent text-sm text-neutral-500">Photos coming soon</p></div>}
                {photos.length > 1 ? <>
                  <button type="button" aria-label="Previous preview photo" onClick={() => stepPhoto(-1)} className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950/45 text-white transition hover:bg-neutral-950/65 motion-reduce:transition-none"><ChevronLeft className="h-5 w-5" /></button>
                  <button type="button" aria-label="Next preview photo" onClick={() => stepPhoto(1)} className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950/45 text-white transition hover:bg-neutral-950/65 motion-reduce:transition-none"><ChevronRight className="h-5 w-5" /></button>
                  <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-neutral-950/55 px-3 py-1 text-xs font-medium tracking-wide text-white">{photoIndex + 1} / {photos.length}</div>
                </> : null}
                <button type="button" disabled aria-label="Save horse (preview only; no changes will be made)" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-800 opacity-80 shadow-sm"><Heart className="h-5 w-5" /></button>
                {photos.length > 1 ? <div className="absolute bottom-3 left-3 flex gap-1.5" aria-label="Choose preview photo">{photos.map((_, index) => <button key={index} type="button" aria-label={`Show preview photo ${index + 1}`} aria-current={index === photoIndex} onClick={() => setPhotoIndex(index)} className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${index === photoIndex ? "w-6 bg-white" : "w-2 bg-white/60"}`} />)}</div> : null}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-neutral-950/35 to-transparent" />
                {photos.length > 0 ? <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-medium tracking-wide text-white/90">Photo gallery preview</p> : null}
              </div>
              <div className="lg:hidden"><HorseIdentity horse={horse} /></div>
              <HorseListingSections horse={horse} pedigreeSectionId="listing-preview-pedigree" />
              <div className="flex justify-center py-2"><button type="button" disabled aria-label="Report listing (preview only; no report will be submitted)" className="text-xs text-neutral-400 opacity-80">Report this listing · preview only</button></div>
            </div>

            <aside className="sticky top-4 hidden self-start lg:block">
              <div className="rounded-xl border border-[#e8e3d8] bg-white p-4 shadow-[0_5px_18px_rgba(78,65,43,0.06)]">
                <HorseIdentity horse={horse} />
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-neutral-100 pt-3">
                  {summaryFacts.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[10px] font-medium text-neutral-500">{label}</dt><dd className="mt-0.5 break-words text-xs font-semibold text-neutral-900">{value}</dd></div>)}
                  {horse.education_level ? <div className="col-span-2"><dt className="text-[10px] font-medium text-neutral-500">Education</dt><dd className="mt-1"><span className="inline-flex rounded-full border border-[#cdac6e]/45 bg-[#cdac6e]/10 px-2.5 py-1 text-xs font-semibold text-neutral-800">{horse.education_level}</span></dd></div> : null}
                </dl>
                <Button disabled aria-label="Contact seller (preview only; no message will be sent)" className="mt-4 h-11 w-full bg-[#cdac6e] font-semibold text-white opacity-70"><MessageSquare className="mr-2 h-4 w-4" />Contact Seller · preview</Button>
                <Button disabled variant="outline" className="mt-2 w-full">Save · preview only</Button>
              </div>
            </aside>
          </div>
          <div className="mt-4 rounded-xl bg-[#f0efeb] p-3 text-xs leading-5 text-[#77756f] lg:hidden">Buyer heart, contact, and report controls are previews only. They do not save, send, or report.</div>
        </div>
      </div>
    </div>
  );
}
