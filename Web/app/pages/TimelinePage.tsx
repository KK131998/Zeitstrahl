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

type CategoryKey =
  | "history"
  | "art"
  | "economy"
  | "literature"
  | "technology"
  | "music"
  | "philosophy"
  | "default";

const CATEGORY_META: Record<
  CategoryKey,
  {
    label: string;
    cardClass: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  history: {
    label: "History",
    cardClass:
      "border-amber-500/70 bg-gradient-to-br from-amber-900/70 via-gray-900/60 to-amber-800/40",
    badgeClass:
      "bg-amber-700/80 text-amber-50 border border-amber-400/70 shadow-sm",
    dotClass: "bg-amber-400",
  },
  art: {
    label: "Art",
    cardClass:
      "border-pink-500/70 bg-gradient-to-br from-pink-900/70 via-gray-900/60 to-pink-800/40",
    badgeClass:
      "bg-pink-700/80 text-pink-50 border border-pink-400/70 shadow-sm",
    dotClass: "bg-pink-400",
  },
  economy: {
    label: "Economy",
    cardClass:
      "border-emerald-500/70 bg-gradient-to-br from-emerald-900/70 via-gray-900/60 to-emerald-800/40",
    badgeClass:
      "bg-emerald-700/80 text-emerald-50 border border-emerald-400/70 shadow-sm",
    dotClass: "bg-emerald-400",
  },
  literature: {
    label: "Literature",
    cardClass:
      "border-indigo-500/70 bg-gradient-to-br from-indigo-900/70 via-gray-900/60 to-indigo-800/40",
    badgeClass:
      "bg-indigo-700/80 text-indigo-50 border border-indigo-400/70 shadow-sm",
    dotClass: "bg-indigo-400",
  },
  technology: {
    label: "Technology",
    cardClass:
      "border-cyan-500/70 bg-gradient-to-br from-cyan-900/70 via-gray-900/60 to-cyan-800/40",
    badgeClass:
      "bg-cyan-700/80 text-cyan-50 border border-cyan-400/70 shadow-sm",
    dotClass: "bg-cyan-400",
  },
  music: {
    label: "Music",
    cardClass:
      "border-fuchsia-500/70 bg-gradient-to-br from-fuchsia-900/70 via-gray-900/60 to-fuchsia-800/40",
    badgeClass:
      "bg-fuchsia-700/80 text-fuchsia-50 border border-fuchsia-400/70 shadow-sm",
    dotClass: "bg-fuchsia-400",
  },
  philosophy: {
    label: "Philosophy",
    cardClass:
      "border-slate-500/70 bg-gradient-to-br from-slate-900/70 via-gray-900/60 to-slate-800/40",
    badgeClass:
      "bg-slate-700/80 text-slate-50 border border-slate-400/70 shadow-sm",
    dotClass: "bg-slate-300",
  },
  default: {
    label: "Unkategorisiert",
    cardClass: "border-gray-700 bg-gray-900/60",
    badgeClass:
      "bg-gray-700/80 text-gray-100 border border-gray-500/70 shadow-sm",
    dotClass: "bg-blue-500",
  },
};

function getCategoryMeta(raw?: string | null | undefined) {
  const key = (raw ?? "").toLowerCase() as CategoryKey;
  return CATEGORY_META[key] ?? CATEGORY_META.default;
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
                                  const category = (item.data as any).category as
                                    | string
                                    | undefined;
                                  const meta = getCategoryMeta(category);

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
                                            <div
                                              className={`inline-block rounded-lg border p-3 text-left shadow-sm transition md:text-right ${meta.cardClass}`}
                                            >
                                              <div className="mb-1 flex items-center justify-between gap-2 md:justify-end md:gap-3">
                                                <div className="text-xs font-semibold tracking-wide text-gray-200 uppercase">
                                                  Person
                                                </div>
                                                <span
                                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badgeClass}`}
                                                >
                                                  {meta.label}
                                                </span>
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
                                        <div
                                          className={`h-3 w-3 rounded-full border-2 border-gray-900 ${meta.dotClass}`}
                                        />
                                      </div>

                                      {/* Rechte Seite: Events */}
                                      <div>
                                        {!isPerson && (
                                          <Link
                                            href={`pages//event/${item.data.id}`}
                                            className="block cursor-pointer"
                                          >
                                            <div
                                              className={`inline-block rounded-lg border p-3 text-left shadow-sm transition ${meta.cardClass}`}
                                            >
                                              <div className="mb-1 flex items-center justify-between gap-2">
                                                <div className="text-xs font-semibold tracking-wide text-gray-200 uppercase">
                                                  Event
                                                </div>
                                                <span
                                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badgeClass}`}
                                                >
                                                  {meta.label}
                                                </span>
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
