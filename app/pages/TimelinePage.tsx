// app/TimelinePage.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Timeline,
    TimelineItem,
    TimelinePoint,
    TimelineContent,
    TimelineTime,
    TimelineTitle,
    TimelineBody,
    Accordion,
    AccordionPanel,
    AccordionTitle,
    AccordionContent,
} from "flowbite-react";

import type { Era, Event, Person } from "../../lib/data";

type TimelinePageProps = {
    eras: Era[];
    allEvents: Event[];
    allPersons: Person[];
};


export default function TimelinePage({ eras, allEvents, allPersons }: TimelinePageProps) {
    const [showPersons, setShowPersons] = useState(false);

    return (
        <main className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                    Geschichtsblog – Zeitstrahl
                </h1>

                <div className="flex justify-center mt-6 mb-10">
                    <label className="inline-flex items-center cursor-pointer">
                        <span className="select-none text-sm font-medium text-white">Events</span>
                        <input
                            type="checkbox"
                            checked={showPersons}
                            onChange={() => setShowPersons(!showPersons)}
                            className="sr-only peer"
                        />
                        <div className="relative mx-3 w-9 h-5 bg-neutral-quaternary border border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-soft dark:peer-focus:ring-brand-soft rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-buffer after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand" />
                        <span className="select-none text-sm font-medium text-white">Personen</span>
                    </label>
                </div>

                <Timeline>
                    {eras.map((era) => {
                        const eventsForEra = allEvents.filter(
                            (event) => event.era_id === era.id
                        );
                        const personsForEra = allPersons.filter(
                            (person) => person.era_id === era.id
                        );

                        return (
                            <TimelineItem key={era.id}>
                                <TimelinePoint />
                                <TimelineContent>
                                    <TimelineTime>
                                        {era.start_year}
                                        {era.end_year &&
                                            " – " + era.end_year}
                                    </TimelineTime>

                                    <TimelineBody>
                                        <Accordion collapseAll>
                                            <AccordionPanel>
                                                <AccordionTitle>{era.name}</AccordionTitle>
                                                <AccordionContent>
                                                    <div className="pl-4 border-l border-gray-200 dark:border-gray-700">
                                                        <Timeline>
                                                            {!showPersons
                                                                ? eventsForEra.map((event) => (
                                                                    <TimelineItem key={event.id}>
                                                                        <TimelinePoint />
                                                                        <Link
                                                                            href={`/event/${event.id}`}
                                                                            className="block cursor-pointer"
                                                                        >
                                                                            <TimelineContent>
                                                                                <TimelineTime>
                                                                                    {event.start_year &&

                                                                                        event.start_year
                                                                                    }
                                                                                    {event.end_year &&
                                                                                        " – " +

                                                                                        event.end_year
                                                                                    }
                                                                                </TimelineTime>

                                                                                <TimelineTitle className="text-blue-600 hover:underline">
                                                                                    {event.title}
                                                                                </TimelineTitle>

                                                                                <TimelineBody>
                                                                                    {event.summary ||
                                                                                        era.description ||
                                                                                        "Noch keine Beschreibung vorhanden."}
                                                                                </TimelineBody>
                                                                            </TimelineContent>
                                                                        </Link>
                                                                    </TimelineItem>
                                                                ))
                                                                : personsForEra.map((person) => (
                                                                    <TimelineItem key={person.id}>
                                                                        <TimelinePoint />
                                                                        <Link
                                                                            href={`/person/${person.id}`} // korrigierte Route
                                                                            className="block cursor-pointer"
                                                                        >
                                                                            <TimelineContent>
                                                                                <TimelineTime>
                                                                                    {person.born &&
                                                                                        person.born
                                                                                    }
                                                                                    {person.died &&
                                                                                        " – " +
                                                                                        person.died
                                                                                    }
                                                                                </TimelineTime>
                                                                                <TimelineTitle className="text-blue-600 hover:underline">
                                                                                    {person.name}
                                                                                </TimelineTitle>

                                                                                <TimelineBody>
                                                                                    {person.bio ||
                                                                                        person.description ||
                                                                                        "Noch keine Beschreibung vorhanden."}
                                                                                </TimelineBody>
                                                                            </TimelineContent>
                                                                        </Link>
                                                                    </TimelineItem>
                                                                ))}
                                                        </Timeline>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionPanel>
                                        </Accordion>
                                    </TimelineBody>
                                </TimelineContent>
                            </TimelineItem>
                        );
                    })}
                </Timeline>
            </div>
        </main>
    );
}
