import { useEffect, useState, type ReactNode } from "react";
import mobileIntro from "@/assets/intro-video-mobile.mp4";

const INTRO_LAST_SHOWN_KEY = "phm_intro_last_shown";

// Add the landscape import here when it arrives; the same daily date applies
// regardless of which source was selected.
const INTRO_SOURCES = [
  { minWidth: 768, src: null },
  { minWidth: 0, src: mobileIntro },
] as const;

function pickIntroSource(width: number): string | null {
  return INTRO_SOURCES.find(({ minWidth }) => width >= minWidth)?.src ?? null;
}

function todayLocalDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function introSourceForToday(): string | null {
  const source = pickIntroSource(window.innerWidth);
  if (!source) return null;

  try {
    const today = todayLocalDate();
    if (window.localStorage.getItem(INTRO_LAST_SHOWN_KEY) === today) return null;
    // Claim today's showing as soon as the intro opens, even if it is skipped.
    window.localStorage.setItem(INTRO_LAST_SHOWN_KEY, today);
  } catch {
    // If storage is unavailable, the intro still works for this visit.
  }
  return source;
}

export function IntroGate({ children }: { children: ReactNode }) {
  const [videoSource, setVideoSource] = useState<string | null>(introSourceForToday);

  useEffect(() => {
    const onResize = () => {
      // Leave the intro if resized to a screen without a video source.
      if (videoSource && !pickIntroSource(window.innerWidth)) setVideoSource(null);
    };
    const onVisibilityChange = () => {
      // Installed apps can resume the next morning without reloading the page.
      if (document.visibilityState === "visible" && !videoSource) {
        setVideoSource(introSourceForToday());
      }
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [videoSource]);

  const finishIntro = () => {
    setVideoSource(null);
  };

  if (!videoSource) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#2b2b2b]">
      <video
        key={videoSource}
        src={videoSource}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
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