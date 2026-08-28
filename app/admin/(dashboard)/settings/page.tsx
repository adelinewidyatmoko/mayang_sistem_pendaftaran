"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [email, setEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (cancelled) return;
        const userEmail = data.user?.email ?? "";
        setCurrentEmail(userEmail);
        setEmail(userEmail);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    if (!email.trim() || email.trim() === currentEmail) return;

    setEmailSubmitting(true);
    const { error } = await createClient().auth.updateUser({ email: email.trim() });
    setEmailSubmitting(false);

    if (error) {
      setEmailError(error.message);
      return;
    }

    // Supabase sends a confirmation link to the new address before the
    // change actually takes effect — the email on the account doesn't
    // change yet, so don't claim it already has.
    setEmailSuccess(
      `Link konfirmasi telah dikirim ke ${email.trim()}. Buka email tersebut dan klik link untuk menyelesaikan perubahan.`
    );
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("Password minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok.");
      return;
    }

    setPasswordSubmitting(true);
    const { error } = await createClient().auth.updateUser({ password: newPassword });
    setPasswordSubmitting(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setPasswordSuccess("Password berhasil diperbarui.");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <form onSubmit={handleEmailSubmit}>
          <CardHeader>
            <CardTitle className="font-heading text-base font-semibold text-foreground">
              Email Admin
            </CardTitle>
            <CardDescription>
              Mengubah email memerlukan konfirmasi lewat link yang dikirim ke alamat baru.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {emailError && (
              <div className="flex items-start gap-2.5 border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="font-medium">{emailError}</p>
              </div>
            )}
            {emailSuccess && (
              <div className="flex items-start gap-2.5 border border-teal/20 bg-teal/5 px-3.5 py-3 text-sm text-teal-deep">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="font-medium">{emailSuccess}</p>
              </div>
            )}

            <Button type="submit" disabled={emailSubmitting || email.trim() === currentEmail}>
              {emailSubmitting ? "Mengirim..." : "Simpan Perubahan"}
            </Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <form onSubmit={handlePasswordSubmit}>
          <CardHeader>
            <CardTitle className="font-heading text-base font-semibold text-foreground">
              Ubah Password
            </CardTitle>
            <CardDescription>Berlaku langsung setelah disimpan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm-password">Konfirmasi Password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {passwordError && (
              <div className="flex items-start gap-2.5 border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="font-medium">{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-start gap-2.5 border border-teal/20 bg-teal/5 px-3.5 py-3 text-sm text-teal-deep">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="font-medium">{passwordSuccess}</p>
              </div>
            )}

            <Button type="submit" disabled={passwordSubmitting}>
              {passwordSubmitting ? "Menyimpan..." : "Simpan Password"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
