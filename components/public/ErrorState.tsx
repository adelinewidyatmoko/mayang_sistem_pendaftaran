import { ReactNode } from "react";
import { AlertIcon, RefreshIcon } from "./icons";

export function ErrorState({
  title = "Terjadi Kesalahan",
  message = "Terjadi kesalahan. Silakan coba lagi.",
  onRetry,
  retryLabel = "Coba Lagi",
  homeHref,
  homeLabel = "Kembali ke Beranda",
  icon,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  homeHref?: string;
  homeLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col items-center overflow-hidden px-4 py-20 text-center sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-teal/10 blur-3xl" />
      </div>

      <span className="relative inline-flex h-14 w-14 items-center justify-center bg-teal-deep text-white">
        {icon ?? <AlertIcon className="h-7 w-7" />}
      </span>
      <h2 className="relative mt-6 font-heading text-2xl font-semibold text-teal-deep">
        {title}
      </h2>
      <p className="relative mt-2 text-sm leading-relaxed text-foreground/60">{message}</p>

      {(onRetry || homeHref) && (
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 bg-teal px-6 py-3 text-sm font-semibold text-white shadow-md shadow-teal/25 transition-colors hover:bg-teal-dark"
            >
              <RefreshIcon className="h-4 w-4" />
              {retryLabel}
            </button>
          )}
          {homeHref && (
            <a
              href={homeHref}
              className="text-sm font-semibold text-teal-deep underline decoration-gold/60 decoration-2 underline-offset-4 transition-colors hover:text-teal hover:decoration-gold"
            >
              {homeLabel}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
