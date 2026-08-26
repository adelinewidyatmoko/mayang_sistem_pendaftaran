"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

import { EventItem } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  createEvent as createEventRequest,
  deleteEvent as deleteEventRequest,
  EventInput,
  getAllEvents,
  updateEvent as updateEventRequest,
} from "@/lib/data/events";

type AdminEventsContextValue = {
  events: EventItem[];
  loading: boolean;
  error: string | null;
  createEvent: (input: EventInput) => Promise<void>;
  updateEvent: (id: string, patch: Partial<EventInput>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
};

const AdminEventsContext = createContext<AdminEventsContextValue | null>(null);

// Backed by Supabase now — fetched once on mount and kept in sync locally
// after each mutation so the Dashboard and Events page share one source of
// truth within the session without refetching on every render.
export function AdminEventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const data = await getAllEvents(supabase);
        if (!cancelled) setEvents(data);
      } catch {
        if (!cancelled) setError("Gagal memuat data event.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createEvent(input: EventInput) {
    const supabase = createClient();
    const created = await createEventRequest(supabase, input);
    setEvents((prev) => [created, ...prev]);
  }

  async function updateEvent(id: string, patch: Partial<EventInput>) {
    const supabase = createClient();
    const updated = await updateEventRequest(supabase, id, patch);
    setEvents((prev) => prev.map((event) => (event.id === id ? updated : event)));
  }

  async function deleteEvent(id: string) {
    const supabase = createClient();
    await deleteEventRequest(supabase, id);
    setEvents((prev) => prev.filter((event) => event.id !== id));
  }

  return (
    <AdminEventsContext.Provider
      value={{ events, loading, error, createEvent, updateEvent, deleteEvent }}
    >
      {children}
    </AdminEventsContext.Provider>
  );
}

export function useAdminEvents() {
  const context = useContext(AdminEventsContext);
  if (!context) {
    throw new Error("useAdminEvents must be used within an AdminEventsProvider");
  }
  return context;
}
