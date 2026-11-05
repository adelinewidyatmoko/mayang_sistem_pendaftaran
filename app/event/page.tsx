import { Navbar } from "@/components/public/NavbarEvent";
import { Footer } from "@/components/public/Footer";
import { EventsSection } from "@/components/public/EventsSection";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublishedEvents } from "@/lib/data/events";

// Supabase is queried at most once a minute, however many visitors come.
export const revalidate = 60;

export default async function EventPage() {
    const supabase = createPublicClient();
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
