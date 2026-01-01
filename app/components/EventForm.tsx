"use client";

import React, { useEffect, useState } from "react";
import { Alert } from "flowbite-react";

type SubeventInput = {
  title: string;
  year: number; // Zahl (z.B. 44 oder -44)
  description: string;
};

type SubeventUI = SubeventInput & { id: string };

export type EventInitialValues = Partial<{
  title: string;
  start_year: number;
  end_year: number;
  summary: string;
  // Bild kann man beim Edit nicht sinnvoll "vorbefüllen" als File – optional später als URL anzeigen.
  subevents: SubeventInput[];
}>;

export default function EventForm({
  eventId,
  initialValues,
}: {
  eventId?: string;
  initialValues?: EventInitialValues;
}) {
  // Main event
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [startYear, setStartYear] = useState<number | "">(
    initialValues?.start_year ?? "",
  );
  const [endYear, setEndYear] = useState<number | "">(
    initialValues?.end_year ?? "",
  );
  const [summary, setSummary] = useState(initialValues?.summary ?? "");
  const [bild, setBild] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Subevents (UI mit id)
  const [subevents, setSubevents] = useState<SubeventUI[]>(
    (initialValues?.subevents ?? []).map((s) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...s,
    })),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Falls initialValues später reinkommen (Edit-Page lädt serverseitig – aber good practice)
  useEffect(() => {
    if (!initialValues) return;

    if (initialValues.title !== undefined) setTitle(initialValues.title);
    if (initialValues.start_year !== undefined)
      setStartYear(initialValues.start_year);
    if (initialValues.end_year !== undefined)
      setEndYear(initialValues.end_year);
    if (initialValues.summary !== undefined) setSummary(initialValues.summary);

    if (initialValues.subevents !== undefined) {
      setSubevents(
        initialValues.subevents.map((s) => ({
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          ...s,
        })),
      );
    }
  }, [initialValues]);

  const addSubevent = () => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setSubevents((prev) => [
      ...prev,
      { id, title: "", year: NaN, description: "" },
    ]);
  };

  const removeSubevent = (id: string) => {
    setSubevents((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSubevent = <K extends keyof SubeventUI>(
    id: string,
    key: K,
    value: SubeventUI[K],
  ) => {
    setSubevents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Minimal-Validierung
    if (!title.trim()) return setError("Bitte gib einen Titel an.");
    if (startYear === "" || !Number.isFinite(startYear))
      return setError("Ungültiges Start-Jahr.");
    if (endYear !== "" && !Number.isFinite(endYear))
      return setError("Ungültiges End-Jahr.");

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("start_year", String(startYear));
      if (endYear !== "") fd.append("end_year", String(endYear));
      fd.append("summary", summary);

      if (bild) fd.append("bild", bild);

      // Subevents als JSON (ohne UI-id)
      fd.append(
        "subevents",
        JSON.stringify(subevents.map(({ id, ...rest }) => rest)),
      );

      const isEdit = Boolean(eventId);
      const url = isEdit ? `/api/events/${eventId}` : "/api/events";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, { method, body: fd });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setSuccess(
        eventId ? "Änderungen wurden gespeichert." : "Eintrag wurde erstellt.",
      );

      const createdEventId = eventId ?? data.eventId ?? data.id;

      if (!createdEventId) {
        console.error("Keine Event-ID im Response:", data);
      } else {
        fetch("/api/cards/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "event",
            eventId: createdEventId,
            event: {
              title: title.trim(),
              start_year: typeof startYear === "number" ? startYear : undefined,
              end_year: typeof endYear === "number" ? endYear : undefined,
              summary: summary?.trim?.() ?? "",
              subevents: subevents.map(({ id, ...rest }) => rest), // UI-id raus
            },
          }),
        }).catch(console.error);
      }

      console.log(isEdit ? "Event aktualisiert:" : "Event gespeichert:", data);
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
          {eventId ? "Event bearbeiten:" : "Füge neues Event hinzu:"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {/* Event Name */}
            <div className="sm:col-span-2">
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Event Name:
              </label>
              <input
                type="text"
                id="name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Event"
                required
              />
            </div>

            {/* Dates */}
            <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-end">
              <div className="relative flex-1">
                <label
                  htmlFor="start_year"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Von:
                </label>
                <input
                  id="start_year"
                  type="number"
                  placeholder="z.B. -44 für 44 v. Chr."
                  value={startYear}
                  onChange={(e) =>
                    setStartYear(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="bg-neutral-secondary-medium border-default-medium text-heading rounded-base block w-full border py-2.5 ps-3 pe-3 text-sm"
                />
              </div>

              <div className="text-body sm:pb-3">bis</div>

              <div className="relative flex-1">
                <label
                  htmlFor="end_year"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Bis:
                </label>

                <input
                  id="end_year"
                  type="number"
                  placeholder="optional"
                  value={endYear}
                  onChange={(e) =>
                    setEndYear(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="bg-neutral-secondary-medium border-default-medium text-heading rounded-base block w-full border py-2.5 ps-3 pe-3 text-sm"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 sm:col-span-2">{error}</div>
            )}

            {/* Summary */}
            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                Zusammenfassung:
              </label>
              <textarea
                id="description"
                rows={8}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Deine Beschreibung hier"
              />
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

              {eventId && (
                <p className="mt-2 text-xs text-gray-400">
                  Hinweis: Beim Bearbeiten kann man ein neues Bild hochladen
                  (überschreibt das alte).
                </p>
              )}
            </div>

            {/* SUBEVENTS */}
            <div className="sm:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Subevents
                </h3>

                <button
                  type="button"
                  onClick={addSubevent}
                  className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-200 dark:focus:ring-primary-900 inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-white focus:ring-4"
                >
                  + Subevent hinzufügen
                </button>
              </div>

              {subevents.length === 0 ? (
                <div className="text-sm text-gray-500 italic">
                  Noch keine Subevents hinzugefügt.
                </div>
              ) : (
                <div className="space-y-4">
                  {subevents.map((s, idx) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Subevent {idx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeSubevent(s.id)}
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
                            value={s.title}
                            onChange={(e) =>
                              updateSubevent(s.id, "title", e.target.value)
                            }
                            placeholder="Titel des Subevents"
                            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        {/* Year */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                            Jahr
                          </label>
                          <input
                            type="number"
                            value={Number.isFinite(s.year) ? s.year : ""}
                            onChange={(e) =>
                              updateSubevent(
                                s.id,
                                "year",
                                e.target.value === ""
                                  ? NaN
                                  : Number(e.target.value),
                              )
                            }
                            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                            Beschreibung
                          </label>
                          <textarea
                            rows={4}
                            value={s.description}
                            onChange={(e) =>
                              updateSubevent(
                                s.id,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Beschreibung des Subevents"
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
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary-700 hover:bg-primary-800 mt-4 inline-flex items-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 sm:mt-6"
          >
            {isSaving
              ? "Speichern..."
              : eventId
                ? "Änderungen speichern"
                : "Hinzufügen"}
          </button>
        </form>
      </div>
    </section>
  );
}
