import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isEmbeddedPage, isIOSDevice } from "@/lib/webPushSupport";
import { useToast } from "@/hooks/use-toast";

export function NotificationDeviceCheck() {
  const [report, setReport] = useState("");
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  const check = async () => {
    setChecking(true);
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const lines = [
      `Site: ${window.location.origin}`,
      `Window: ${isEmbeddedPage() ? "Embedded inside another page" : standalone ? "Installed Home Screen app" : "Browser window"}`,
      `iOS detected: ${isIOSDevice() ? "Yes" : "No"}`,
      `Secure connection: ${window.isSecureContext ? "Yes" : "No"}`,
      `Permission: ${typeof Notification === "undefined" ? "API unavailable" : Notification.permission}`,
      `Push API: ${"PushManager" in window ? "Available" : "Unavailable"}`,
    ];
    try {
      if ("serviceWorker" in navigator) {
        // Unlike .ready, this finishes even when no worker is registered.
        const registration = await navigator.serviceWorker.getRegistration();
        lines.push(`Service worker: ${registration ? new URL(registration.scope).origin + new URL(registration.scope).pathname : "Not registered"}`);
        if (registration && "pushManager" in registration) {
          const subscription = await registration.pushManager.getSubscription();
          lines.push(`Local push subscription: ${subscription ? "Present" : "Absent"}`);
        } else {
          lines.push("Local push subscription: Not available");
        }
      } else {
        lines.push("Service worker: API unavailable");
      }
    } catch {
      lines.push("Service worker/subscription: Browser did not allow this check");
    }
    lines.push(`Browser identification: ${navigator.userAgent}`);
    setReport(lines.join("\n"));
    setChecking(false);
  };

  useEffect(() => { void check(); }, []);

  return (
    <details className="rounded-md border p-3 text-sm" data-testid="notification-device-check">
      <summary className="cursor-pointer font-medium">Device notification check</summary>
      <p className="mt-3 text-muted-foreground">
        This checks the current window, not another installation with the same name.
        The report contains no notification keys or account details.
      </p>
      <pre className="my-3 whitespace-pre-wrap break-words text-xs">{report || "Checking this device…"}</pre>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={checking} onClick={() => void check()}>
          {checking ? "Checking…" : "Check again"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={!report || checking} onClick={async () => {
          try {
            await navigator.clipboard.writeText(report);
            toast({ title: "Device check copied" });
          } catch {
            toast({ title: "Could not copy", description: "You can take a screenshot of the report instead." });
          }
        }}>Copy report</Button>
      </div>
    </details>
  );
}