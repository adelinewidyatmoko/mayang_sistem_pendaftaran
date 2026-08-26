import { EventItem, EventStatus } from "./types";

// A capacity of 0 means "unlimited" rather than "no seats" — an event isn't
// meant to be permanently unregisterable just because an admin left the
// field at its default.
export function isUnlimitedCapacity(maxParticipants: number) {
  return maxParticipants <= 0;
}

// PRD §15: status is always derived from dates/capacity — never stored or
// manually set by an admin.
export function deriveEventStatus(event: EventItem, now: Date = new Date()): EventStatus {
  const eventEnd = new Date(event.eventEnd);
  const registrationStart = new Date(event.registrationStart);
  const registrationDeadline = new Date(event.registrationDeadline);

  if (now >= eventEnd) return "completed";
  if (now < registrationStart) return "upcoming";
  if (!isUnlimitedCapacity(event.maxParticipants) && event.registeredCount >= event.maxParticipants) {
    return "full";
  }
  if (now <= registrationDeadline) return "open";
  return "closed";
}

export const eventStatusConfig: Record<
  EventStatus,
  { label: string; ctaLabel: string; ctaDisabled: boolean; className: string }
> = {
  upcoming: {
    label: "Akan Datang",
    ctaLabel: "Pendaftaran Belum Dibuka",
    ctaDisabled: true,
    className: "bg-gold-light text-teal-deep",
  },
  open: {
    label: "Pendaftaran Dibuka",
    ctaLabel: "Daftar Sekarang",
    ctaDisabled: false,
    className: "bg-teal text-white",
  },
  full: {
    label: "Kuota Penuh",
    ctaLabel: "Kuota Penuh",
    ctaDisabled: true,
    className: "bg-gold text-white",
  },
  closed: {
    label: "Pendaftaran Ditutup",
    ctaLabel: "Pendaftaran Ditutup",
    ctaDisabled: true,
    className: "bg-muted text-foreground/60",
  },
  completed: {
    label: "Event Selesai",
    ctaLabel: "Event Telah Selesai",
    ctaDisabled: true,
    className: "bg-muted text-foreground/50",
  },
};

export function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatEventTime(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso)) + " WIB";
}
