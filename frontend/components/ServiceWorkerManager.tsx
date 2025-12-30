"use client";

import { useEffect } from "react";

export default function ServiceWorkerManager() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) {
            return;
          }
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              console.info("[PWA] Updated service worker installed.");
            }
          });
        });
      } catch (error) {
        console.warn("[PWA] Service worker registration failed.", error);
      }
    };

    register();
  }, []);

  return null;
}
