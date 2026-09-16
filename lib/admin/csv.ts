import { EventItem } from "@/lib/types";
import { Registration } from "@/lib/data/registrations";
import { deriveEventStatus, formatEventDate } from "@/lib/event-status";

const CSV_COLUMNS = [
  "Registration ID",
  "Nama",
  "Email",
  "Telepon",
  "Asal",
  "Tanggal Lahir",
  "Event",
  "Tanggal Event",
  "Lokasi Event",
  "Tanggal Pendaftaran",
  "Status Pendaftaran",
  "Pesan",
];

// Guest-submitted fields (name/email/origin/message) are untrusted input.
// A value starting with =, +, -, or @ is interpreted as a formula by
// Excel/Sheets when the CSV is opened — without this, a guest could submit
// a name like "=HYPERLINK(...)" that executes when an admin opens the
// export (CSV/formula injection, CWE-1236).
function neutralizeFormula(value: string) {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function escapeCsvField(value: string) {
  const safe = neutralizeFormula(value);
  if (/[",\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

// Wrapping in ="..." forces Excel/Sheets to keep this as text, preserving a
// leading "0" on Indonesian phone numbers instead of parsing it as a number.
function asExcelText(value: string) {
  return `="${value.replace(/"/g, '""')}"`;
}

export function buildRegistrationsCsv(
  registrations: Registration[],
  events: EventItem[]
) {
  const eventById = new Map(events.map((event) => [event.id, event]));

  const rows = registrations.map((registration) => {
    const event = eventById.get(registration.eventId);
    const status = event && deriveEventStatus(event) === "completed" ? "Event Selesai" : "Terdaftar";

    return [
      registration.registrationNumber,
      registration.name,
      registration.email,
      asExcelText(registration.phone),
      registration.origin,
      registration.dateOfBirth,
      event?.title ?? registration.eventId,
      event ? formatEventDate(event.eventStart, event.timezone) : "",
      event?.location ?? "",
      formatEventDate(registration.createdAt, event?.timezone),
      status,
      registration.message ?? "",
    ].map((field) => escapeCsvField(String(field)));
  });

  return [CSV_COLUMNS, ...rows].map((row) => row.join(",")).join("\r\n");
}

export function downloadRegistrationsCsv(
  registrations: Registration[],
  events: EventItem[],
  filename = "pendaftar.csv"
) {
  const csv = buildRegistrationsCsv(registrations, events);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
