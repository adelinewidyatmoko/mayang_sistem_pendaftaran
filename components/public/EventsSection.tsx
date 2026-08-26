"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EventItem, EventStatus } from "@/lib/types";
import { deriveEventStatus } from "@/lib/event-status";
import { EventCard } from "./EventCard";
import { ArrowLeftIcon } from "./icons";

const filters: { key: "all" | EventStatus; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "upcoming", label: "Akan Datang" },
  { key: "open", label: "Pendaftaran Dibuka" },
  { key: "closed", label: "Pendaftaran Ditutup" },
  { key: "completed", label: "Selesai" },
];

// 3 columns at the lg breakpoint (see the grid below), so 2 full rows there.
const LANDING_PREVIEW_COUNT = 6;
// 3 rows at lg.
const PAGE_SIZE = 9;

export function EventsSection({
  events,
  variant = "full",
}: {
  events: EventItem[];
  /** "preview" = landing page teaser: no filters, capped rows, a "view all"
   *  link. "full" = the dedicated /event listing: filters + pagination. */
  variant?: "preview" | "full";
}) {
  const [activeFilter, setActiveFilter] = useState<"all" | EventStatus>("all");
  const [page, setPage] = useState(1);
  const isPreview = variant === "preview";

  const filteredEvents = useMemo(() => {
    if (activeFilter === "all") return events;
    return events.filter((event) => deriveEventStatus(event) === activeFilter);
  }, [events, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  // Switching filters can shrink the result set below the current page —
  // clamp at render time instead of reacting to the change after the fact.
  const currentPage = Math.min(page, totalPages);

  function handleFilterChange(key: "all" | EventStatus) {
    setActiveFilter(key);
    setPage(1);
  }

  const displayedEvents = isPreview
    ? filteredEvents.slice(0, LANDING_PREVIEW_COUNT)
    : filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section id="events" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-3xl font-semibold text-teal-deep">
            Event Mayang Collection
          </h2>
          <p className="mt-2 text-foreground/60">
            Pilih event yang aktif, lalu daftar langsung tanpa perlu bikin akun.
          </p>
        </div>
      </div>

      {!isPreview && (
        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => handleFilterChange(filter.key)}
              className={`border px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === filter.key
                  ? "border-teal bg-teal text-white"
                  : "border-border bg-white text-foreground/60 hover:border-teal/40 hover:text-teal-deep"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {displayedEvents.length === 0 ? (
        <div className="mt-12 border border-dashed border-border py-16 text-center text-foreground/50">
          Belum ada event pada kategori ini.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedEvents.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>
      )}

      {isPreview && events.length > LANDING_PREVIEW_COUNT && (
        <div className="mt-10 flex justify-center">
          <Link
            href="/event"
            className="inline-flex items-center gap-2 border border-teal-deep px-6 py-3 text-sm font-semibold text-teal-deep transition-colors hover:bg-teal-deep hover:text-white"
          >
            Lihat Semua Event
          </Link>
        </div>
      )}

      {!isPreview && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1.5 border border-border bg-white px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-teal/40 hover:text-teal-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Sebelumnya
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                aria-current={pageNumber === currentPage ? "page" : undefined}
                className={`h-9 w-9 border text-sm font-medium transition-colors ${
                  pageNumber === currentPage
                    ? "border-teal bg-teal text-white"
                    : "border-border bg-white text-foreground/60 hover:border-teal/40 hover:text-teal-deep"
                }`}
              >
                {pageNumber}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1.5 border border-border bg-white px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-teal/40 hover:text-teal-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            Selanjutnya
            <ArrowLeftIcon className="h-4 w-4 rotate-180" />
          </button>
        </div>
      )}
    </section>
  );
}
