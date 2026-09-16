export type EventStatus = "upcoming" | "open" | "full" | "closed" | "completed";

// Status is intentionally NOT a field here — PRD §15/§40 rule #13 requires
// it to be derived from dates/capacity, never stored or manually set. See
// deriveEventStatus() in lib/event-status.ts.
export type EventItem = {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  location: string;
  eventStart: string;
  eventEnd: string;
  registrationStart: string;
  registrationDeadline: string;
  // IANA zone the admin picked when setting the dates above (Asia/Jakarta,
  // Asia/Makassar, or Asia/Jayapura) — see lib/timezone.ts.
  timezone: string;
  maxParticipants: number;
  registeredCount: number;
  requirements: string[];
  messageEnabled: boolean;
  messageLabel: string;
  published: boolean;
};
