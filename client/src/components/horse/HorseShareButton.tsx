import { useState } from "react";
import { Share2 } from "lucide-react";

export default function HorseShareButton({ url }: { url: string }) {
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const [status, setStatus] = useState("");

  const share = async () => {
    setStatus("");
    setFallbackVisible(false);
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setStatus("Link copied. You can also select the listing address below.");
    } catch {
      setStatus("Sharing and clipboard access are unavailable. Select and copy the listing address below.");
    }
    setFallbackVisible(true);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Share this horse"
        onClick={share}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5dfd2] bg-white text-neutral-700 transition-colors hover:bg-[#f7f4ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cdac6e]"
      >
        <Share2 className="h-4 w-4" />
      </button>
      {fallbackVisible && (
        <div className="absolute right-0 top-12 z-30 w-[min(19rem,calc(100vw-2rem))] rounded-lg border border-[#e5dfd2] bg-white p-3 shadow-lg" role="status" aria-live="polite">
          <p className="text-xs leading-5 text-neutral-600">{status}</p>
          <label htmlFor="horse-share-url" className="sr-only">Listing address</label>
          <input
            id="horse-share-url"
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 w-full rounded-md border border-neutral-200 bg-[#fbfaf7] px-2 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#cdac6e]"
          />
          <button type="button" className="mt-2 text-xs font-semibold text-[#80652f] underline underline-offset-2" onClick={() => setFallbackVisible(false)}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
