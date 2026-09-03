// app/TimelinePage.tsx
"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Timeline,
  TimelineItem,
  TimelinePoint,
  TimelineContent,
  TimelineTime,
  TimelineBody,
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

const CATEGORY_ORDER: CategoryKey[] = [
  "history",
  "art",
  "economy",
  "literature",
  "technology",
  "music",
  "philosophy",
  "default",
];

const CATEGORY_META: Record<
  CategoryKey,
  {
    label: string;
    cardClass: string;
    badgeClass: string;
    dotClass: string;
    chipClass: string;
    chipActiveClass: string;
  }
> = {
  history: {
    label: "History",
    cardClass:
      "border-amber-500/70 bg-gradient-to-br from-amber-900/70 via-gray-900/60 to-amber-800/40",
    badgeClass:
      "bg-amber-700/80 text-amber-50 border border-amber-400/70 shadow-sm",
    dotClass: "bg-amber-400",
    chipClass:
      "border-amber-500/40 bg-amber-900/30 text-amber-200 hover:border-amber-400/70 hover:bg-amber-800/40",
    chipActiveClass:
      "border-amber-400 bg-amber-600 text-amber-50 shadow-md shadow-amber-900/40",
  },
  art: {
    label: "Art",
    cardClass:
      "border-pink-500/70 bg-gradient-to-br from-pink-900/70 via-gray-900/60 to-pink-800/40",
    badgeClass:
      "bg-pink-700/80 text-pink-50 border border-pink-400/70 shadow-sm",
    dotClass: "bg-pink-400",
    chipClass:
      "border-pink-500/40 bg-pink-900/30 text-pink-200 hover:border-pink-400/70 hover:bg-pink-800/40",
    chipActiveClass:
      "border-pink-400 bg-pink-600 text-pink-50 shadow-md shadow-pink-900/40",
  },
  economy: {
    label: "Economy",
    cardClass:
      "border-emerald-500/70 bg-gradient-to-br from-emerald-900/70 via-gray-900/60 to-emerald-800/40",
    badgeClass:
      "bg-emerald-700/80 text-emerald-50 border border-emerald-400/70 shadow-sm",
    dotClass: "bg-emerald-400",
    chipClass:
      "border-emerald-500/40 bg-emerald-900/30 text-emerald-200 hover:border-emerald-400/70 hover:bg-emerald-800/40",
    chipActiveClass:
      "border-emerald-400 bg-emerald-600 text-emerald-50 shadow-md shadow-emerald-900/40",
  },
  literature: {
    label: "Literature",
    cardClass:
      "border-indigo-500/70 bg-gradient-to-br from-indigo-900/70 via-gray-900/60 to-indigo-800/40",
    badgeClass:
      "bg-indigo-700/80 text-indigo-50 border border-indigo-400/70 shadow-sm",
    dotClass: "bg-indigo-400",
    chipClass:
      "border-indigo-500/40 bg-indigo-900/30 text-indigo-200 hover:border-indigo-400/70 hover:bg-indigo-800/40",
    chipActiveClass:
      "border-indigo-400 bg-indigo-600 text-indigo-50 shadow-md shadow-indigo-900/40",
  },
  technology: {
    label: "Technology",
    cardClass:
      "border-cyan-500/70 bg-gradient-to-br from-cyan-900/70 via-gray-900/60 to-cyan-800/40",
    badgeClass:
      "bg-cyan-700/80 text-cyan-50 border border-cyan-400/70 shadow-sm",
    dotClass: "bg-cyan-400",
    chipClass:
      "border-cyan-500/40 bg-cyan-900/30 text-cyan-200 hover:border-cyan-400/70 hover:bg-cyan-800/40",
    chipActiveClass:
      "border-cyan-400 bg-cyan-600 text-cyan-50 shadow-md shadow-cyan-900/40",
  },
  music: {
    label: "Music",
    cardClass:
      "border-fuchsia-500/70 bg-gradient-to-br from-fuchsia-900/70 via-gray-900/60 to-fuchsia-800/40",
    badgeClass:
      "bg-fuchsia-700/80 text-fuchsia-50 border border-fuchsia-400/70 shadow-sm",
    dotClass: "bg-fuchsia-400",
    chipClass:
      "border-fuchsia-500/40 bg-fuchsia-900/30 text-fuchsia-200 hover:border-fuchsia-400/70 hover:bg-fuchsia-800/40",
    chipActiveClass:
      "border-fuchsia-400 bg-fuchsia-600 text-fuchsia-50 shadow-md shadow-fuchsia-900/40",
  },
  philosophy: {
    label: "Philosophy",
    cardClass:
      "border-slate-500/70 bg-gradient-to-br from-slate-900/70 via-gray-900/60 to-slate-800/40",
    badgeClass:
      "bg-slate-700/80 text-slate-50 border border-slate-500/70 shadow-sm",
    dotClass: "bg-slate-300",
    chipClass:
      "border-slate-500/40 bg-slate-800/50 text-slate-200 hover:border-slate-400/70 hover:bg-slate-700/50",
    chipActiveClass:
      "border-slate-300 bg-slate-500 text-slate-50 shadow-md shadow-slate-900/40",
  },
  default: {
    label: "Unkategorisiert",
    cardClass: "border-gray-700 bg-gray-900/60",
    badgeClass:
      "bg-gray-700/80 text-gray-100 border border-gray-500/70 shadow-sm",
    dotClass: "bg-blue-500",
    chipClass:
      "border-gray-600/50 bg-gray-800/60 text-gray-300 hover:border-gray-400/70 hover:bg-gray-700/60",
    chipActiveClass:
      "border-gray-300 bg-gray-500 text-white shadow-md shadow-gray-900/40",
  },
};

