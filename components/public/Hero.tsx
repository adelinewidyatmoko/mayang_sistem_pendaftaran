import Image from "next/image";

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HangtagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M11.2 2.8 21 12.6a1.6 1.6 0 0 1 0 2.26l-6.14 6.14a1.6 1.6 0 0 1-2.26 0L2.8 11.2V3.8A1 1 0 0 1 3.8 2.8h7.4Z"
        fill="currentColor"
      />
      <circle cx="7.2" cy="7.2" r="1.4" fill="white" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute top-40 -left-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-16 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:py-24 lg:px-8">
        {/* ---------- Left: copy ---------- */}
        <div>
          <span className="inline-flex items-center gap-2.5 border border-teal/20 bg-teal/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-teal-dark">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping bg-teal opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 bg-teal" />
            </span>
            Mayang Collection Events
          </span>

          <h1 className="mt-6 font-heading text-5xl font-semibold uppercase leading-[0.95] tracking-tight text-teal-deep sm:text-6xl">
            Body Type
            <br />
            <span className="italic text-gold">Analysis.</span>
          </h1>

          <p className="mt-5 font-heading text-lg italic text-teal-dark sm:text-xl">
            Find the Fit That Feels Like You
          </p>

          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-foreground/60">
            Dari konsultasi bentuk tubuh sampai gathering komunitas — setiap
            event Mayang Collection dirancang supaya kamu tampil percaya diri
            dengan caramu sendiri.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <a
              href="#events"
              className="group inline-flex items-center gap-2.5 bg-teal px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-teal/25 transition-colors hover:bg-teal-dark"
            >
              Ikuti Event Sekarang
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="/event"
              className="text-sm font-semibold text-teal-deep underline decoration-gold/60 decoration-2 underline-offset-4 transition-colors hover:text-teal hover:decoration-gold"
            >
              Lihat semua event
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-5 text-xs uppercase tracking-wide text-foreground/50">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-teal" /> 4+ event bulan ini
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-gold" /> Gratis, tanpa akun
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-teal" /> Surabaya &amp; sekitarnya
            </span>
          </div>
        </div>

        {/* ---------- Right: photo collage ---------- */}
        <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-4 sm:max-w-md lg:relative lg:mx-0 lg:block lg:h-[520px] lg:max-w-none">
          {/* decorative ring */}
          <svg
            viewBox="0 0 100 100"
            className="pointer-events-none absolute -top-10 right-6 hidden h-28 w-28 animate-[spin_50s_linear_infinite] text-gold/40 lg:block"
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6" />
          </svg>

          {/* decorative dot cluster */}
          <div className="pointer-events-none absolute -left-3 bottom-16 hidden flex-col gap-2 lg:flex">
            <span className="h-2 w-2 rounded-full bg-teal/50" />
            <span className="ml-3 h-2.5 w-2.5 rounded-full bg-gold/50" />
            <span className="h-1.5 w-1.5 rounded-full bg-teal/40" />
          </div>

          {/* Card A — group in front of the Mayang store */}
          <figure className="relative z-10 col-span-2 border-4 border-white bg-white shadow-[0_20px_45px_-18px_rgba(10,70,74,0.4)] lg:absolute lg:left-0 lg:top-0 lg:col-span-1 lg:w-[58%] lg:-rotate-3">
            <span className="absolute -top-3 left-4 z-10 -rotate-2 bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Gathering Komunitas
            </span>
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src="/assets/mayang_pict2.jpg"
                alt="Komunitas Mayang Collection berkumpul di depan butik"
                fill
                sizes="(min-width: 1024px) 360px, 45vw"
                className="object-cover"
                style={{ objectPosition: "50% 42%" }}
                priority
              />
            </div>
          </figure>

          {/* Card B — women holding Mayang bags */}
          <figure className="relative z-20 border-4 border-white bg-white shadow-xl shadow-teal-deep/10 lg:absolute lg:right-0 lg:top-20 lg:w-[52%] lg:rotate-4">
            <span className="absolute -bottom-3 left-4 z-10 rotate-1 bg-teal px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Komunitas
            </span>
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src="/assets/mayang_pict1.jpg"
                alt="Peserta tersenyum memegang tas Mayang Collection"
                fill
                sizes="(min-width: 1024px) 330px, 45vw"
                className="object-cover"
                style={{ objectPosition: "50% 32%" }}
              />
            </div>
          </figure>

          {/* Card C — styling moment on the rack */}
          <figure className="relative z-30 border-4 border-white bg-white shadow-xl shadow-teal-deep/10 lg:absolute lg:bottom-0 lg:left-[8%] lg:w-[42%] lg:rotate-6">
            <HangtagIcon className="pointer-events-none absolute -bottom-3 -right-3 z-10 h-7 w-7 rotate-12 text-gold drop-shadow-sm" />
            <span className="absolute -top-3 left-3 z-10 -rotate-2 bg-teal-deep px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Konsultasi Gaya
            </span>
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <Image
                src="/assets/mayang_pict3.jpg"
                alt="Konsultan gaya membantu memilih busana di rak Mayang Collection"
                fill
                sizes="(min-width: 1024px) 260px, 45vw"
                className="object-cover"
                style={{ objectPosition: "50% 18%" }}
              />
            </div>
          </figure>

          {/* stitched connector, tucked in the open gap beside the dot cluster */}
          <div className="pointer-events-none absolute left-3 bottom-[30%] z-0 hidden h-12 w-8 -rotate-[70deg] border-t-2 border-dashed border-gold/60 lg:block" />
        </div>
      </div>
    </section>
  );
}
