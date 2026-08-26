"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, Eye, Pencil, Trash2, AlertTriangle } from "lucide-react";

import { useAdminEvents } from "@/lib/admin/events-store";
import { createClient } from "@/lib/supabase/client";
import {
  deleteRegistration,
  getRegistrationsForAdmin,
  Registration,
  updateRegistration,
} from "@/lib/data/registrations";
import { getEventSummary } from "@/lib/admin/stats";
import { downloadRegistrationsCsv } from "@/lib/admin/csv";
import { deriveEventStatus, formatEventDate, isUnlimitedCapacity } from "@/lib/event-status";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const REGISTRATION_STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "terdaftar", label: "Terdaftar" },
  { value: "selesai", label: "Event Selesai" },
];

export default function AdminAttendeesPage() {
  const { events, error: eventsError } = useAdminEvents();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [editing, setEditing] = useState<Registration | null>(null);
  const [deleting, setDeleting] = useState<Registration | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const data = await getRegistrationsForAdmin(supabase);
        if (!cancelled) setRegistrations(data);
      } catch {
        if (!cancelled) setLoadError("Gagal memuat data pendaftaran.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const eventById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return registrations.filter((registration) => {
      const event = eventById.get(registration.eventId);
      const isCompleted = event ? deriveEventStatus(event) === "completed" : false;

      if (eventFilter !== "all" && registration.eventId !== eventFilter) return false;
      if (statusFilter === "terdaftar" && isCompleted) return false;
      if (statusFilter === "selesai" && !isCompleted) return false;

      if (!query) return true;
      return (
        registration.name.toLowerCase().includes(query) ||
        registration.email.toLowerCase().includes(query) ||
        registration.phone.includes(query) ||
        registration.registrationNumber.toLowerCase().includes(query)
      );
    });
  }, [registrations, search, eventFilter, statusFilter, eventById]);

  const summary = useMemo(() => getEventSummary(events, registrations), [events, registrations]);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const supabase = createClient();
      await deleteRegistration(supabase, deleting.id);
      setRegistrations((prev) => prev.filter((r) => r.id !== deleting.id));
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {eventsError && (
        <div className="flex items-center gap-2.5 border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="font-medium">{eventsError}</p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="font-heading text-base font-semibold text-foreground">
              Pendaftar
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Kelola dan export data pendaftaran seluruh event.
            </p>
          </div>
          <Button
            onClick={() => downloadRegistrationsCsv(filtered, events)}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, email, telepon, atau Registration ID..."
                className="pl-8"
              />
            </div>

            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Semua Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Event</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                {REGISTRATION_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Memuat...</p>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
              <AlertTriangle className="mb-1 h-5 w-5 text-destructive" />
              <p className="text-sm font-medium text-destructive">{loadError}</p>
              <p className="text-sm text-muted-foreground">
                Periksa koneksi internet kamu, lalu muat ulang halaman.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
              <p className="text-sm font-medium text-foreground">Belum ada pendaftaran.</p>
              <p className="text-sm text-muted-foreground">
                Coba ubah kata kunci pencarian atau filter yang dipakai.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration ID</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Tanggal Event</TableHead>
                  <TableHead>Terdaftar Pada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((registration) => {
                  const event = eventById.get(registration.eventId);
                  const isCompleted = event ? deriveEventStatus(event) === "completed" : false;
                  return (
                    <TableRow key={registration.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {registration.registrationNumber}
                      </TableCell>
                      <TableCell className="font-medium">{registration.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {event?.title ?? registration.eventId}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {event ? formatEventDate(event.eventStart) : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatEventDate(registration.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isCompleted ? "outline" : "default"}>
                          {isCompleted ? "Event Selesai" : "Terdaftar"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelected(registration)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Detail {registration.name}</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditing(registration)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit {registration.name}</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleting(registration)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Hapus {registration.name}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold text-foreground">
            Ringkasan per Event
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Registrasi</TableHead>
                <TableHead className="text-right">Kapasitas</TableHead>
                <TableHead className="text-right">Sisa</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map(({ event, registeredCount, remaining }) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell className="text-right">{registeredCount}</TableCell>
                  <TableCell className="text-right">
                    {isUnlimitedCapacity(event.maxParticipants) ? "Tidak terbatas" : event.maxParticipants}
                  </TableCell>
                  <TableCell className="text-right">{remaining ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{deriveEventStatus(event)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Detail Peserta</DialogTitle>
                <DialogDescription>
                  {selected.registrationNumber} · {eventById.get(selected.eventId)?.title}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <DetailRow label="Nama Lengkap" value={selected.name} />
                <DetailRow label="Telepon" value={selected.phone} />
                <DetailRow label="Email" value={selected.email} />
                <DetailRow label="Asal / Domisili" value={selected.origin} />
                <DetailRow label="Tanggal Lahir" value={formatEventDate(selected.dateOfBirth)} />
                <DetailRow
                  label="Waktu Pendaftaran"
                  value={formatEventDate(selected.createdAt)}
                />
                <div className="col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Pesan
                  </dt>
                  <dd className="mt-1 text-foreground">{selected.message || "-"}</dd>
                </div>
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          {editing && (
            <EditRegistrationForm
              key={editing.id}
              registration={editing}
              onCancel={() => setEditing(null)}
              onSaved={(updated) => {
                setRegistrations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pendaftaran ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pendaftaran {deleting?.name} ({deleting?.registrationNumber}) akan dihapus permanen.
              Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteBusy}>
              {deleteBusy ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditRegistrationForm({
  registration,
  onCancel,
  onSaved,
}: {
  registration: Registration;
  onCancel: () => void;
  onSaved: (updated: Registration) => void;
}) {
  const [values, setValues] = useState({
    name: registration.name,
    phone: registration.phone,
    email: registration.email,
    origin: registration.origin,
    dateOfBirth: registration.dateOfBirth,
    message: registration.message ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const updated = await updateRegistration(supabase, registration.id, {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        origin: values.origin.trim(),
        dateOfBirth: values.dateOfBirth,
        message: values.message.trim() || null,
      });
      onSaved(updated);
    } catch {
      setError("Gagal menyimpan perubahan. Cek kembali data yang diisi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Peserta</DialogTitle>
        <DialogDescription>{registration.registrationNumber}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="edit-name">Nama Lengkap</Label>
          <Input
            id="edit-name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-phone">Telepon</Label>
            <Input
              id="edit-phone"
              value={values.phone}
              onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-origin">Asal / Domisili</Label>
            <Input
              id="edit-origin"
              value={values.origin}
              onChange={(e) => setValues((v) => ({ ...v, origin: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-dob">Tanggal Lahir</Label>
            <Input
              id="edit-dob"
              type="date"
              value={values.dateOfBirth}
              onChange={(e) => setValues((v) => ({ ...v, dateOfBirth: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="edit-message">Pesan</Label>
          <textarea
            id="edit-message"
            rows={3}
            value={values.message}
            onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-foreground">{value}</dd>
    </div>
  );
}