function getCategoryKey(raw?: string | null | undefined): CategoryKey {
  const key = (raw ?? "").toLowerCase() as CategoryKey;
  return CATEGORY_META[key] ? key : "default";
}

function getCategoryMeta(raw?: string | null | undefined) {
  return CATEGORY_META[getCategoryKey(raw)];
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300 ${
        open ? "rotate-180 text-blue-400" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}

export default function TimelinePage({
  eras,
  allEvents,
  allPersons,
}: TimelinePageProps) {
  const [openEras, setOpenEras] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<CategoryKey | "all">(
    "all",
  );

  const eraItems = useMemo(
    () =>
      eras.map((era) => {
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

        return { era, itemsForEra };
      }),
    [eras, allEvents, allPersons],
  );

  const availableCategories = useMemo(() => {
    const used = new Set<CategoryKey>();
    for (const { itemsForEra } of eraItems) {
      for (const item of itemsForEra) {
        used.add(getCategoryKey(item.data.category));
      }
    }
    return CATEGORY_ORDER.filter((key) => used.has(key));
  }, [eraItems]);

  const visibleEraItems = useMemo(
    () =>
      eraItems.map(({ era, itemsForEra }) => ({
        era,
        itemsForEra:
          activeCategory === "all"
            ? itemsForEra
            : itemsForEra.filter(
                (item) => getCategoryKey(item.data.category) === activeCategory,
              ),
        totalItems: itemsForEra.length,
      })),
    [eraItems, activeCategory],
  );

  const erasWithItems = visibleEraItems.filter(
    ({ itemsForEra }) => itemsForEra.length > 0,
  );
  const erasToShow =
    activeCategory === "all" ? visibleEraItems : erasWithItems;

  const allOpen =
    erasToShow.length > 0 && erasToShow.every(({ era }) => openEras.has(era.id));

  function toggleAll() {
    setOpenEras(
      allOpen ? new Set() : new Set(erasToShow.map(({ era }) => era.id)),
    );
  }

  function toggleEra(id: string) {
    setOpenEras((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectCategory(key: CategoryKey | "all") {
    setActiveCategory(key);
    if (key === "all") return;

    const matchingIds = eraItems
      .filter(({ itemsForEra }) =>
        itemsForEra.some((item) => getCategoryKey(item.data.category) === key),
      )
      .map(({ era }) => era.id);
    setOpenEras(new Set(matchingIds));
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 px-4 py-16">
      <div className="mx-auto w-full max-w-5xl">
        {/* HERO */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-300 uppercase">
            📜 Zeitreise durch die Geschichte
          </div>
          <h1 className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
            Geschichtsblog – Zeitstrahl
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-400 sm:text-base">
            Entdecke Epochen, Ereignisse und Persönlichkeiten – klicke auf
            eine Epoche, um sie zu erkunden.
          </p>
        </div>

        {/* TOOLBAR */}
        <div className="mb-8 space-y-4 rounded-2xl border border-gray-800 bg-gray-900/70 px-5 py-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-gray-400">
              <span className="font-semibold text-white">
                {erasToShow.length}
              </span>{" "}
              {erasToShow.length === 1 ? "Epoche" : "Epochen"}
              {activeCategory !== "all" && (
                <>
                  {" "}
                  mit{" "}
                  <span className="font-semibold text-white">
                    {CATEGORY_META[activeCategory].label}
                  </span>
                </>
              )}
            </span>

            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg active:scale-95"
            >
              <ChevronIcon open={allOpen} />
              {allOpen ? "Alle zuklappen" : "Alle aufklappen"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Kategorie
            </span>
            <button
              type="button"
              onClick={() => selectCategory("all")}
              className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase transition ${
                activeCategory === "all"
                  ? "border-blue-400 bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "border-gray-600/60 bg-gray-800/70 text-gray-300 hover:border-blue-400/60 hover:bg-gray-700/70"
              }`}
            >
              Alle
            </button>
            {availableCategories.map((key) => {
              const meta = CATEGORY_META[key];
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectCategory(key)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase transition ${
                    isActive ? meta.chipActiveClass : meta.chipClass
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {erasToShow.length === 0 ? (
          <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-5 py-8 text-center text-sm text-gray-400">
            Keine Epochen mit Einträgen in dieser Kategorie.
          </p>
        ) : (
        <Timeline>
          {erasToShow.map(({ era, itemsForEra, totalItems }) => {
            const isOpen = openEras.has(era.id);

            return (
              <TimelineItem key={era.id}>
                <TimelinePoint className="[&>div]:border-gray-950 [&>div]:bg-blue-500" />
                <TimelineContent>
                  <TimelineTime className="text-blue-300">
                    {formatYear(era.start_year)}
                    {era.end_year && " – " + formatYear(era.end_year)}
                  </TimelineTime>

                  <TimelineBody>
                    <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60 shadow-sm transition-colors hover:border-gray-700">
                      <button
                        type="button"
                        onClick={() => toggleEra(era.id)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-800/50"
                      >
                        <div className="flex flex-col text-left text-white">
                          <span className="font-semibold">{era.name}</span>

                          {era.description ? (
                            <span className="mt-1 text-sm font-normal text-gray-400">
                              {era.description}
                            </span>
                          ) : null}

                          <span className="mt-1.5 text-xs text-gray-500">
                            {itemsForEra.length}{" "}
                            {itemsForEra.length === 1 ? "Eintrag" : "Einträge"}
                            {activeCategory !== "all" &&
                              itemsForEra.length !== totalItems && (
                                <> von {totalItems}</>
                              )}
                          </span>
                        </div>

                        <ChevronIcon open={isOpen} />
                      </button>

                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="border-t border-gray-800 px-5 py-5">
                            {itemsForEra.length === 0 ? (
                              <p className="text-sm text-gray-500">
                                {activeCategory === "all"
                                  ? "Keine Personen oder Events für diese Epoche."
                                  : `Keine Einträge in der Kategorie ${CATEGORY_META[activeCategory].label}.`}
                              </p>
                            ) : (
                              <div className="space-y-8">
                                {itemsForEra.map((item) => {
                                  const isPerson = item.type === "person";
                                  const meta = getCategoryMeta(
                                    item.data.category,
                                  );

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
                                              className={`inline-block rounded-lg border p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg md:text-right ${meta.cardClass}`}
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
                                              className={`inline-block rounded-lg border p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${meta.cardClass}`}
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
                        </div>
                      </div>
                    </div>
                  </TimelineBody>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
        )}
      </div>
    </main>
  );
}
