import { Navbar } from "@/components/public/NavbarEvent";
import { Footer } from "@/components/public/Footer";
import { EventsSection } from "@/components/public/EventsSection";
import { createClient } from "@/lib/supabase/server";
import { getPublishedEvents } from "@/lib/data/events";

export default async function EventPage() {
    const supabase = await createClient();
    const events = await getPublishedEvents(supabase);

    return (
        <div className="flex flex-1 flex-col">
            <Navbar />
            <main className="flex-1">
                <EventsSection events={events} />
            </main>
            <Footer />
        </div>
    );
}
