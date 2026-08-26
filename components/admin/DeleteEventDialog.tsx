"use client";

import { EventItem } from "@/lib/types";
import { useAdminEvents } from "@/lib/admin/events-store";

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

export function DeleteEventDialog({
  event,
  onOpenChange,
}: {
  event: EventItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteEvent } = useAdminEvents();
  const hasRegistrations = (event?.registeredCount ?? 0) > 0;

  return (
    <AlertDialog open={event !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus event ini?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasRegistrations ? (
              <>
                <strong>{event?.title}</strong> sudah memiliki{" "}
                {event?.registeredCount} pendaftaran, jadi event ini akan{" "}
                <strong>diarsipkan</strong> (disembunyikan dari daftar publik)
                — bukan dihapus permanen, supaya data peserta yang sudah
                mendaftar tetap tersimpan.
              </>
            ) : (
              <>
                <strong>{event?.title}</strong> belum punya pendaftaran, jadi
                event ini akan <strong>dihapus permanen</strong> dari
                database. Tindakan ini tidak bisa dibatalkan.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              if (event) await deleteEvent(event.id);
              onOpenChange(false);
            }}
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
