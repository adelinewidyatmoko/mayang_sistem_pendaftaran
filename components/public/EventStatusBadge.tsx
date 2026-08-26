import { eventStatusConfig } from "@/lib/event-status";
import { EventStatus } from "@/lib/types";

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const config = eventStatusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
