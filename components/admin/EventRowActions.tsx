"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { EventItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { DeleteEventDialog } from "@/components/admin/DeleteEventDialog";

export function EventRowActions({ event }: { event: EventItem }) {
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);

  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/admin/events/${event.id}/edit`}>
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit {event.title}</span>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(event)}>
        <Trash2 className="h-4 w-4 text-destructive" />
        <span className="sr-only">Hapus {event.title}</span>
      </Button>

      <DeleteEventDialog
        event={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  );
}
