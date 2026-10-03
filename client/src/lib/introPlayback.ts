// A temporary autoplay rejection during WebKit startup/resume is not a media
// failure. Retry after readiness events before falling back to the application.
export function startIntroPlayback(video: HTMLVideoElement, onUnavailable: () => void) {
  let cancelled = false;
  let started = false;
  video.defaultMuted = true;
  video.muted = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  const play = () => {
    if (cancelled || started) return;
    void video.play().catch(() => {
      // Keep the intro mounted for a readiness event or the next retry.
      // The deadline below handles persistent browser restrictions.
    });
  };
  const onPlaying = () => { started = true; };
  video.addEventListener("playing", onPlaying);
  video.addEventListener("loadeddata", play);
  video.addEventListener("canplay", play);
  const retries = [250, 1000, 2500].map(delay => window.setTimeout(play, delay));
  const deadline = window.setTimeout(() => {
    if (!cancelled && !started && video.currentTime === 0) onUnavailable();
  }, 15000);
  play();

  return () => {
    cancelled = true;
    retries.forEach(timer => window.clearTimeout(timer));
    window.clearTimeout(deadline);
    video.removeEventListener("playing", onPlaying);
    video.removeEventListener("loadeddata", play);
    video.removeEventListener("canplay", play);
  };
}