"use client";
import { useEffect } from "react";

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

/**
 * Fires the custom Pixel event "LeadThankYou" once per real form submission.
 * The form stores a one-time ticket in sessionStorage; reloading or opening /thank-you directly fires nothing.
 */
export function ThankYouEvent() {
  useEffect(() => {
    let ticket: { id: string; lp: string; service: string } | null = null;
    try { ticket = JSON.parse(sessionStorage.getItem("vit_lead") || "null"); sessionStorage.removeItem("vit_lead"); } catch {}
    if (!ticket?.id) return;
    let tries = 0;
    const fire = () => {
      if (window.fbq) window.fbq("trackCustom", "LeadThankYou", { content_category: ticket!.lp, content_name: ticket!.service || "Website", currency: "INR" }, { eventID: `ty_${ticket!.id}` });
      else if (tries++ < 20) setTimeout(fire, 250);
    };
    fire();
  }, []);
  return null;
}
