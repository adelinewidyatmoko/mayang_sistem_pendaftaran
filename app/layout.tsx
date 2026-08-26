import type { Metadata } from "next";
import { Albert_Sans, Bricolage_Grotesque } from "next/font/google";
import { OfflineBanner } from "@/components/public/OfflineBanner";
import "./globals.css";

// NOTE: brand typeface "Lunea Sans" is not available on Google Fonts / any
// free CDN we could verify. Bricolage Grotesque is used as a placeholder
// heading font with a similar premium/display character — swap this out
// via next/font/local once licensed Lunea Sans font files are available.
const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
});

const headingFont = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mayang Collection Events | Daftar Event Terbaru",
  description:
    "Temukan dan daftar workshop, kelas styling, dan event komunitas Mayang Collection.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${albertSans.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
