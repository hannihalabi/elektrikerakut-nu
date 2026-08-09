"use client";

import { useEffect } from "react";

export function AnalyticsTracker() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "PAGE_VIEW", path: window.location.pathname }),
      keepalive: true,
    });
  }, []);

  return null;
}
