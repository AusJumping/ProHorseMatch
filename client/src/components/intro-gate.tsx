import { useEffect, useRef, useState, type ReactNode } from "react";
import mobileIntro from "@/assets/intro-video-mobile.mp4";

// Add the landscape import here when it arrives.
const INTRO_SOURCES = [
  { minWidth: 768, src: null },
  { minWidth: 0, src: mobileIntro },
] as const;

// Keep navigation within one app opening from replaying the intro. A page
// reload starts a new opening; a background/resume cycle resets this below.
let shownThisOpening = false;

function pickIntroSource(width: number): string | null {
  return INTRO_SOURCES.find(({ minWidth }) => width >= minWidth)?.src ?? null;
}

function claimIntroSource(): string | null {
  if (document.visibilityState !== "visible" || shownThisOpening) return null;
  const source = pickIntroSource(window.innerWidth);
  if (source) shownThisOpening = true;
  return source;
}

type Playback = { source: string; sequence: number };

export function IntroGate({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playback, setPlayback] = useState<Playback | null>(() => {
    const source = claimIntroSource();
    return source ? { source, sequence: 0 } : null;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!playback || !video) return;
    let cancelled = false;
    document.documentElement.classList.add("intro-playing");

    // Set both the DOM properties and attributes before explicitly requesting
    // playback: iOS does not always honour React's muted prop on its own.
    video.defaultMuted = true;
    video.muted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    const play = () => {
      video.play().catch(error => {
        if (!cancelled && error.name !== "AbortError") setPlayback(null);
      });
    };
    play();
    video.addEventListener("loadeddata", play);
    // Low Power Mode or a stalled download must never leave a play button
    // blocking entry to the app.
    const timeout = window.setTimeout(() => {
      if (!cancelled && video.currentTime === 0) setPlayback(null);
    }, 8000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      video.removeEventListener("loadeddata", play);
      document.documentElement.classList.remove("intro-playing");
    };
  }, [playback]);

  useEffect(() => {
    const onResize = () => {
      // Leave the intro if resized to a screen without a video source.
      if (!pickIntroSource(window.innerWidth)) setPlayback(null);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        shownThisOpening = false;
        return;
      }
      // Installed apps can resume without a reload. Restart the video from
      // the beginning even if the previous opening ended while it was playing.
      const source = claimIntroSource();
      if (source) setPlayback(previous => ({
        source,
        sequence: (previous?.sequence ?? 0) + 1,
      }));
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const finishIntro = () => {
    setPlayback(null);
  };

  if (!playback) return <>{children}</>;

  return (
    <div className="intro-overlay fixed inset-0 z-[9999] overflow-hidden bg-[#2b2b2b]">
      <video
        ref={videoRef}
        key={`${playback.source}-${playback.sequence}`}
        src={playback.source}
        className="intro-video absolute inset-0 block h-full w-full border-0 object-cover"
        autoPlay
        controls={false}
        disablePictureInPicture
        playsInline
        muted
        preload="auto"
        onEnded={finishIntro}
        onError={finishIntro}
        aria-label="Pro Horse Match introduction"
      />
      <button
        type="button"
        onClick={finishIntro}
        className="absolute right-4 z-10 rounded-full bg-black/60 px-5 py-2.5 text-sm font-semibold text-white shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
        aria-label="Skip introduction"
      >
        Skip
      </button>
    </div>
  );
}