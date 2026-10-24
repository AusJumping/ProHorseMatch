import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, LoaderCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ListingPhotos({
  name,
  photos,
  uploading,
  onFiles,
  onRemove,
  onMove,
  onAddUrl,
  maximum,
}: {
  name: string;
  photos: string[];
  uploading: boolean;
  onFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onAddUrl: (url: string) => void;
  maximum?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const startIndex = useRef<number | null>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const addUrl = () => {
    const trimmed = url.trim();
    try {
      const parsed = new URL(trimmed);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only web image URLs are supported.");
      onAddUrl(trimmed);
      setUrl("");
      setUrlError("");
    } catch {
      setUrlError("Enter a complete image URL beginning with https://.");
    }
  };
  return <div className="mx-auto max-w-3xl">
    <p className="mb-6 text-sm leading-6 text-[#77756f]">A thoughtful cover photo helps buyers picture the partnership.{maximum ? ` Add up to ${maximum} images.` : " Add several images to tell the story."}</p>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {photos.map((photo, index) => <div key={`${photo}-${index}`} data-photo-index={index}
        className={`group relative overflow-hidden rounded-2xl bg-[#e8e7e3] ${index === 0 ? "col-span-2 aspect-[1.5/1] sm:row-span-2 sm:aspect-auto sm:min-h-56" : "aspect-[1.05/1]"}`}>
        <img src={photo} alt={`${name || "Horse"} photo ${index + 1}`} className="h-full w-full object-cover" draggable
          onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
          onDrop={(event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData("text/plain")); if (Number.isInteger(from)) onMove(from, index); }}
          onDragOver={(event) => event.preventDefault()} />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
          {index === 0 ? <span className="rounded-full bg-[#2b2b2b]/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Cover photo</span> : <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white">Photo {index + 1}</span>}
          <button type="button" aria-label={`Remove photo ${index + 1}`} disabled={uploading} onClick={() => onRemove(index)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#34332f] disabled:opacity-40"><X className="h-4 w-4" /></button>
        </div>
        <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
          <button type="button" aria-label={`Move photo ${index + 1} earlier`} disabled={uploading || index === 0} onClick={() => onMove(index, index - 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 disabled:opacity-40"><ChevronUp className="h-4 w-4" /></button>
          <button type="button" disabled={uploading} aria-label={`Drag photo ${index + 1} to reorder`}
            onPointerDown={event => { if (event.pointerType === "touch") { startIndex.current = index; event.currentTarget.setPointerCapture(event.pointerId); } }}
            onPointerUp={event => {
              if (event.pointerType !== "touch" || startIndex.current === null) return;
              const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-photo-index]");
              if (target) onMove(startIndex.current, Number(target.getAttribute("data-photo-index")));
              startIndex.current = null;
            }}
            onPointerCancel={() => { startIndex.current = null; }}
            className="min-h-10 touch-none rounded-full bg-black/55 px-3 py-1 text-[10px] text-white">Drag to reorder</button>
          <button type="button" aria-label={`Move photo ${index + 1} later`} disabled={uploading || index === photos.length - 1} onClick={() => onMove(index, index + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 disabled:opacity-40"><ChevronDown className="h-4 w-4" /></button>
        </div>
      </div>)}
      {(!maximum || photos.length < maximum) ? <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#c9c6bc] bg-[#f3f1eb] px-4 text-center text-sm font-semibold text-[#705d37] hover:border-[#cdac6e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e]">
        {uploading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}{uploading ? "Uploading photos…" : "Add photos"}{maximum ? <span className="text-xs font-normal text-[#77756f]">{maximum - photos.length} remaining</span> : null}
      </button> : null}
    </div>
    <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { onFiles(event.target.files); event.target.value = ""; }} />
    <p className="mt-5 rounded-xl bg-[#f0efeb] px-4 py-3 text-sm leading-6 text-[#57564f]">Clear, well lit photos of the whole horse get the most interest.</p>
    <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
      <Input aria-label="Photo URL" type="url" value={url} onChange={(event) => { setUrl(event.target.value); setUrlError(""); }} placeholder="Add photo from a URL" className="h-11 rounded-xl border-[#dedbd2] bg-[#fbfaf7]" />
      <Button type="button" variant="outline" disabled={uploading || !url.trim() || Boolean(maximum && photos.length >= maximum)} onClick={addUrl} className="rounded-full"><Plus className="mr-2 h-4 w-4" />Add URL</Button>
    </div>
    {urlError ? <p role="alert" className="mt-2 text-xs text-[#9e5344]">{urlError}</p> : null}
    {maximum && photos.length >= maximum ? <p className="mt-2 text-xs text-[#77756f]">Maximum of {maximum} photos reached.</p> : null}
  </div>;
}
