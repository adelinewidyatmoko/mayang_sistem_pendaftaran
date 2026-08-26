"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useAdminEvents } from "@/lib/admin/events-store";
import { EventEditor } from "@/components/admin/EventEditor";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const { events, loading } = useAdminEvents();
  const event = events.find((item) => item.id === id);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat...</p>;
  }

  if (!event) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground">Event tidak ditemukan.</p>
        <Link href="/admin/events" className="text-sm text-teal-deep underline">
          Kembali ke Semua Event
        </Link>
      </div>
    );
  }

  return <EventEditor mode="edit" event={event} />;
}
