"use client";

import React, { useState } from "react";
import { start } from "repl";

type Subevent = {
    id: string;
    title: string;
    year: number; // YYYY-MM-DD
    description: string;
};

export default function EventForm() {
    // Main event
    const [title, setTitle] = useState("");
    const [start_year, setStartYear] = useState<number | "">("");
    const [end_year, setEndYear] = useState<number | "">("");
    const [summary, setSummary] = useState("");
    const [bild, setBild] = useState<File | null>(null);

    // Subevents
    const [subevents, setSubevents] = useState<Subevent[]>([]);

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

    const updateSubevent = <K extends keyof Subevent>(
        id: string,
        key: K,
        value: Subevent[K]
    ) => {
        setSubevents((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const fd = new FormData();
        fd.append("title", title);
        fd.append("start_year", start_year === "" ? "" : String(start_year));
        fd.append("end_year", end_year === "" ? "" : String(end_year));
        fd.append("summary", summary);

        if (bild) fd.append("bild", bild);

        // Subevents als JSON (ohne id)
        fd.append(
            "subevents",
            JSON.stringify(subevents.map(({ id, ...rest }) => rest))
        );

        const res = await fetch("/api/events", { method: "POST", body: fd });

        if (!res.ok) {
            console.error(await res.text());
            throw new Error("Upload fehlgeschlagen");
        }

        const data = await res.json();
        console.log("Event gespeichert:", data.eventId);
    };


    return (
        <section className="bg-white dark:bg-gray-900">
            <div className="py-8 px-4 mx-auto max-w-2xl lg:py-16">
                <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                    Füge neues Event hinzu:
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        {/* Event Name */}
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="name"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
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
                                <label
                                    htmlFor="start_year"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Von:
                                </label>
                                <input
                                    id="start_year"
                                    type="number"
                                    placeholder="z.B. -44 für 44 v. Chr."
                                    value={start_year}
                                    onChange={(e) => setStartYear(e.target.value === "" ? "" : Number(e.target.value))}
                                    className="block w-full ps-3 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base"
                                />

                            </div>

                            <div className="text-body sm:pb-3">bis</div>

                            <div className="relative flex-1">
                                <label
                                    htmlFor="end_year"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Gestorben:
                                </label>

                                <input
                                    id="end_year"
                                    type="number"
                                    placeholder="optional"
                                    value={end_year}
                                    onChange={(e) => setEndYear(e.target.value === "" ? "" : Number(e.target.value))}
                                    className="block w-full ps-3 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="description"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
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
                                    <p className="text-xs text-body mt-1">
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
                        </div>

                        {/* SUBEVENTS */}
                        <div className="sm:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                    Subevents
                                </h3>

                                <button
                                    type="button"
                                    onClick={addSubevent}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900"
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
                                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                        Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={s.title}
                                                        onChange={(e) =>
                                                            updateSubevent(s.id, "title", e.target.value)
                                                        }
                                                        placeholder="Titel des Subevents"
                                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    />
                                                </div>

                                                {/* Date */}
                                                <div>
                                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                                        Datum
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={Number.isFinite(s.year) ? s.year : ""}
                                                        onChange={(e) =>
                                                            updateSubevent(
                                                                s.id,
                                                                "year",
                                                                e.target.value === "" ? NaN : Number(e.target.value)
                                                            )
                                                        }
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
                                                        onChange={(e) =>
                                                            updateSubevent(s.id, "description", e.target.value)
                                                        }
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
                        className="inline-flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800"
                    >
                        Hinzufügen
                    </button>
                </form>
            </div>
        </section>
    );
}

