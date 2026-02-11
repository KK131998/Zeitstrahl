// app/TimelinePage.tsx
"use client";
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

const truncate = (text: string, max = 130) =>
  text.length > max ? text.slice(0, max) + "…" : text;

export default function TimelinePage({
  eras,
  allEvents,
  allPersons,
}: TimelinePageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-16">
      <div className="w-full max-w-5xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-white">
          Geschichtsblog – Zeitstrahl
        </h1>

        <Timeline>
          {eras.map((era) => {
            const eventsForEra = allEvents.filter(
              (event) => event.era_id === era.id,
            );
            const personsForEra = allPersons.filter(
              (person) => person.era_id === era.id,
            );

            const itemsForEra = [
              ...personsForEra.map((person) => ({
                type: "person" as const,
                id: person.id,
                sortYear:
                  (person.timeline_year as number | string | undefined) ??
                  (person.born as number | string | undefined) ??
                  (person.died as number | string | undefined) ??
                  0,
                data: person,
              })),
              ...eventsForEra.map((event) => ({
                type: "event" as const,
                id: event.id,
                sortYear:
                  (event.start_year as number | string | undefined) ??
                  (event.end_year as number | string | undefined) ??
                  0,
                data: event,
              })),
            ].sort((a, b) => {
              const aNum =
                typeof a.sortYear === "string"
                  ? Number(a.sortYear)
                  : (a.sortYear as number);
              const bNum =
                typeof b.sortYear === "string"
                  ? Number(b.sortYear)
                  : (b.sortYear as number);
              return aNum - bNum;
            });

            return (
              <TimelineItem key={era.id}>
                <TimelinePoint />
                <TimelineContent>
                  <TimelineTime className="text-white">
                    {formatYear(era.start_year)}
                    {era.end_year && " – " + formatYear(era.end_year)}
                  </TimelineTime>

                  <TimelineBody>
                    <Accordion collapseAll>
                      <AccordionPanel>
                        <AccordionTitle className="!bg-transparent !text-white hover:!bg-transparent focus:!bg-transparent active:!bg-transparent dark:!bg-transparent dark:hover:!bg-transparent dark:focus:!bg-transparent dark:active:!bg-transparent">
                          <div className="flex flex-col text-left text-white">
                            <span className="font-semibold">{era.name}</span>

                            {era.description ? (
                              <span className="mt-1 text-sm font-normal text-gray-400">
                                {era.description}
                              </span>
                            ) : null}
                          </div>
                        </AccordionTitle>

                        <AccordionContent>
                          <div className="mt-4">
                            {itemsForEra.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                Keine Personen oder Events für diese Epoche.
                              </p>
                            ) : (
                              <div className="space-y-8">
                                {itemsForEra.map((item) => {
                                  const isPerson = item.type === "person";

                                  return (
                                    <div
                                      key={`${item.type}-${item.id}`}
                                      className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch"
                                    >
                                      {/* Linke Seite: Personen */}
                                      <div
                                        className={
                                          isPerson ? "md:text-right" : ""
                                        }
                                      >
                                        {isPerson && (
                                          <Link
                                            href={`pages/person/${item.data.id}`}
                                            className="block cursor-pointer"
                                          >
                                            <div className="inline-block rounded-lg border border-gray-700 bg-gray-900/60 p-3 text-left md:text-right">
                                              <div className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                                                Person
                                              </div>
                                              <div className="text-xs text-gray-400">
                                                {formatYear(item.data.born)}
                                                {item.data.died &&
                                                  " – " +
                                                    formatYear(item.data.died)}
                                              </div>
                                              <div className="mt-1 text-sm font-semibold text-blue-400 hover:underline">
                                                {item.data.name}
                                              </div>
                                              <div className="mt-1 text-sm text-gray-300">
                                                {item.data.bio
                                                  ? truncate(item.data.bio)
                                                  : "Noch keine Beschreibung vorhanden."}
                                              </div>
                                            </div>
                                          </Link>
                                        )}
                                      </div>

                                      {/* Mitte: Punkt auf dem Zeitstrahl */}
                                      <div className="flex h-full items-center justify-center">
                                        <div className="h-3 w-3 rounded-full border-2 border-gray-900 bg-blue-500" />
                                      </div>

                                      {/* Rechte Seite: Events */}
                                      <div>
                                        {!isPerson && (
                                          <Link
                                            href={`pages//event/${item.data.id}`}
                                            className="block cursor-pointer"
                                          >
                                            <div className="inline-block rounded-lg border border-gray-700 bg-gray-900/60 p-3 text-left">
                                              <div className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                                                Event
                                              </div>
                                              <div className="text-xs text-gray-400">
                                                {(() => {
                                                  const end = formatYear(
                                                    item.data.end_year,
                                                  );
                                                  return (
                                                    <>
                                                      {formatYear(
                                                        item.data.start_year,
                                                      )}
                                                      {end ? ` - ${end}` : ""}
                                                    </>
                                                  );
                                                })()}
                                              </div>
                                              <div className="mt-1 text-sm font-semibold text-white hover:underline">
                                                {item.data.title}
                                              </div>
                                              <div className="mt-1 text-sm text-gray-300">
                                                {item.data.summary
                                                  ? truncate(item.data.summary)
                                                  : "Noch keine Beschreibung vorhanden."}
                                              </div>
                                            </div>
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
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
