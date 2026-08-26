"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Admin-scoped error boundary — covers /admin/login and everything under
// /admin/(dashboard). Deliberately doesn't reuse the public ErrorState
// (no marketing nav/footer here); styled with the same shadcn primitives
// as the rest of the admin area per PRD §29's "usability over decoration."
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <span className="mb-1 inline-flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <CardTitle className="font-heading text-xl font-semibold text-foreground">
            Terjadi Kesalahan
          </CardTitle>
          <CardDescription>
            Halaman admin ini gagal dimuat — biasanya karena koneksi atau server
            sedang bermasalah. Coba muat ulang.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset} className="w-full">
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
