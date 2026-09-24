import { Capacitor } from "@capacitor/core";

export const AUTO_PUSH_OPT_OUT_KEY = "phm_push_opted_out";

export function isEmbeddedPage(): boolean {
  return typeof window !== "undefined" && window.self !== window.top;
}

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  // Safari's desktop-site mode can disguise an iPhone as a Mac. The
  // iOS-only standalone property remains available even in a browser tab.
  return Capacitor.getPlatform() === "ios" ||
    "standalone" in navigator ||
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isIOSBrowserTab(): boolean {
  if (typeof window === "undefined") return false;
  return isIOSDevice() && !Capacitor.isNativePlatform() &&
    !window.matchMedia("(display-mode: standalone)").matches &&
    (navigator as Navigator & { standalone?: boolean }).standalone !== true;
}

export function supportsWebPushHere(): boolean {
  return typeof window !== "undefined" &&
    !isEmbeddedPage() &&
    !Capacitor.isNativePlatform() &&
    !isIOSBrowserTab() &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;
}

export async function hasCurrentWebPushSubscription(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  return Boolean(await registration.pushManager.getSubscription());
}