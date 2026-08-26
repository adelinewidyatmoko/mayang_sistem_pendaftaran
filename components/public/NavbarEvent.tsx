import Image from "next/image";
import Link from "next/link";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
            <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/logo.webp"
                        alt="Mayang Collection"
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 rounded-md"
                        priority
                    />
                    <span className="flex flex-col leading-tight">
                        <span className="font-heading text-xl font-semibold text-teal-deep">
                            Body Type Analysis
                        </span>
                        <span className="text-sm text-gold">by Mayang</span>
                    </span>
                </Link>


            </div>
        </header>
    );
}
