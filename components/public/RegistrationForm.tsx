"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EventItem } from "@/lib/types";
import { isUnlimitedCapacity, MAX_TICKETS_PER_REGISTRATION } from "@/lib/event-status";
import { AlertIcon, CheckIcon } from "./icons";
import { FormField, formInputClassName } from "./FormField";

// Wire-format error codes returned by app/api/events/[id]/register — keep in
// sync with that route. Anything not listed here falls back to a generic
// message rather than leaking a raw code to the user.
const ERROR_MESSAGES: Record<string, string> = {
  duplicate: "Email ini sudah terdaftar pada event ini.",
  capacity: "Sisa kuota tidak cukup untuk jumlah yang dipesan.",
  closed: "Pendaftaran untuk event ini sudah tidak tersedia.",
  invalid: "Data pendaftaran tidak lengkap atau tidak valid.",
};

type FormValues = {
  name: string;
  phone: string;
  email: string;
  origin: string;
  dateOfBirth: string;
  message: string;
};

type Registered = { registrationNumber: string; name: string; companions: string[] };

const emptyValues: FormValues = {
  name: "",
  phone: "",
  email: "",
  origin: "",
  dateOfBirth: "",
  message: "",
};

function validate(values: FormValues) {
  const errors: Partial<Record<keyof FormValues, string>> = {};

  if (values.name.trim().length < 3) {
    errors.name = "Nama lengkap wajib diisi (minimal 3 karakter).";
  }
  if (!/^(\+62|0)8[0-9]{7,12}$/.test(values.phone.trim())) {
    errors.phone = "Masukkan nomor telepon Indonesia yang valid.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Masukkan alamat email yang valid.";
  }
  if (!values.origin.trim()) {
    errors.origin = "Asal / domisili wajib diisi.";
  }
  if (!values.dateOfBirth) {
    errors.dateOfBirth = "Tanggal lahir wajib diisi.";
  } else if (new Date(values.dateOfBirth) > new Date()) {
    errors.dateOfBirth = "Tanggal lahir tidak boleh di masa depan.";
  }

  return errors;
}

// Per-device "already registered" memory so the same browser doesn't need
// to hit the server again to see it's already registered for this event —
// the email unique constraint in the database remains the real,
// server-side source of truth; this is just a local UX shortcut.
function storageKey(eventId: string) {
  return `mc-registration:${eventId}`;
}

