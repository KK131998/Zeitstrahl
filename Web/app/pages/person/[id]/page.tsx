// app/person/[id]/page.tsx
import {
  getPersonWithAchievements,
  getEventsForPerson,
} from "@/lib/data";
import pb from "@/lib/pocketbase";

type PersonPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;

  const { person, achievements } = await getPersonWithAchievements(id);
  const { events } = await getEventsForPerson(id);

  const personImageUrl = `${pb.baseURL}/api/files/persons/${person.id}/${person.bild}`;

  if (!person) {
    return <div className="p-8">Person nicht gefunden.</div>;
  }

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

  return (
    <main className="min-h-screen items-center justify-center bg-blue-100 px-4 py-16 dark:bg-gray-900">
      <section className="bg-blue-100 dark:bg-gray-900">
        <div className="mx-auto grid max-w-screen-xl px-4 py-8 lg:grid-cols-12 lg:gap-8 lg:py-16 xl:gap-0">
          <div className="mr-auto place-self-center lg:col-span-7">
            <h1 className="mb-4 max-w-2xl text-4xl leading-none font-extrabold tracking-tight md:text-5xl xl:text-6xl dark:text-white">
              {person.name}
            </h1>

            {/* ⭐ Neue Zeile: Lebensdaten */}
            {(person.born || person.died) && (
              <p className="mb-2 max-w-2xl font-medium text-gray-700 dark:text-gray-300">
                {formatYear(person.born)} – {formatYear(person.died)}
              </p>
            )}

            <p className="mb-6 max-w-2xl font-light text-gray-500 md:text-lg lg:mb-8 lg:text-xl dark:text-gray-400">
              {person.bio}
            </p>
          </div>
          <div className="hidden lg:col-span-5 lg:mt-0 lg:flex">
            <img src={personImageUrl} alt={person.name} />
          </div>
        </div>
      </section>

      <section className="bg-blue-100 dark:bg-gray-900">
        <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            {achievements.map((achievement) => (
              <article
                key={achievement.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-5 flex items-center justify-between text-gray-500">
                  <span className="text-sm">{achievement.start_year}</span>
                </div>
                <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  <a href="#">{achievement.title}</a>
                </h2>
                <p className="mb-5 font-light text-gray-500 dark:text-gray-400">
                  {achievement.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {events.length > 0 && (
        <section className="bg-blue-100 dark:bg-gray-900">
          <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
            <h2 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl dark:text-white">
              Beteiligte Ereignisse
            </h2>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {events.map((event) => {
                const eventImageUrl = event.bild
                  ? `${pb.baseURL}/api/files/events/${event.id}/${event.bild}`
                  : null;
                return (
                  <article
                    key={event.id}
                    className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800"
                  >
                    {eventImageUrl && (
                      <div className="aspect-[3/4] shrink-0 overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <img
                          src={eventImageUrl}
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {event.title}
                      </h3>
                      {(event.start_year || event.end_year) && (
                        <p className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                          {formatYear(event.start_year)}
                          {event.end_year && ` – ${formatYear(event.end_year)}`}
                        </p>
                      )}
                      {event.summary && (
                        <p className="line-clamp-4 flex-1 font-light text-gray-600 dark:text-gray-300">
                          {event.summary.trim()}
                        </p>
                      )}
                      <a
                        href={`/pages/event/${event.id}`}
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
