export function CTASection() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-deep to-teal px-8 py-14 text-center sm:px-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-gold/20 blur-2xl" />

        <h2 className="relative font-heading text-3xl font-semibold text-white sm:text-4xl">
          Jangan Lewatkan Event Berikutnya
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-white/80">
          Daftar langsung tanpa perlu bikin akun — cukup pilih event, isi
          formulir singkat, dan kamu terdaftar.
        </p>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#events"
            className="bg-white px-7 py-3.5 text-sm font-semibold text-teal-deep transition-colors hover:bg-gold-light"
          >
            Lihat Semua Event
          </a>

        </div>
      </div>
    </section>
  );
}
