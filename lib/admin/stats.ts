import { EventItem } from "@/lib/types";
import { deriveEventStatus, isUnlimitedCapacity } from "@/lib/event-status";
import { Registration } from "@/lib/data/registrations";

export function getDashboardStats(events: EventItem[], registrations: Registration[]) {
  const publishedEvents = events.filter((event) => event.published);
  const activeEvents = publishedEvents.filter((event) => deriveEventStatus(event) === "open");
  const totalRegistrations = registrations.length;

  const averagePerEvent =
    publishedEvents.length === 0 ? 0 : totalRegistrations / publishedEvents.length;

  return {
    totalEvents: events.length,
    activeEventsCount: activeEvents.length,
    activeEvents,
    totalRegistrations,
    averagePerEvent: Math.round(averagePerEvent * 10) / 10,
  };
}

export function getEventSummary(events: EventItem[], registrations: Registration[]) {
  return events.map((event) => {
    const registeredCount = registrations.filter((r) => r.eventId === event.id).length;
    return {
      event,
      registeredCount,
      remaining: isUnlimitedCapacity(event.maxParticipants)
        ? null
        : Math.max(event.maxParticipants - registeredCount, 0),
    };
  });
}
