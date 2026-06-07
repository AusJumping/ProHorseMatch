import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for push notifications + app shell caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration.scope);
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
