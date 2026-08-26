import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminThemeEffect } from "@/components/admin/AdminThemeEffect";
import { AdminEventsProvider } from "@/lib/admin/events-store";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminThemeEffect />
      <AdminEventsProvider>
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </AdminEventsProvider>
    </div>
  );
}
