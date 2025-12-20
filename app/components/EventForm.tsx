"use client";

import React, { useEffect, useState } from "react";

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
  const [startYear, setStartYear] = useState<number | "">(initialValues?.start_year ?? "");
  const [endYear, setEndYear] = useState<number | "">(initialValues?.end_year ?? "");
  const [summary, setSummary] = useState(initialValues?.summary ?? "");
  const [bild, setBild] = useState<File | null>(null);

  // Subevents (UI mit id)
  const [subevents, setSubevents] = useState<SubeventUI[]>(
    (initialValues?.subevents ?? []).map((s) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...s,
    }))
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Falls initialValues später reinkommen (Edit-Page lädt serverseitig – aber good practice)
  useEffect(() => {
    if (!initialValues) return;

    if (initialValues.title !== undefined) setTitle(initialValues.title);
    if (initialValues.start_year !== undefined) setStartYear(initialValues.start_year);
    if (initialValues.end_year !== undefined) setEndYear(initialValues.end_year);
    if (initialValues.summary !== undefined) setSummary(initialValues.summary);

    if (initialValues.subevents !== undefined) {
      setSubevents(
        initialValues.subevents.map((s) => ({
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          ...s,
        }))
      );
    }
  }, [initialValues]);

  const addSubevent = () => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setSubevents((prev) => [...prev, { id, title: "", year: NaN, description: "" }]);
  };

  const removeSubevent = (id: string) => {
    setSubevents((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSubevent = <K extends keyof SubeventUI>(id: string, key: K, value: SubeventUI[K]) => {
    setSubevents((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Minimal-Validierung
    if (!title.trim()) return setError("Bitte gib einen Titel an.");
    if (startYear === "" || !Number.isFinite(startYear)) return setError("Ungültiges Start-Jahr.");
    if (endYear !== "" && !Number.isFinite(endYear)) return setError("Ungültiges End-Jahr.");


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
        JSON.stringify(subevents.map(({ id, ...rest }) => rest))
      );

      const isEdit = Boolean(eventId);
      const url = isEdit ? `/api/events/${eventId}` : "/api/events";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, { method, body: fd });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      console.log(isEdit ? "Event aktualisiert:" : "Event gespeichert:", data);
    } catch (err: any) {
      setError(err?.message ?? "Unbekannter Fehler");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="py-8 px-4 mx-auto max-w-2xl lg:py-16">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          {eventId ? "Event bearbeiten:" : "Füge neues Event hinzu:"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {/* Event Name */}
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Event Name:
              </label>
              <input
                type="text"
                id="name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Event"
                required
              />
            </div>

            {/* Dates */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:col-span-2">
              <div className="relative flex-1">
                <label htmlFor="start_year" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Von:
                </label>
                <input
                  id="start_year"
                  type="number"
                  placeholder="z.B. -44 für 44 v. Chr."
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value === "" ? "" : Number(e.target.value))}
                  className="block w-full ps-3 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base"
                />
              </div>

              <div className="text-body sm:pb-3">bis</div>

              <div className="relative flex-1">
                <label htmlFor="end_year" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Bis:
                </label>

                <input
                  id="end_year"
                  type="number"
                  placeholder="optional"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value === "" ? "" : Number(e.target.value))}
                  className="block w-full ps-3 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base"
                />
              </div>
            </div>

            {/* Error */}
            {error && <div className="sm:col-span-2 text-sm text-red-600">{error}</div>}

            {/* Summary */}
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Zusammenfassung:
              </label>
              <textarea
                id="description"
                rows={8}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Deine Beschreibung hier"
              />
            </div>

            {/* File upload */}
            <div className="sm:col-span-2">
              <label
                htmlFor="file_input"
                className="
                  flex flex-col items-center justify-center w-full h-32
                  border-2 border-dashed border-default-medium rounded-base
                  cursor-pointer bg-neutral-secondary-medium
                  hover:bg-neutral-secondary-light
                  focus-within:ring-2 focus-within:ring-brand
                  transition
                "
              >
                <p className="text-sm text-heading">
                  <span className="font-semibold">Click to upload</span> or drag & drop
                </p>

                {bild ? (
                  <p className="text-xs mt-2 text-body">
                    Ausgewählt: <span className="font-medium">{bild.name}</span>
                  </p>
                ) : (
                  <p className="text-xs text-body mt-1">SVG, PNG, JPG or GIF (MAX. 800×400px)</p>
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
                <p className="text-xs mt-2 text-gray-400">
                  Hinweis: Beim Bearbeiten kann man ein neues Bild hochladen (überschreibt das alte).
                </p>
              )}
            </div>

            {/* SUBEVENTS */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Subevents</h3>

                <button
                  type="button"
                  onClick={addSubevent}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900"
                >
                  + Subevent hinzufügen
                </button>
              </div>

              {subevents.length === 0 ? (
                <div className="text-sm text-gray-500 italic">Noch keine Subevents hinzugefügt.</div>
              ) : (
                <div className="space-y-4">
                  {subevents.map((s, idx) => (
                    <div
                      key={s.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between mb-3">
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
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Title</label>
                          <input
                            type="text"
                            value={s.title}
                            onChange={(e) => updateSubevent(s.id, "title", e.target.value)}
                            placeholder="Titel des Subevents"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        {/* Year */}
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Jahr</label>
                          <input
                            type="number"
                            value={Number.isFinite(s.year) ? s.year : ""}
                            onChange={(e) =>
                              updateSubevent(s.id, "year", e.target.value === "" ? NaN : Number(e.target.value))
                            }
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            Beschreibung
                          </label>
                          <textarea
                            rows={4}
                            value={s.description}
                            onChange={(e) => updateSubevent(s.id, "description", e.target.value)}
                            placeholder="Beschreibung des Subevents"
                            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Speichern..." : eventId ? "Änderungen speichern" : "Hinzufügen"}
          </button>
        </form>
      </div>
    </section>
  );
}