function readStoredRegistration(eventId: string): Registered | null {
  try {
    const raw = window.localStorage.getItem(storageKey(eventId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.registrationNumber === "string" && typeof parsed?.name === "string") {
      // Data lama (sebelum ada kuota) tidak punya `companions`.
      const companions = Array.isArray(parsed.companions)
        ? parsed.companions.filter((c: unknown): c is string => typeof c === "string")
        : [];
      return { registrationNumber: parsed.registrationNumber, name: parsed.name, companions };
    }
    return null;
  } catch {
    return null;
  }
}

function storeRegistration(eventId: string, registered: Registered) {
  try {
    window.localStorage.setItem(storageKey(eventId), JSON.stringify(registered));
  } catch {
    // Private browsing / storage disabled — safe to ignore, it's just a
    // convenience shortcut, not the source of truth.
  }
}

export function RegistrationForm({ event }: { event: EventItem }) {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  // Nama orang yang ikut — panjangnya selalu (jumlah kuota - 1).
  const [companions, setCompanions] = useState<string[]>([]);
  const [companionErrors, setCompanionErrors] = useState<(string | null)[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registered, setRegistered] = useState<Registered | null>(null);
  const [website, setWebsite] = useState(""); // honeypot — see the field below
  const formRenderedAt = useRef<number | null>(null);
  const router = useRouter();

  // Pilihan jumlah kuota dibatasi sisa slot saat halaman dimuat. Bisa sudah
  // basi — cek final tetap di server.
  const remaining = isUnlimitedCapacity(event.maxParticipants)
    ? MAX_TICKETS_PER_REGISTRATION
    : Math.max(event.maxParticipants - event.registeredCount, 0);
  const maxTickets = Math.max(1, Math.min(MAX_TICKETS_PER_REGISTRATION, remaining));
  const ticketCount = companions.length + 1;

  useEffect(() => {
    // localStorage isn't available during server render, so this can only
    // be read post-mount — an explicitly sanctioned effect use case (syncing
    // from a browser-only API), not a derived-state anti-pattern.
    const stored = readStoredRegistration(event.id);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegistered(stored);
    }
  }, [event.id]);

  useEffect(() => {
    // Date.now() is impure, so it can't be called during render — stamp it
    // once the form has actually mounted instead (see MIN_SUBMIT_MS check
    // server-side in app/api/events/[id]/register/route.ts).
    formRenderedAt.current = Date.now();
  }, []);

  function handleChange<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // Ubah jumlah kuota: nama yang sudah diketik tetap disimpan.
  function handleTicketCountChange(count: number) {
    setCompanions((prev) => Array.from({ length: count - 1 }, (_, i) => prev[i] ?? ""));
    setCompanionErrors([]);
  }

  function handleCompanionChange(index: number, value: string) {
    setCompanions((prev) => prev.map((c, i) => (i === index ? value : c)));
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    const validationErrors = validate(values);
    const nameErrors = companions.map((c) =>
      c.trim().length < 2 ? "Nama wajib diisi (minimal 2 karakter)." : null
    );
    setErrors(validationErrors);
    setCompanionErrors(nameErrors);
    if (Object.keys(validationErrors).length > 0 || nameErrors.some(Boolean)) return;

    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          origin: values.origin.trim(),
          dateOfBirth: values.dateOfBirth,
          message: values.message.trim() || null,
          companions: companions.map((c) => c.trim()),
          website,
          formRenderedAt: formRenderedAt.current ?? Date.now(),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (result.error === "capacity" && typeof result.remaining === "number") {
          setSubmitError(
            result.remaining > 0
              ? `Sisa kuota hanya ${result.remaining}. Kurangi jumlah kuota yang dipesan.`
              : "Kuota event ini sudah penuh."
          );
        } else if (result.error === "invalid" && typeof result.message === "string") {
          setSubmitError(result.message);
        } else {
          setSubmitError(ERROR_MESSAGES[result.error] ?? "Terjadi kesalahan. Silakan coba lagi.");
        }
        return;
      }

      const done: Registered = {
        registrationNumber: result.registrationNumber,
        name: values.name.trim(),
        companions: companions.map((c) => c.trim()),
      };
      setRegistered(done);
      storeRegistration(event.id, done);
      // Ambil ulang data halaman (server) biar bar "x dari y kuota" langsung
      // ikut berubah tanpa reload.
      router.refresh();
    } catch {
      setSubmitError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (registered) {
    const total = registered.companions.length + 1;
    return (
      <div className="border border-teal/20 bg-teal/5 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center bg-teal text-white">
          <CheckIcon className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-heading text-xl font-semibold text-teal-deep">
          Pendaftaran Berhasil!
        </h3>
        <p className="mt-2 text-sm text-foreground/60">
          Terima kasih, {registered.name}.{" "}
          {total > 1 ? `${total} orang terdaftar untuk:` : "Kamu terdaftar untuk:"}
        </p>
        <p className="mt-1 text-sm font-semibold text-teal-deep">{event.title}</p>

        <div className="mt-4 bg-white px-4 py-3">
          <p className="text-xs text-foreground/50">Nomor Registrasi</p>
          <p className="font-heading text-lg font-semibold tracking-wide text-teal-deep">
            {registered.registrationNumber}
          </p>
        </div>

        {total > 1 && (
          <div className="mt-3 bg-white px-4 py-3 text-left">
            <p className="text-xs text-foreground/50">Peserta ({total} kuota)</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-foreground/80">
              <li>{registered.name}</li>
              {registered.companions.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Honeypot — hidden off-screen (not display:none, which some bots
          specifically check for and skip) rather than a "hidden" input
          type, which spam bots also know to leave alone. A real visitor
          never sees or fills this in; anything in it means a script filled
          every field it found in the DOM. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <FormField label="Nama Lengkap" htmlFor="name" required error={errors.name}>
        <input
          id="name"
          type="text"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Nama sesuai KTP"
          className={formInputClassName}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nomor Telepon" htmlFor="phone" required error={errors.phone}>
          <input
            id="phone"
            type="tel"
            value={values.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="08xxxxxxxxxx"
            className={formInputClassName}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" required error={errors.email}>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="nama@email.com"
            className={formInputClassName}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Asal / Domisili" htmlFor="origin" required error={errors.origin}>
          <input
            id="origin"
            type="text"
            value={values.origin}
            onChange={(e) => handleChange("origin", e.target.value)}
            placeholder="Kota domisili"
            className={formInputClassName}
          />
        </FormField>

        <FormField label="Tanggal Lahir" htmlFor="dateOfBirth" required error={errors.dateOfBirth}>
          <input
            id="dateOfBirth"
            type="date"
            value={values.dateOfBirth}
            onChange={(e) => handleChange("dateOfBirth", e.target.value)}
            className={formInputClassName}
          />
        </FormField>
      </div>

      {maxTickets > 1 && (
        <FormField
          label="Jumlah Kuota"
          htmlFor="ticketCount"
          required
          hint={`Termasuk kamu. Maksimal ${maxTickets} orang per pendaftaran.`}
        >
          <select
            id="ticketCount"
            value={ticketCount}
            onChange={(e) => handleTicketCountChange(Number(e.target.value))}
            className={formInputClassName}
          >
            {Array.from({ length: maxTickets }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} orang
              </option>
            ))}
          </select>
        </FormField>
      )}

      {companions.map((companion, i) => (
        <FormField
          key={i}
          label={`Nama Peserta ${i + 2}`}
          htmlFor={`companion-${i}`}
          required
          error={companionErrors[i] ?? undefined}
        >
          <input
            id={`companion-${i}`}
            type="text"
            value={companion}
            onChange={(e) => handleCompanionChange(i, e.target.value)}
            placeholder="Nama lengkap"
            className={formInputClassName}
          />
        </FormField>
      ))}

      {event.messageEnabled && (
        <FormField label={event.messageLabel || "Pesan"} htmlFor="message" hint="Opsional">
          <textarea
            id="message"
            rows={3}
            value={values.message}
            onChange={(e) => handleChange("message", e.target.value)}
            placeholder="Tulis pesan atau motivasi kamu di sini..."
            className={`${formInputClassName} resize-none`}
          />
        </FormField>
      )}

      {submitError && (
        <div className="flex items-start gap-2.5 border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-medium">{submitError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex w-full items-center justify-center bg-teal px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? "Memproses..."
          : ticketCount > 1
            ? `Daftar ${ticketCount} Orang`
            : "Kirim Pendaftaran"}
      </button>
    </form>
  );
}
