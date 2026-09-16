"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, TrendingUp, AlertTriangle } from "lucide-react";

import { EventStatus } from "@/lib/types";
import { deriveEventStatus, eventStatusConfig, formatEventDate, isUnlimitedCapacity } from "@/lib/event-status";
import { useAdminEvents } from "@/lib/admin/events-store";

import { StatCard } from "@/components/admin/StatCard";
import { EventRowActions } from "@/components/admin/EventRowActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_OPTIONS: EventStatus[] = ["upcoming", "open", "full", "closed", "completed"];

export default function AdminEventsPage() {
  const { events, error } = useAdminEvents();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");

  const totalRegistrations = events.reduce((sum, event) => sum + event.registeredCount, 0);
  const averagePerEvent =
    events.length === 0 ? 0 : Math.round((totalRegistrations / events.length) * 10) / 10;

  const filtered = events.filter((event) => {
    if (statusFilter !== "all" && deriveEventStatus(event) !== statusFilter) return false;
    if (!search.trim()) return true;
    return event.title.toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2.5 border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <StatCard
        label="Rata-rata Registrasi / Event"
        value={averagePerEvent}
        description="Rata-rata registrasi pada setiap event yang dipublikasikan."
        icon={TrendingUp}
        className="sm:max-w-sm"
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle className="font-heading text-base font-semibold text-foreground">
            Manajemen Event
          </CardTitle>
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="h-4 w-4" />
              Buat Event
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul event..."
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="sm:w-52">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {eventStatusConfig[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
              <p className="text-sm font-medium text-foreground">Tidak ada event ditemukan.</p>
              <p className="text-sm text-muted-foreground">Coba ubah pencarian atau filter.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Batas Pendaftaran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Peserta</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((event) => {
                  const config = eventStatusConfig[deriveEventStatus(event)];
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatEventDate(event.eventStart, event.timezone)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatEventDate(event.registrationDeadline, event.timezone)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{config.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isUnlimitedCapacity(event.maxParticipants)
                          ? `${event.registeredCount} (tidak terbatas)`
                          : `${event.registeredCount}/${event.maxParticipants}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <EventRowActions event={event} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
