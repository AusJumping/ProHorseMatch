import { useEffect, useState } from "react";
import { isRedesignReviewHost, showSampleListingNotice } from "@shared/redesignReview";

export default function RedesignSampleBanner() {
  const [status, setStatus] = useState<unknown>(null);
  const buildFlag = import.meta.env.VITE_REDESIGN_SANDBOX;
  const hostname = window.location.hostname;

  useEffect(() => {
    if (buildFlag !== "true" || !isRedesignReviewHost(hostname)) return;
    const controller = new AbortController();
    fetch("/api/redesign-status", { signal: controller.signal, credentials: "same-origin" })
      .then(response => response.ok ? response.json() : null)
      .then(setStatus)
      .catch(() => { if (!controller.signal.aborted) setStatus(null); });
    return () => controller.abort();
  }, [buildFlag, hostname]);

  if (!showSampleListingNotice(buildFlag, hostname, status)) return null;
  return <div role="note" aria-label="Test site notice" data-testid="redesign-sample-notice"
    className="bg-[#ece5d6] px-4 py-1.5 text-center text-xs font-medium leading-4 text-[#51452d]">
    Test site · Sample listings only
  </div>;
}
