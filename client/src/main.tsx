import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for push notifications + app shell caching
if ('serviceWorker' in navigator) {
  let refreshingForNewServiceWorker = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshingForNewServiceWorker) return;
    refreshingForNewServiceWorker = true;
    window.location.reload();
  });

  // If a cached app shell references an asset removed by a newer deployment,
  // reload after the service worker discards that stale shell.
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type !== 'STALE_SHELL_RELOAD' || refreshingForNewServiceWorker) return;
    refreshingForNewServiceWorker = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration.scope);
        registration.update();
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Dismiss the splash screen smoothly once React is ready to paint
function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.style.opacity = '0';
  setTimeout(() => { splash.style.display = 'none'; }, 300);
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Hide splash after first render — requestAnimationFrame ensures the DOM has painted
requestAnimationFrame(() => requestAnimationFrame(hideSplash));

// --- iOS PWA white-screen-on-resume recovery -------------------------------
// When an installed PWA is backgrounded on iOS, WebKit may either (a) tear down
// the React tree / fail a reload when the network isn't ready yet, leaving an
// empty page, or (b) keep the page alive but drop its compositor layers, leaving
// a blank white paint. This watchdog recovers from both when the app resumes.
let hiddenAt = 0;

function appLooksBlank() {
  const el = document.getElementById("root");
  return !el || el.childElementCount === 0;
}

function nudgeRepaint() {
  // Force WebKit to re-composite any layers it dropped while backgrounded
  const html = document.documentElement;
  html.style.transform = "translateZ(0)";
  requestAnimationFrame(() => {
    html.style.transform = "";
  });
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    hiddenAt = Date.now();
    return;
  }
  // Became visible again. Only act if we actually returned from background —
  // this guard also prevents any reload loop on a genuinely broken boot.
  if (!hiddenAt) return;
  hiddenAt = 0;
  // Repaint immediately to recover dropped compositor layers.
  nudgeRepaint();
  // Then, after a short grace period for the resumed page to re-render, reload
  // only if the React tree is genuinely gone (avoids reloading on a transient
  // resume frame).
  if (appLooksBlank()) {
    setTimeout(() => {
      if (appLooksBlank()) window.location.reload();
    }, 300);
  }
});

// bfcache restore (iOS sometimes restores a frozen page this way)
window.addEventListener("pageshow", (event) => {
  if (event.persisted && appLooksBlank()) {
    window.location.reload();
  }
});
