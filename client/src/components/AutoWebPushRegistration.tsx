import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AUTO_PUSH_OPT_OUT_KEY, supportsWebPushHere } from "@/lib/webPushSupport";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const rawData = atob((base64String + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(rawData, char => char.charCodeAt(0));
}

async function registerGrantedDevice() {
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const response = await fetch("/api/push/vapid-public-key");
    if (!response.ok) throw new Error("Unable to load push public key");
    const { publicKey } = await response.json();
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const p256dhKey = subscription.getKey("p256dh");
  const authKey = subscription.getKey("auth");
  await apiRequest("POST", "/api/push/subscribe", {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: p256dhKey ? btoa(String.fromCharCode(...new Uint8Array(p256dhKey))) : "",
      auth: authKey ? btoa(String.fromCharCode(...new Uint8Array(authKey))) : "",
    },
  });
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["/api/push/status"] }),
    queryClient.invalidateQueries({ queryKey: ["push", "current-device"] }),
  ]);
}

export function AutoWebPushRegistration() {
  const { user } = useAuth();
  const syncedUserId = useRef<number | null>(null);
  const registering = useRef(false);

  useEffect(() => {
    if (!user) {
      syncedUserId.current = null;
      return;
    }

    const syncIfAllowed = async () => {
      if (document.visibilityState !== "visible" ||
          !supportsWebPushHere() ||
          Notification.permission !== "granted" ||
          localStorage.getItem(AUTO_PUSH_OPT_OUT_KEY) === "true" ||
          syncedUserId.current === user.id ||
          registering.current) return;

      registering.current = true;
      try {
        await registerGrantedDevice();
        syncedUserId.current = user.id;
      } catch (error) {
        console.warn("Could not register push for this device:", error);
      } finally {
        registering.current = false;
      }
    };

    void syncIfAllowed();
    window.addEventListener("focus", syncIfAllowed);
    document.addEventListener("visibilitychange", syncIfAllowed);
    return () => {
      window.removeEventListener("focus", syncIfAllowed);
      document.removeEventListener("visibilitychange", syncIfAllowed);
    };
  }, [user?.id]);

  return null;
}