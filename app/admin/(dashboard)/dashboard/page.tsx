"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Users, Activity, AlertTriangle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { getRegistrationsForAdmin, Registration } from "@/lib/data/registrations";
import { getDashboardStats } from "@/lib/admin/stats";
import { deriveEventStatus, eventStatusConfig, formatEventDate } from "@/lib/event-status";
import { useAdminEvents } from "@/lib/admin/events-store";
import { StatCard } from "@/components/admin/StatCard";
import { EventRowActions } from "@/components/admin/EventRowActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminDashboardPage() {
  const { events, error: eventsError } = useAdminEvents();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [registrationsError, setRegistrationsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRegistrationsForAdmin(createClient())
      .then((data) => {
        if (!cancelled) setRegistrations(data);
      })
      .catch(() => {
        if (!cancelled) setRegistrationsError("Gagal memuat data pendaftaran.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadError = eventsError ?? registrationsError;

  const stats = getDashboardStats(events, registrations);

  const recentRegistrations = [...registrations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const eventById = new Map(events.map((event) => [event.id, event]));

  const allEventsSorted = [...events].sort(
    (a, b) => new Date(b.eventStart).getTime() - new Date(a.eventStart).getTime()
  );

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="flex items-center gap-2.5 border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="font-medium">{loadError}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Events"
          value={stats.totalEvents}
          description="Seluruh event yang tercatat."
          icon={CalendarDays}
        />
        <StatCard
          label="Active Events"
          value={stats.activeEventsCount}
          description="Event yang sedang aktif."
          icon={Activity}
        />
        <StatCard
          label="Total Registrasi"
          value={stats.totalRegistrations}
          description="Semua pendaftaran event yang tercatat."
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Semua Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allEventsSorted.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada event.</p>
            ) : (
              allEventsSorted.map((event) => {
                const config = eventStatusConfig[deriveEventStatus(event)];
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatEventDate(event.eventStart)} · {event.location}
                      </p>
                      <Badge variant="outline" className="mt-1.5">
                        {config.label}
                      </Badge>
                    </div>
                    <EventRowActions event={event} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Pendaftaran Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peserta</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Terdaftar Pada</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRegistrations.map((registration) => {
                  const event = eventById.get(registration.eventId);
                  const config = event ? eventStatusConfig[deriveEventStatus(event)] : null;
                  return (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {event?.title ?? registration.eventId}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatEventDate(registration.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{config?.label ?? "Terdaftar"}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
