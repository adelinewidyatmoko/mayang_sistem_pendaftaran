import Link from "next/link";
import { EventItem } from "@/lib/types";
import {
  deriveEventStatus,
  eventStatusConfig,
  formatEventDate,
  formatEventTime,
} from "@/lib/event-status";
import { truncate } from "@/lib/utils";
import { EventStatusBadge } from "./EventStatusBadge";
import { CalendarIcon, PinIcon } from "./icons";
import { eventCoverGradients } from "@/lib/event-visuals";

export function EventCard({ event, index = 0 }: { event: EventItem; index?: number }) {
  const status = deriveEventStatus(event);
  const config = eventStatusConfig[status];
  const gradient = eventCoverGradients[index % eventCoverGradients.length];

  return (
    <article className="group flex flex-col overflow-hidden border border-border bg-white transition-shadow hover:shadow-lg hover:shadow-teal-deep/5">
      <div
        className={`relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br ${gradient}`}
      >
        {event.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URI covers from the in-memory admin editor aren't optimizable by next/image
          <img src={event.coverImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <CalendarIcon className="h-10 w-10 text-white/80" />
        )}
        <div className="absolute left-4 top-4">
          <EventStatusBadge status={status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-semibold text-teal-deep">
          {event.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-foreground/60">
          {truncate(event.description, 110)}
        </p>

        <div className="mt-4 space-y-1.5 text-sm text-foreground/70">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-teal" />
            <span>
              {formatEventDate(event.eventStart, event.timezone)} ·{" "}
              {formatEventTime(event.eventStart, event.timezone)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <PinIcon className="h-4 w-4 text-teal" />
            <span>{event.location}</span>
          </div>
        </div>

        <div className="mt-5 flex-1" />

        {config.ctaDisabled ? (
          <span className="mt-2 inline-flex w-full items-center justify-center bg-muted px-4 py-2.5 text-sm font-semibold text-foreground/40">
            {config.ctaLabel}
          </span>
        ) : (
          <Link
            href={`/events/${event.id}`}
            className="mt-2 inline-flex w-full items-center justify-center bg-teal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
          >
            {config.ctaLabel}
          </Link>
        )}
      </div>
    </article>
  );
}
