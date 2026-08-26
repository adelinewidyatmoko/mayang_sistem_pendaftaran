import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { ErrorState } from "@/components/public/ErrorState";
import { PinIcon } from "@/components/public/icons";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center">
        <ErrorState
          title="Halaman Tidak Ditemukan"
          message="Halaman yang kamu cari sudah dipindahkan atau tidak pernah ada. Coba kembali ke beranda atau jelajahi event yang tersedia."
          icon={<PinIcon className="h-7 w-7" />}
          homeHref="/"
          homeLabel="Kembali ke Beranda"
        />
      </main>
      <Footer />
    </div>
  );
}
