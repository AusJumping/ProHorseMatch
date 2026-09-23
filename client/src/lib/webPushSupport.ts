import { Capacitor } from "@capacitor/core";

export const AUTO_PUSH_OPT_OUT_KEY = "phm_push_opted_out";

export function isIOSBrowserTab(): boolean {
  if (typeof window === "undefined") return false;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isIOS && !Capacitor.isNativePlatform() &&
    !window.matchMedia("(display-mode: standalone)").matches &&
    (navigator as Navigator & { standalone?: boolean }).standalone !== true;
}

export function supportsWebPushHere(): boolean {
  return typeof window !== "undefined" &&
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