"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { ErrorState } from "@/components/public/ErrorState";

// Catches any error thrown while rendering a page under this layout —
// most commonly a failed Supabase fetch (network blip, outage, RLS
// misconfig) in one of the server components that call getPublishedEvents/
// getEventById directly with no try/catch of their own. Without this file,
// Next falls back to its bare, unstyled default error page (PRD §34: every
// data-driven page needs a real error state, not a blank/generic screen).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center">
        <ErrorState
          title="Terjadi Kesalahan"
          message="Halaman ini gagal dimuat. Ini biasanya sementara — coba muat ulang, atau kembali ke beranda."
          onRetry={reset}
          homeHref="/"
        />
      </main>
      <Footer />
    </div>
  );
}
