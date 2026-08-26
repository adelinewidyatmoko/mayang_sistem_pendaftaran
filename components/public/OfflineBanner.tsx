"use client";

import { useEffect, useState } from "react";
import { WifiOffIcon } from "./icons";

// Global, not route-specific — mounted once in the root layout so both the
// public site and the admin dashboard get the same "you're offline" signal
// instead of individual fetches silently failing with no explanation.
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // navigator.onLine isn't available during server render, so the real
    // initial state can only be read post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOffline(!navigator.onLine);

    function handleOffline() {
      setIsOffline(true);
    }
    function handleOnline() {
      setIsOffline(false);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  // Deliberately a normal in-flow block, not `fixed` — a fixed banner would
  // overlap the sticky Navbar instead of pushing it down (Navbar has no way
  // to know a fixed sibling is covering it). Placed before <Navbar> in the
  // layout, so it just pushes everything below it down like any other
  // element; scrolling it out of view when the page scrolls is fine for a
  // transient, page-load-time notification like this.
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-teal-deep px-4 py-2.5 text-center text-sm font-medium text-white"
    >
      <WifiOffIcon className="h-4 w-4 shrink-0" />
      Tidak ada koneksi internet. Beberapa fitur mungkin tidak berfungsi.
    </div>
  );
}
