"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={1.75}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="1.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("Email atau password salah.");
      setSubmitting(false);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ---------- Left: brand panel ---------- */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-teal-deep via-teal-dark to-teal p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
          <svg
            viewBox="0 0 100 100"
            className="absolute -bottom-8 -left-8 h-40 w-40 animate-[spin_60s_linear_infinite] text-white/15"
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6" />
          </svg>
        </div>

        <Link href="/" className="relative flex items-center gap-3">
          <Image
            src="/logo.webp"
            alt="Mayang Collection"
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 border border-white/20"
          />
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-lg font-semibold">Body Type Analysis</span>
            <span className="text-sm text-gold-light">by Mayang Collection</span>
          </span>
        </Link>

        <div className="relative">
          <figure className="w-[78%] -rotate-2 border-4 border-white bg-white shadow-[0_25px_50px_-15px_rgba(0,0,0,0.5)]">
            <span className="absolute -top-3 left-4 z-10 -rotate-2 bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Mayang Collection
            </span>
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src="/assets/mayang_pict2.jpg"
                alt="Komunitas Mayang Collection berkumpul di depan butik"
                fill
                sizes="480px"
                className="object-cover"
                style={{ objectPosition: "50% 42%" }}
              />
            </div>
          </figure>

          <h2 className="relative mt-10 max-w-sm font-heading text-3xl font-semibold leading-tight">
            Satu dashboard untuk seluruh{" "}
            <span className="italic text-gold-light">cerita komunitas.</span>
          </h2>
          <p className="relative mt-3 max-w-sm text-sm text-white/70">
            Kelola event, pantau pendaftaran, dan lihat performa komunitas
            Mayang Collection dalam satu tempat.
          </p>
        </div>
      </div>

      {/* ---------- Right: login form ---------- */}
      <div className="flex items-center justify-center bg-background px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image
              src="/logo.webp"
              alt="Mayang Collection"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0"
            />
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-lg font-semibold text-teal-deep">
                Body Type Analysis
              </span>
              <span className="text-sm text-gold">by Mayang Collection</span>
            </span>
          </div>

          <div className="border border-border bg-white p-8 shadow-[0_30px_60px_-25px_rgba(10,70,74,0.45)]">
            <span className="inline-flex h-10 w-10 items-center justify-center bg-teal-deep text-white">
              <LockIcon className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-heading text-2xl font-semibold text-teal-deep">
              Login Admin
            </h1>
            <p className="mt-1 text-sm text-foreground/60">
              Masuk untuk mengelola event dan pendaftaran Mayang Collection.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus-visible:ring-teal"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus-visible:ring-teal"
                  required
                />
              </div>

              {error && (
                <p className="border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-deep text-white shadow-lg shadow-teal-deep/30 hover:bg-teal-dark"
              >
                {submitting ? "Masuk..." : "Login"}
              </Button>
            </form>
          </div>

          <Link
            href="/"
            className="mt-6 block text-center text-sm text-foreground/50 underline decoration-gold/60 decoration-2 underline-offset-4 transition-colors hover:text-teal-deep hover:decoration-gold"
          >
            ← Kembali ke halaman utama
          </Link>
        </div>
      </div>
    </div>
  );
}
