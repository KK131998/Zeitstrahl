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

import type { Era, Event, Person } from "../lib/data";

type TimelinePageProps = {
  eras: Era[];
  allEvents: Event[];
  allPersons: Person[];
};

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

export default function TimelinePage({
  eras,
  allEvents,
  allPersons,
}: TimelinePageProps) {
  const [showPersons, setShowPersons] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-16 dark:bg-gray-900">
      <div className="w-full max-w-3xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Geschichtsblog – Zeitstrahl
        </h1>

        <div className="mt-6 mb-10 flex justify-center">
          <label className="inline-flex cursor-pointer items-center">
            <span className="text-sm font-medium text-white select-none">
              Events
            </span>
            <input
              type="checkbox"
              checked={showPersons}
              onChange={() => setShowPersons(!showPersons)}
              className="peer sr-only"
            />
            <div className="bg-neutral-quaternary peer-focus:ring-brand-soft dark:peer-focus:ring-brand-soft peer peer-checked:after:border-buffer peer-checked:bg-brand relative mx-3 h-5 w-9 rounded-full border border-white peer-focus:ring-4 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full" />
            <span className="text-sm font-medium text-white select-none">
              Personen
            </span>
          </label>
        </div>

        <Timeline>
          {eras.map((era) => {
            const eventsForEra = allEvents.filter(
              (event) => event.era_id === era.id,
            );
            const personsForEra = allPersons.filter(
              (person) => person.era_id === era.id,
            );

            return (
              <TimelineItem key={era.id}>
                <TimelinePoint />
                <TimelineContent>
                  <TimelineTime>
                    {formatYear(era.start_year)}
                    {era.end_year && " – " + formatYear(era.end_year)}
                  </TimelineTime>

                  <TimelineBody>
                    <Accordion collapseAll>
                      <AccordionPanel>
                        <AccordionTitle>
                          <div className="flex flex-col text-left">
                            <span className="font-semibold">{era.name}</span>
                            {era.description ? (
                              <span className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                                {era.description}
                              </span>
                            ) : null}
                          </div>
                        </AccordionTitle>

                        <AccordionContent>
                          <div className="border-l border-gray-200 pl-4 dark:border-gray-700">
                            <Timeline>
                              {!showPersons
                                ? eventsForEra.map((event) => (
                                    <TimelineItem key={event.id}>
                                      <TimelinePoint />
                                      <Link
                                        href={`pages//event/${event.id}`}
                                        className="block cursor-pointer"
                                      >
                                        <TimelineContent>
                                          <TimelineTime>
                                            {(() => {
                                              const end = formatYear(
                                                event.end_year,
                                              );
                                              return (
                                                <>
                                                  {formatYear(event.start_year)}
                                                  {end ? ` - ${end}` : ""}
                                                </>
                                              );
                                            })()}
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
                                        href={`pages/person/${person.id}`} // korrigierte Route
                                        className="block cursor-pointer"
                                      >
                                        <TimelineContent>
                                          <TimelineTime>
                                            {formatYear(person.born)}
                                            {person.died &&
                                              " – " + formatYear(person.died)}
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
