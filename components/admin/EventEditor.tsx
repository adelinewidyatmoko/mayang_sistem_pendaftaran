"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState, DragEvent } from "react";
import { ArrowLeft, ImagePlus, X } from "lucide-react";

import { EventItem } from "@/lib/types";
import { deriveEventStatus, eventStatusConfig } from "@/lib/event-status";
import { useAdminEvents } from "@/lib/admin/events-store";
import { EventInput } from "@/lib/data/events";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type FormValues = {
  title: string;
  description: string;
  coverImage: string;
  location: string;
  eventStart: string;
  eventEnd: string;
  registrationStart: string;
  registrationDeadline: string;
  maxParticipants: number;
  requirements: string;
  messageEnabled: boolean;
  messageLabel: string;
  published: boolean;
};

// <input type="datetime-local"> works in the browser's local wall-clock time
// with no timezone marker (e.g. "2026-08-26T12:16") — it is NOT the same as
// an ISO/UTC string. Sending that raw string straight to a `timestamptz`
// column lets Postgres interpret it using the database's session timezone
// (UTC) instead of the admin's actual local time, silently shifting every
// event/registration date by the local UTC offset. These two helpers do the
// conversion explicitly in both directions.
function toDatetimeLocalValue(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoString(datetimeLocalValue: string): string {
  return new Date(datetimeLocalValue).toISOString();
}

function toFormValues(event: EventItem): FormValues {
  return {
    title: event.title,
    description: event.description,
    coverImage: event.coverImage ?? "",
    location: event.location,
    eventStart: toDatetimeLocalValue(event.eventStart),
    eventEnd: toDatetimeLocalValue(event.eventEnd),
    registrationStart: toDatetimeLocalValue(event.registrationStart),
    registrationDeadline: toDatetimeLocalValue(event.registrationDeadline),
    maxParticipants: event.maxParticipants,
    requirements: event.requirements.join("\n"),
    messageEnabled: event.messageEnabled,
    messageLabel: event.messageLabel,
    published: event.published,
  };
}

const emptyForm: FormValues = {
  title: "",
  description: "",
  coverImage: "",
  location: "",
  eventStart: "",
  eventEnd: "",
  registrationStart: "",
  registrationDeadline: "",
  maxParticipants: 50,
  requirements: "",
  messageEnabled: false,
  messageLabel: "",
  published: false,
};

export function EventEditor({
  mode,
  event,
}: {
  mode: "create" | "edit";
  event?: EventItem;
}) {
  const router = useRouter();
  const { createEvent, updateEvent } = useAdminEvents();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<FormValues>(
    event ? toFormValues(event) : emptyForm
  );

  const previewStatus =
    formValues.eventStart && formValues.eventEnd && formValues.registrationStart && formValues.registrationDeadline
      ? deriveEventStatus({
          ...(event ?? { registeredCount: 0 }),
          eventStart: formValues.eventStart,
          eventEnd: formValues.eventEnd,
          registrationStart: formValues.registrationStart,
          registrationDeadline: formValues.registrationDeadline,
          maxParticipants: formValues.maxParticipants,
          registeredCount: event?.registeredCount ?? 0,
        } as EventItem)
      : null;

  function readCoverFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormValues((v) => ({ ...v, coverImage: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    readCoverFile(e.dataTransfer.files?.[0]);
  }

  async function handleSubmit() {
    if (!formValues.title.trim()) return;

    const requirements = formValues.requirements
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const input: EventInput = {
      title: formValues.title,
      description: formValues.description,
      coverImage: formValues.coverImage || null,
      location: formValues.location,
      eventStart: toIsoString(formValues.eventStart),
      eventEnd: toIsoString(formValues.eventEnd),
      registrationStart: toIsoString(formValues.registrationStart),
      registrationDeadline: toIsoString(formValues.registrationDeadline),
      maxParticipants: formValues.maxParticipants,
      requirements,
      messageEnabled: formValues.messageEnabled,
      messageLabel: formValues.messageLabel,
      published: formValues.published,
    };

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (mode === "edit" && event) {
        await updateEvent(event.id, input);
      } else {
        await createEvent(input);
      }
      router.push("/admin/events");
    } catch {
      setSubmitError("Gagal menyimpan event. Silakan coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Semua Event
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="font-heading text-xl font-semibold text-foreground">
              {mode === "edit" ? formValues.title || "Edit Event" : "Buat Event Baru"}
            </h1>
            {previewStatus && (
              <Badge variant="outline">{eventStatusConfig[previewStatus].label}</Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/events")}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Menyimpan..." : mode === "edit" ? "Simpan" : "Buat Event"}
          </Button>
        </div>
      </div>

      {submitError && <p className="text-sm font-medium text-destructive">{submitError}</p>}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Cover image */}
        <Card className="h-fit">
          <CardContent className="p-4">
            <Label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Gambar Cover
            </Label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"
                }`}
            >
              {formValues.coverImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- in-memory data URI, not an optimizable asset */}
                  <img
                    src={formValues.coverImage}
                    alt=""
                    className="absolute inset-0 h-full w-full rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormValues((v) => ({ ...v, coverImage: "" }));
                    }}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <p className="px-6 text-sm text-muted-foreground">
                    Drop, klik, atau unggah gambar cover event
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => readCoverFile(e.target.files?.[0])}
            />
          </CardContent>
        </Card>

        {/* Form fields */}
        <Card>
          <CardContent className="grid gap-4 p-5">
            <div className="flex items-center gap-2 rounded-md border border-border p-3">
              <input
                id="published"
                type="checkbox"
                checked={formValues.published}
                onChange={(e) => setFormValues((v) => ({ ...v, published: e.target.checked }))}
                className="h-4 w-4 accent-primary"
              />
              <Label htmlFor="published" className="flex-1">
                {formValues.published ? "Published — terlihat oleh pengunjung" : "Draft — belum terlihat oleh pengunjung"}
              </Label>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="title">Judul Event</Label>
              <Input
                id="title"
                value={formValues.title}
                onChange={(e) => setFormValues((v) => ({ ...v, title: e.target.value }))}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="description">Deskripsi Lengkap</Label>
              <textarea
                id="description"
                rows={4}
                value={formValues.description}
                onChange={(e) => setFormValues((v) => ({ ...v, description: e.target.value }))}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Detail lengkap event, ditampilkan di halaman detail."
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                value={formValues.location}
                onChange={(e) => setFormValues((v) => ({ ...v, location: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="eventStart">Tanggal &amp; Waktu Mulai (WIB)</Label>
                <Input
                  id="eventStart"
                  type="datetime-local"
                  value={formValues.eventStart}
                  onChange={(e) => setFormValues((v) => ({ ...v, eventStart: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="eventEnd">Tanggal &amp; Waktu Selesai (WIB)</Label>
                <Input
                  id="eventEnd"
                  type="datetime-local"
                  value={formValues.eventEnd}
                  onChange={(e) => setFormValues((v) => ({ ...v, eventEnd: e.target.value }))}
                />
              </div>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Semua jam di form ini mengikuti jam lokal komputer kamu — pastikan zona waktu komputer sudah WIB (Asia/Jakarta) sebelum mengisi, karena browser tidak menandai zona waktunya secara eksplisit.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="registrationStart">Mulai Pendaftaran (WIB)</Label>
                <Input
                  id="registrationStart"
                  type="datetime-local"
                  value={formValues.registrationStart}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, registrationStart: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="registrationDeadline">Batas Pendaftaran (WIB)</Label>
                <Input
                  id="registrationDeadline"
                  type="datetime-local"
                  value={formValues.registrationDeadline}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, registrationDeadline: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="maxParticipants">Kapasitas</Label>
              <Input
                id="maxParticipants"
                type="number"
                min={0}
                value={formValues.maxParticipants}
                onChange={(e) =>
                  setFormValues((v) => ({ ...v, maxParticipants: Number(e.target.value) }))
                }
              />
              <p className="text-xs text-muted-foreground">Isi 0 untuk kapasitas tidak terbatas.</p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="requirements">Persyaratan (satu per baris)</Label>
              <textarea
                id="requirements"
                rows={3}
                value={formValues.requirements}
                onChange={(e) =>
                  setFormValues((v) => ({ ...v, requirements: e.target.value }))
                }
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={"Membawa hijab polos\nDatang 15 menit sebelum acara"}
              />
            </div>

            <div className="flex items-center gap-2 rounded-md border border-border p-3">
              <input
                id="messageEnabled"
                type="checkbox"
                checked={formValues.messageEnabled}
                onChange={(e) =>
                  setFormValues((v) => ({ ...v, messageEnabled: e.target.checked }))
                }
                className="h-4 w-4 accent-primary"
              />
              <Label htmlFor="messageEnabled" className="flex-1">
                Aktifkan field pesan/motivasi opsional
              </Label>
            </div>

            {formValues.messageEnabled && (
              <div className="grid gap-1.5">
                <Label htmlFor="messageLabel">Label Field Pesan</Label>
                <Input
                  id="messageLabel"
                  value={formValues.messageLabel}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, messageLabel: e.target.value }))
                  }
                  placeholder="Tulis pesan, motivasi, atau informasi tambahan..."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
