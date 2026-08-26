"use client";

// The nuclear fallback — only triggers if the root layout itself throws
// (extremely rare). It replaces the entire <html>, so it can't rely on
// globals.css or next/font having loaded; every style here is inline on
// purpose, so this page can never itself fail to render because of the
// same problem that triggered it.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body style={{ margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2rem",
            background: "#fbfaf8",
            color: "#142021",
            fontFamily:
              "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              height: 56,
              width: 56,
              alignItems: "center",
              justifyContent: "center",
              background: "#0a464a",
              color: "#fff",
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
            Terjadi Kesalahan Sistem
          </h1>
          <p style={{ marginTop: 8, color: "rgba(20,32,33,0.6)", maxWidth: 380, lineHeight: 1.6 }}>
            Aplikasi mengalami masalah tak terduga. Silakan muat ulang halaman ini.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 32,
              background: "#1baeb9",
              color: "#fff",
              border: "none",
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}
