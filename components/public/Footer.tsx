import Link from "next/link";

export function Footer() {
  return (
    <footer id="about" className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="font-heading text-xl font-semibold text-teal-deep">
            Mayang Collection<span className="text-gold">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-foreground/60">
            Brand hijab modern yang menghadirkan workshop, kelas styling, dan
            event komunitas untuk pelanggan setia kami.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-teal-deep">Navigasi</p>
          <ul className="mt-3 space-y-2 text-sm text-foreground/60">
            <li>
              <Link href="/" className="hover:text-teal-deep">Beranda</Link>
            </li>
            <li>
              <a href="#events" className="hover:text-teal-deep">Event</a>
            </li>
            <li>
              <a href="#about" className="hover:text-teal-deep">Tentang</a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-teal-deep">Kontak</p>
          <ul className="mt-3 space-y-2 text-sm text-foreground/60">
            <li>info@mayangmodestwear.com</li>
            <li>+62 821-3903-0930</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-6 text-center text-xs text-foreground/50">
        © {new Date().getFullYear()} Mayang Collection. Semua hak cipta dilindungi.
      </div>
    </footer>
  );
}
