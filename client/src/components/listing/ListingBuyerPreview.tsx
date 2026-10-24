import { useState } from "react";
import { Heart, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import type { Horse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { BrowseHorsePreview } from "@/components/browse/BrowseHorseGrid";
import { getBuyerDetailFields, getBuyerPedigree } from "./listing-model";

export default function ListingBuyerPreview({ horse }: { horse: Horse }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = Array.isArray(horse.photos) ? horse.photos : [];
  const details = getBuyerDetailFields(horse);
  const pedigree = getBuyerPedigree(horse);
  const stepPhoto = (direction: number) => setPhotoIndex((index) => photos.length ? (index + direction + photos.length) % photos.length : 0);
  return <div className="mx-auto max-w-4xl">
    <p className="mb-6 text-sm leading-6 text-[#77756f]">Buyer-view preview. The detail page shows your country; the card has no location.</p>
    <div className="grid gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="max-w-sm">
        <BrowseHorsePreview horse={horse} />
        <p className="mt-3 text-xs text-[#77756f]">The buyer-card heart and “View horse” are preview-only and won’t save or navigate.</p>
      </div>
      <div className="min-w-0">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b713c]">Buyer detail · preview only</p>
        <div className="group relative h-[42vh] min-h-[280px] max-h-[520px] overflow-hidden rounded-2xl bg-neutral-200 sm:h-[48vh]">
          {photos.length ? <img src={photos[photoIndex]} alt={`${horse.name}, photo ${photoIndex + 1}`} className="h-full w-full object-cover object-center" /> : <div className="flex h-full items-center justify-center bg-[#e8e6df] text-center"><p className="font-accent text-sm text-neutral-500">Photos coming soon</p></div>}
          {photos.length > 1 ? <>
            <button type="button" aria-label="Previous preview photo" onClick={() => stepPhoto(-1)} className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950/45 text-white transition hover:bg-neutral-950/65"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" aria-label="Next preview photo" onClick={() => stepPhoto(1)} className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950/45 text-white transition hover:bg-neutral-950/65"><ChevronRight className="h-5 w-5" /></button>
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-neutral-950/55 px-3 py-1 text-xs font-medium tracking-wide text-white">{photoIndex + 1} / {photos.length}</div>
          </> : null}
          <button type="button" disabled aria-label="Save horse (preview only; no changes will be made)" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-neutral-800 opacity-80 shadow-sm"><Heart className="h-5 w-5" /></button>
          {photos.length > 1 ? <div className="absolute bottom-3 left-3 flex gap-1.5" aria-label="Choose preview photo">{photos.map((_, index) => <button key={index} type="button" aria-label={`Show preview photo ${index + 1}`} aria-current={index === photoIndex} onClick={() => setPhotoIndex(index)} className={`h-1.5 rounded-full transition-all ${index === photoIndex ? "w-6 bg-white" : "w-2 bg-white/60"}`} />)}</div> : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-950/35 to-transparent" />
          {photos.length > 0 ? <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-medium tracking-wide text-white/90">Photo gallery preview</p> : null}
        </div>
        <article className="px-1 pt-5 sm:px-3">
          <h2 className="font-accent break-words text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">{horse.name}</h2>
          <section aria-label="Horse details" className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 border-y border-neutral-200 py-5 sm:gap-x-10">
            {details.map(([label, value]) => <div key={label} className="min-w-0"><p className="text-xs font-medium tracking-wide text-neutral-500">{label}</p><p className="mt-1 break-words text-sm font-bold leading-snug text-neutral-900">{value || "Not specified"}</p></div>)}
          </section>
          <section aria-labelledby="listing-preview-pedigree" className="mt-6">
            <h3 id="listing-preview-pedigree" className="font-accent text-lg font-semibold text-neutral-900">Pedigree</h3>
            {pedigree.length ? <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-4 border-l-2 border-[#cdac6e] pl-4">{pedigree.map(([label, value]) => <div key={label}><p className="text-xs font-medium text-neutral-500">{label}</p><p className="mt-1 break-words text-sm font-semibold text-neutral-900">{value}</p></div>)}</div> : <p className="mt-2 text-sm leading-6 text-neutral-600">Pedigree not provided by seller</p>}
          </section>
          <section className="mt-7"><h3 className="font-accent text-xl font-semibold text-neutral-900">About {horse.name}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{horse.description || "No description provided."}</p></section>
          {horse.additional_info ? <section className="mt-7"><h3 className="font-accent text-lg font-semibold text-neutral-900">Additional Information</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{horse.additional_info}</p></section> : null}
          {horse.education_level ? <section className="mt-7"><h3 className="font-accent text-lg font-semibold text-neutral-900">Level of Education</h3><span className="mt-2 inline-flex rounded-full border border-[#cdac6e]/50 bg-[#cdac6e]/10 px-3 py-1 text-sm text-neutral-800">{horse.education_level}</span></section> : null}
          <div className="mt-9 flex justify-center pb-2"><button type="button" disabled aria-label="Report listing (preview only; no report will be submitted)" className="text-xs text-neutral-400 opacity-80">Report this listing · preview only</button></div>
        </article>
        <div className="mt-4 rounded-xl bg-[#f0efeb] p-3 text-xs text-[#77756f]">Buyer heart, contact, and report controls are previews only. They do not save, send, or report.</div>
        <div className="mt-4"><Button disabled aria-label="Contact seller (preview only; no message will be sent)" className="h-12 w-full bg-[#cdac6e] text-base font-semibold text-white opacity-70"><MessageSquare className="mr-2 h-4 w-4" />Contact Seller · preview only</Button></div>
      </div>
    </div>
  </div>;
}
