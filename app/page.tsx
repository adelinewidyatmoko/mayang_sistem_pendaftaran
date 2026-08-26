import { Navbar } from "@/components/public/Navbar";
import { Hero } from "@/components/public/Hero";
import { EventsSection } from "@/components/public/EventsSection";
import { CTASection } from "@/components/public/CTASection";
import { Footer } from "@/components/public/Footer";
import { createClient } from "@/lib/supabase/server";
import { getPublishedEvents } from "@/lib/data/events";

export default async function Home() {
  const supabase = await createClient();
  const events = await getPublishedEvents(supabase);

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <EventsSection events={events} variant="preview" />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
