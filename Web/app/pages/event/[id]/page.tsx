// app/event/[id]/page.tsx
import { getEventWithSubevents, getPersonsForEvent } from "@/lib/data"; // Pfad ggf. anpassen
import pb from "@/lib/pocketbase";

type EventPageProps = {
  params: Promise<{ id: string }>;
  // falls du searchParams verwendest:
  // searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;

  const { event, subevents } = await getEventWithSubevents(id);
  const { persons } = await getPersonsForEvent(id);

  const eventImageUrl = `${pb.baseURL}/api/files/events/${event.id}/${event.bild}`;

  function formatYear(year?: string | number) {
    if (
      year === undefined ||
      year === null ||
      year === "" ||
      year === 0 ||
      year === "0"
    ) {
      return "";
    }

    const num = typeof year === "string" ? Number(year) : year;
    if (!Number.isFinite(num) || num === 0) return "";

    const abs = Math.abs(num);

    if (abs >= 1_000_000_000) {
      return `${(abs / 1_000_000_000).toFixed(1)} Mrd. ${num < 0 ? "v. Chr." : "n. Chr."}`;
    }

    if (abs >= 1_000_000) {
      return `${(abs / 1_000_000).toFixed(1)} Mio. ${num < 0 ? "v. Chr." : "n. Chr."}`;
    }

    // 👉 Tausenderpunkte NUR ab 5-stellig
    const yearString =
      abs >= 10_000 ? abs.toLocaleString("de-DE") : abs.toString();

    return num < 0 ? `${yearString} v. Chr.` : `${yearString} n. Chr.`;
  }

  if (!event) {
    return <div className="p-8">event nicht gefunden.</div>;
  }

  return (
    <main className="min-h-screen items-center justify-center bg-blue-100 px-4 py-16 dark:bg-gray-900">
      <section className="bg-blue-100 dark:bg-gray-900">
        <div className="mx-auto grid max-w-screen-xl px-4 py-8 lg:grid-cols-12 lg:gap-8 lg:py-16 xl:gap-0">
          <div className="mr-auto place-self-center lg:col-span-7">
            <h1 className="mb-4 max-w-2xl text-4xl leading-none font-extrabold tracking-tight md:text-5xl xl:text-6xl dark:text-white">
              {event.title}
            </h1>

            {/* ⭐ Neue Zeile: Lebensdaten */}
            {(event.start_year || event.end_year) && (
              <p className="mb-2 max-w-2xl font-medium text-gray-700 dark:text-gray-300">
                {formatYear(event.start_year)}
                {(() => {
                  const end = formatYear(event.end_year);
                  return end ? ` – ${end}` : "";
                })()}
              </p>
            )}

            <p className="mb-6 max-w-2xl font-light text-gray-500 md:text-lg lg:mb-8 lg:text-xl dark:text-gray-400">
              {event.summary}
            </p>
          </div>
          <div className="mt-8 flex justify-center lg:col-span-5 lg:mt-0">
            <img
              src={eventImageUrl}
              alt={event.title}
              className="w-full max-w-md rounded-lg"
            />
          </div>
        </div>
      </section>

      <section className="bg-blue-100 dark:bg-gray-900">
        <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            {subevents.map((subevent) => (
              <article
                key={subevent.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-5 flex items-center justify-between text-gray-500">
                  <span className="text-sm">
                    {formatYear(subevent.start_year)}
                    {formatYear(subevent.end_year) && (
                      <> – {formatYear(subevent.end_year)}</>
                    )}
                  </span>
                </div>

                <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {subevent.title}
                </h2>

                <p className="mb-5 font-light text-gray-500 dark:text-gray-400">
                  {subevent.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {persons.length > 0 && (
        <section className="bg-blue-100 dark:bg-gray-900">
          <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
            <h2 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl dark:text-white">
              Beteiligte Persönlichkeiten
            </h2>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {persons.map((person) => {
                const personImageUrl = person.bild
                  ? `${pb.baseURL}/api/files/persons/${person.id}/${person.bild}`
                  : null;
                return (
                  <article
                    key={person.id}
                    className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
                  >
                    {personImageUrl && (
                      <div className="aspect-[3/4] shrink-0 overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <img
                          src={personImageUrl}
                          alt={person.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {person.name}
                      </h3>
                      {(person.born || person.died) && (
                        <p className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                          {formatYear(person.born)}
                          {person.died && ` – ${formatYear(person.died)}`}
                        </p>
                      )}
                      {person.bio && (
                        <p className="line-clamp-4 flex-1 font-light text-gray-600 dark:text-gray-300">
                          {person.bio.trim()}
                        </p>
                      )}
                      <a
                        href={`/pages/person/${person.id}`}
                        className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Mehr erfahren →
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
