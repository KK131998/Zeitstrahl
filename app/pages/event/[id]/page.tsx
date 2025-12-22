// app/event/[id]/page.tsx
import { getEventWithSubevents } from "@/lib/data"; // Pfad ggf. anpassen
import pb from "@/lib/pocketbase";


type EventPageProps = {
    params: { id: string };
};

export default async function EventPage({ params }: EventPageProps) {

    const { id } = await params;

    const { event, subevents } = await getEventWithSubevents(id);

    const imageUrl = `${pb.baseURL}/api/files/events/${event.id}/${event.bild}`;
    console.log("Image URL:", imageUrl);

    if (!event) {
        return <div className="p-8">event nicht gefunden.</div>;
    }
    console.log("event:", event);
    console.log("Unterpunkte:", subevents);


    return (
        <main className="min-h-screen bg-white dark:bg-gray-900 items-center justify-center px-4 py-16">
            <section className="bg-white dark:bg-gray-900">
                <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
                    <div className="mr-auto place-self-center lg:col-span-7">
                        <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
                            {event.title}
                        </h1>

                        {/* ⭐ Neue Zeile: Lebensdaten */}
                        {(event.start_year || event.end_year) && (
                            <p className="max-w-2xl mb-2 font-medium text-gray-700 dark:text-gray-300">
                                {event.start_year}
                                {event.end_year && ` – ${event.end_year}`}
                            </p>
                        )}

                        <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
                            {event.summary}
                        </p>
                    </div>
                    <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
                        <img
                            src={imageUrl}
                            alt="mockup"
                        />
                    </div>
                </div>
            </section>

            <section className="bg-white dark:bg-gray-900">
                <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
                    <div className="grid gap-8 lg:grid-cols-2">
                        {subevents.map((subevent) => (
                            <article className="p-6 bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-5 text-gray-500">
                                    <span className="text-sm">{subevent.year}</span>
                                </div>
                                <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    <a href="#">{subevent.title}</a>
                                </h2>
                                <p className="mb-5 font-light text-gray-500 dark:text-gray-400">
                                    {subevent.description}
                                </p>
                            </article>
                        )
                        )}

                    </div>
                </div>
            </section>
        </main>
    );
}