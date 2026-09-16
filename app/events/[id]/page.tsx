import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { EventStatusBadge } from "@/components/public/EventStatusBadge";
import { RegistrationForm } from "@/components/public/RegistrationForm";
import { ArrowLeftIcon, CalendarIcon, ClockIcon, PinIcon, UsersIcon } from "@/components/public/icons";
import {
  deriveEventStatus,
  eventStatusConfig,
  formatEventDate,
  formatEventTime,
  isUnlimitedCapacity,
} from "@/lib/event-status";
import { eventCoverGradients } from "@/lib/event-visuals";
import { createClient } from "@/lib/supabase/server";
import { getEventById } from "@/lib/data/events";

function gradientForId(id: string) {
  const sum = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return eventCoverGradients[sum % eventCoverGradients.length];
}

export default async function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const event = await getEventById(supabase, id);

  if (!event || !event.published) {
    notFound();
  }

  const status = deriveEventStatus(event);
  const config = eventStatusConfig[status];
  const gradient = gradientForId(event.id);
  const unlimited = isUnlimitedCapacity(event.maxParticipants);
  const remainingSlots = unlimited
    ? null
    : Math.max(event.maxParticipants - event.registeredCount, 0);
  const quotaPercent = unlimited
    ? 0
    : Math.min(Math.round((event.registeredCount / event.maxParticipants) * 100), 100);

  return (
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/#events"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 transition-colors hover:text-teal-deep"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Semua Event
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Main content */}
            <div>
              <div
                className={`relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br sm:h-72 ${gradient}`}
              >
                {event.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data URI covers from the in-memory admin editor aren't optimizable by next/image
                  <img src={event.coverImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <CalendarIcon className="h-16 w-16 text-white/80" />
                )}
                <div className="absolute left-5 top-5">
                  <EventStatusBadge status={status} />
                </div>
              </div>

              <h1 className="mt-6 font-heading text-3xl font-semibold text-teal-deep sm:text-4xl">
                {event.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground/70">
                <span className="inline-flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-teal" />
                  {formatEventDate(event.eventStart, event.timezone)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-teal" />
                  {formatEventTime(event.eventStart, event.timezone)} –{" "}
                  {formatEventTime(event.eventEnd, event.timezone)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <PinIcon className="h-4 w-4 text-teal" />
                  {event.location}
                </span>
                <span className="inline-flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-teal" />
                  {unlimited
                    ? `${event.registeredCount} terdaftar`
                    : `${event.registeredCount} dari ${event.maxParticipants} terdaftar`}
                </span>
              </div>

              <div className="mt-8 border border-border bg-white p-6">
                <h2 className="font-heading text-lg font-semibold text-teal-deep">
                  Tentang Event
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/70">
                  {event.description}
                </p>
              </div>

              {event.requirements.length > 0 && (
                <div className="mt-6 border border-border bg-white p-6">
                  <h2 className="font-heading text-lg font-semibold text-teal-deep">
                    Persyaratan
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-foreground/70">
                    {event.requirements.map((requirement) => (
                      <li key={requirement} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal" />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside id="daftar" className="h-fit scroll-mt-24 lg:sticky lg:top-24">
              <div className="border border-border bg-white p-6 shadow-sm shadow-teal-deep/5">
                <div className="flex items-center justify-between">
                  <EventStatusBadge status={status} />
                  <span className="text-xs text-foreground/50">
                    Ditutup {formatEventDate(event.registrationDeadline, event.timezone)}
                  </span>
                </div>

                <div className="mt-4">
                  {unlimited ? (
                    <p className="text-sm text-foreground/50">
                      {event.registeredCount} terdaftar · kuota tidak terbatas
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground/50">
                          {event.registeredCount} dari {event.maxParticipants} kuota terisi
                        </span>
                        <span className="font-semibold text-gold">{quotaPercent}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden bg-muted">
                        <div
                          className="h-full bg-gold"
                          style={{ width: `${quotaPercent}%` }}
                        />
                      </div>
                      {!config.ctaDisabled && (
                        <p className="mt-1.5 text-xs text-foreground/50">
                          {remainingSlots} slot tersisa
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-6">
                  {config.ctaDisabled ? (
                    <div className="bg-muted px-4 py-3 text-center text-sm font-medium text-foreground/50">
                      {config.ctaLabel}
                    </div>
                  ) : (
                    <RegistrationForm event={event} />
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
