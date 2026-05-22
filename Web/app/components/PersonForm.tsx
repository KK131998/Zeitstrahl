"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Alert } from "flowbite-react";
import { getEras, getEvents, type Era, type Event } from "../lib/data";

type AchievementInput = {
  title: string;
  start_year: number;
  end_year: number;
  description: string;
};

type AchievementUI = AchievementInput & { id: string };

export type PersonInitialValues = Partial<{
  name: string;
  eraId: string;
  born: number;
  died: number;
  timeline_year: number;
  bio: string;
  eventIds: string[];
  achievements: AchievementInput[];
  category: string;
}>;

export default function PersonForm({
  personId,
  initialValues,
}: {
  personId?: string;
  initialValues?: PersonInitialValues;
}) {
  // Main person
  const [name, setName] = useState(initialValues?.name ?? "");
  const [born, setBorn] = useState<number | "">(initialValues?.born ?? "");
  const [died, setDied] = useState<number | "">(initialValues?.died ?? "");
  const [timeline_year, setTimeline_year] = useState<number | "">(initialValues?.timeline_year ?? "");
  const [bio, setBio] = useState(initialValues?.bio ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [bild, setBild] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Achievements (UI mit id)
  const [achievements, setAchievements] = useState<AchievementUI[]>(
    (initialValues?.achievements ?? []).map((a) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...a,
    })),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [savedPersonId, setSavedPersonId] = useState<string | undefined>(personId);
  const [error, setError] = useState<string | null>(null);

  const effectivePersonId = personId ?? savedPersonId;

  const [eraId, setEraId] = useState<string>(initialValues?.eraId ?? "");
  const [eras, setEras] = useState<Era[]>([]);
  const [erasLoading, setErasLoading] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(
    initialValues?.eventIds ?? [],
  );

  // initialValues nachziehen (Edit-Page)
  useEffect(() => {
    if (!initialValues) return;

    if (initialValues.name !== undefined) setName(initialValues.name);
    if (initialValues.born !== undefined) setBorn(initialValues.born);
    if (initialValues.died !== undefined) setDied(initialValues.died);
    if (initialValues.timeline_year !== undefined)
      setTimeline_year(initialValues.timeline_year);
    if (initialValues.bio !== undefined) setBio(initialValues.bio);
    if (initialValues.eraId !== undefined) setEraId(initialValues.eraId);
    if (initialValues.eventIds !== undefined)
      setSelectedEventIds(initialValues.eventIds);

    if (initialValues.category !== undefined)
      setCategory(initialValues.category);

    if (initialValues.achievements !== undefined) {
      setAchievements(
        initialValues.achievements.map((a) => ({
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          ...a,
        })),
      );
    }
  }, [initialValues]);

  useEffect(() => {
    if (personId) setSavedPersonId(personId);
  }, [personId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErasLoading(true);
      try {
        const list = await getEras();
        if (!cancelled) setEras(list);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setErasLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setEventsLoading(true);
      try {
        const list = await getEvents();
        if (!cancelled) setEvents(list);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (initialValues?.eventIds !== undefined)
      setSelectedEventIds(initialValues.eventIds);
  }, [initialValues?.eventIds]);

  // Events nach Lebenszeit filtern: nur anzeigen, die in die Person-Lebensspanne fallen
  const filteredEvents = useMemo(() => {
    const personStart =
      born !== "" && Number.isFinite(born) ? Number(born) : null;
    if (personStart === null) return events;

    const personEnd =
      died !== "" && Number.isFinite(died) ? Number(died) : 9999;

    return events.filter((ev) => {
      const eventStart = ev.start_year ?? null;
      if (eventStart == null) return false;
      const eventEnd = ev.end_year ?? eventStart;
      const eventOverlaps =
        eventStart <= personEnd && eventEnd >= personStart;
      return eventOverlaps;
    });
  }, [events, born, died]);

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId],
    );
  };

  const addAchievement = () => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setAchievements((prev) => [
      ...prev,
      { id, title: "", start_year: NaN, end_year: NaN, description: "" },
    ]);
  };

  const removeAchievement = (id: string) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAchievement = <K extends keyof AchievementUI>(
    id: string,
    key: K,
    value: AchievementUI[K],
  ) => {
    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [key]: value } : a)),
    );
  };

  const requestCardGeneration = async (id: string) => {
    if (!name.trim()) {
      setError("Bitte gib einen Namen an.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsGeneratingCards(true);

    try {
      const res = await fetch("/api/cards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "person",
          personId: id,
          person: {
            name: name.trim(),
            born: born === "" ? undefined : born,
            died: died === "" ? undefined : died,
            timeline_year: timeline_year === "" ? undefined : timeline_year,
            bio: bio.trim(),
            achievements: achievements.map(({ id: _id, ...rest }) => rest),
          },
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = (await res.json()) as { created?: number };
      setSuccess(
        data.created
          ? `${data.created} Lernkarten wurden erstellt.`
          : "Karten-Generierung abgeschlossen.",
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Lernkarten konnten nicht generiert werden.",
      );
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Minimal-Validierung (wie EventForm)
    if (!name.trim()) return setError("Bitte gib einen Namen an.");
    if (born !== "" && !Number.isFinite(born))
      return setError("Ungültiges Geburtsjahr.");
    if (died !== "" && !Number.isFinite(died))
      return setError("Ungültiges Sterbejahr.");
    if (timeline_year !== "" && !Number.isFinite(timeline_year))
      return setError("Ungültiges Jahr für den Zeitstrahl.");
    if (typeof born === "number" && typeof died === "number" && died < born)
      return setError("Gestorben darf nicht vor Geboren liegen.");

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());

      if (born !== "") fd.append("born", String(born));
      if (died !== "") fd.append("died", String(died));
      if (timeline_year !== "")
        fd.append("timeline_year", String(timeline_year));

      fd.append("bio", bio);

      if (bild) fd.append("bild", bild);
      if (category) fd.append("category", category);
      if (eraId) fd.append("era", eraId);

      // Achievements als JSON (ohne UI-id) — Feldname bleibt wie bei dir: person_achievements
      fd.append(
        "person_achievements",
        JSON.stringify(achievements.map(({ id, ...rest }) => rest)),
      );

      fd.append("event_ids", JSON.stringify(selectedEventIds));

      const isEdit = Boolean(personId);
      const url = isEdit ? `/api/persons/${personId}` : "/api/persons";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, { method, body: fd });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setSuccess(
        personId ? "Änderungen wurden gespeichert." : "Eintrag wurde erstellt.",
      );

      const createdPersonId = personId ?? data.id ?? data.personId;
      if (createdPersonId) setSavedPersonId(createdPersonId);

      if (!isEdit && createdPersonId) {
        await requestCardGeneration(createdPersonId);
      }

      console.log(
        isEdit ? "Person aktualisiert:" : "Person gespeichert:",
        data,
      );
    } catch (err: any) {
      setError(err?.message ?? "Unbekannter Fehler");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-8 lg:py-16">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          {personId
            ? "Persönlichkeit bearbeiten:"
            : "Füge neue Persönlichkeit hinzu:"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {/* Name */}
            <div className="sm:col-span-2">
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Name:
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Name"
                required
              />
            </div>

            {/* Era */}
            <div className="sm:col-span-2">
              <label
                htmlFor="era"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Epoche:
              </label>

              <select
                id="era"
                value={eraId}
                onChange={(e) => setEraId(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">
                  {erasLoading
                    ? "Lade Epochen..."
                    : "— keine Epoche auswählen —"}
                </option>

                {eras.map((era) => (
                  <option key={era.id} value={era.id}>
                    {era.name}
                    {typeof era.start_year === "number" ||
                    typeof era.end_year === "number"
                      ? ` (${era.start_year ?? "?"}–${era.end_year ?? "?"})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-end">
              <div className="relative flex-1">
                <label
                  htmlFor="born"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Geboren:
                </label>
                <input
                  id="born"
                  type="number"
                  placeholder="z.B. -44"
                  value={born}
                  onChange={(e) =>
                    setBorn(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="bg-neutral-secondary-medium border-default-medium text-heading rounded-base block w-full border py-2.5 ps-3 pe-3 text-sm"
                />
              </div>

              <div className="text-body sm:pb-3">bis</div>

              <div className="relative flex-1">
                <label
                  htmlFor="died"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Gestorben:
                </label>
                <input
                  id="died"
                  type="number"
                  placeholder="optional"
                  value={died}
                  onChange={(e) =>
                    setDied(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="bg-neutral-secondary-medium border-default-medium text-heading rounded-base block w-full border py-2.5 ps-3 pe-3 text-sm"
                />
              </div>
            </div>

            {/* Timeline-Year */}
            <div className="sm:col-span-2">
              <label
                htmlFor="timeline_year"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Jahr für den Zeitstrahl (optional):
              </label>
              <input
                id="timeline_year"
                type="number"
                placeholder="z.B. 1800 (wenn verschieden von Geburtsjahr)"
                value={timeline_year}
                onChange={(e) =>
                  setTimeline_year(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="bg-neutral-secondary-medium border-default-medium text-heading rounded-base block w-full border py-2.5 ps-3 pe-3 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Wird nur verwendet, um die Position der Person auf dem
                Zeitstrahl zu bestimmen. Wenn leer, wird das Geburts- bzw.
                Sterbejahr verwendet.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 sm:col-span-2">{error}</div>
            )}

            {/* Bio */}
            <div className="sm:col-span-2">
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Biographie:
              </label>
              <textarea
                id="bio"
                rows={8}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Die Biographie der Persönlichkeit..."
              />
            </div>

            {/* Kategorie */}
            <div className="sm:col-span-2">
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Kategorie:
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">— keine Kategorie —</option>
                <option value="history">History</option>
                <option value="art">Art</option>
                <option value="economy">Economy</option>
                <option value="literature">Literature</option>
                <option value="technology">Technology</option>
                <option value="music">Music</option>
                <option value="philosophy">Philosophy</option>
              </select>
            </div>

            {/* File upload */}
            <div className="sm:col-span-2">
              <label
                htmlFor="file_input"
                className="border-default-medium rounded-base bg-neutral-secondary-medium hover:bg-neutral-secondary-light focus-within:ring-brand flex h-32 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed transition focus-within:ring-2"
              >
                <p className="text-heading text-sm">
                  <span className="font-semibold">Click to upload</span> or drag
                  & drop
                </p>

                {bild ? (
                  <p className="text-body mt-2 text-xs">
                    Ausgewählt: <span className="font-medium">{bild.name}</span>
                  </p>
                ) : (
                  <p className="text-body mt-1 text-xs">
                    SVG, PNG, JPG or GIF (MAX. 800×400px)
                  </p>
                )}

                <input
                  id="file_input"
                  type="file"
                  className="hidden"
                  accept="image/svg+xml,image/png,image/jpeg,image/gif"
                  onChange={(e) => setBild(e.target.files?.[0] ?? null)}
                />
              </label>

              {personId && (
                <p className="mt-2 text-xs text-gray-400">
                  Hinweis: Beim Bearbeiten kann man ein neues Bild hochladen
                  (überschreibt das alte).
                </p>
              )}
            </div>

            {/* Ereignisse (Verknüpfung) – gefiltert nach Lebenszeit */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Beteiligte Ereignisse
              </label>
              {eventsLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ereignisse werden geladen…
                </p>
              ) : events.length === 0 ? (
                <p className="text-sm italic text-gray-500 dark:text-gray-400">
                  Keine Ereignisse vorhanden.
                </p>
              ) : born === "" || !Number.isFinite(born) ? (
                <p className="text-sm italic text-gray-500 dark:text-gray-400">
                  Bitte zuerst Geburtsjahr (und ggf. Sterbejahr) eingeben – dann werden nur passende Ereignisse angezeigt.
                </p>
              ) : filteredEvents.length === 0 ? (
                <p className="text-sm italic text-gray-500 dark:text-gray-400">
                  Keine Ereignisse fallen in die angegebene Lebensspanne.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
                  <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                    Nur Ereignisse, die in die Lebensspanne der Person fallen
                  </p>
                  <div className="space-y-2">
                    {filteredEvents.map((ev) => (
                      <label
                        key={ev.id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEventIds.includes(ev.id)}
                          onChange={() => toggleEvent(ev.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-600"
                        />
                        <span className="text-gray-900 dark:text-white">
                          {ev.title}
                          {ev.start_year != null || ev.end_year != null
                            ? ` (${ev.start_year ?? "?"} – ${ev.end_year ?? "?"})`
                            : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ACHIEVEMENTS */}
            <div className="sm:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Achievements
                </h3>

                <button
                  type="button"
                  onClick={addAchievement}
                  className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-200 dark:focus:ring-primary-900 inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-white focus:ring-4"
                >
                  + Achievement hinzufügen
                </button>
              </div>

              {achievements.length === 0 ? (
                <div className="text-sm text-gray-500 italic">
                  Noch keine Achievements hinzugefügt.
                </div>
              ) : (
                <div className="space-y-4">
                  {achievements.map((a, idx) => (
                    <div
                      key={a.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Achievement {idx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeAchievement(a.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Entfernen
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Title */}
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                            Title
                          </label>
                          <input
                            type="text"
                            value={a.title}
                            onChange={(e) =>
                              updateAchievement(a.id, "title", e.target.value)
                            }
                            placeholder="Titel des Achievements"
                            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        {/* StartYear */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                            Von:
                          </label>
                          <input
                            type="number"
                            value={
                              Number.isFinite(a.start_year) ? a.start_year : ""
                            }
                            placeholder="z.B. -44"
                            onChange={(e) =>
                              updateAchievement(
                                a.id,
                                "start_year",
                                e.target.value === ""
                                  ? NaN
                                  : Number(e.target.value),
                              )
                            }
                            className="bg-neutral-secondary-medium border-default-medium text-heading rounded-base block w-full border py-2.5 ps-3 pe-3 text-sm"
                          />
                        </div>

                        {/* EndYear */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                            Bis:
                          </label>
                          <input
                            type="number"
                            value={
                              Number.isFinite(a.end_year) ? a.end_year : ""
                            }
                            placeholder="z.B. -44"
                            onChange={(e) =>
                              updateAchievement(
                                a.id,
                                "end_year",
                                e.target.value === ""
                                  ? NaN
                                  : Number(e.target.value),
                              )
                            }
                            className="bg-neutral-secondary-medium border-default-medium text-heading rounded-base block w-full border py-2.5 ps-3 pe-3 text-sm"
                          />
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                            Beschreibung
                          </label>
                          <textarea
                            rows={4}
                            value={a.description}
                            onChange={(e) =>
                              updateAchievement(
                                a.id,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Beschreibung"
                            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {success && (
            <Alert color="success" className="mt-4 sm:col-span-2">
              <span className="font-medium">Erfolg!</span> {success}
            </Alert>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 sm:mt-6">
            <button
              type="submit"
              disabled={isSaving || isGeneratingCards}
              className="bg-primary-700 hover:bg-primary-800 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Speichern..."
                : personId
                  ? "Änderungen speichern"
                  : "Hinzufügen"}
            </button>

            {effectivePersonId && (
              <button
                type="button"
                disabled={isSaving || isGeneratingCards}
                onClick={() => requestCardGeneration(effectivePersonId)}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                {isGeneratingCards ? "Generiere…" : "Karten generieren"}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
