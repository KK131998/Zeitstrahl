"use client";

import React, { useState } from "react";

type achievement = {
    id: string;
    title: string;
    year: number; // YYYY-MM-DD
    description: string;
};

export default function PersonForm() {
    // Main event
    const [name, setName] = useState("");
    const [born, setBorn] = useState<number | "">("");
    const [died, setDied] = useState<number | "">("");
    const [bio, setBio] = useState("");
    const [bild, setBild] = useState<File | null>(null);

    // Subevents
    const [achievements, setAchievements] = useState<achievement[]>([]);

    const addAchievement = () => {
        const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        setAchievements((prev) => [
            ...prev,
            { id, title: "", year: NaN, description: "" },
        ]);
    };

    const removeAchievement = (id: string) => {
        setAchievements((prev) => prev.filter((s) => s.id !== id));
    };

    const updateAchievement = <K extends keyof achievement>(
        id: string,
        key: K,
        value: achievement[K]
    ) => {
        setAchievements((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))
        );
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const fd = new FormData();
        fd.append("name", name);
        fd.append("born", born === "" ? "" : String(born));
        fd.append("died", died === "" ? "" : String(died));
        fd.append("bio", bio);

        if (bild) fd.append("bild", bild);

        // Subevents als JSON (ohne id)
        fd.append(
            "person_achievements",
            JSON.stringify(achievements.map(({ id, ...rest }) => rest))
        );

        const res = await fetch("/api/persons", { method: "POST", body: fd });

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
                    Füge neue Persönlichkeit hinzu:
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        {/* Event Name */}
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="name"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Name:
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Event"
                                required
                            />
                        </div>

                        {/* Dates */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:col-span-2">
                            <div className="relative flex-1">
                                <label
                                    htmlFor="born"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Geboren:
                                </label>
                                <input
                                    id="born"
                                    type="number"
                                    placeholder="z.B. -44 für 44 v. Chr."
                                    value={born}
                                    onChange={(e) => setBorn(e.target.value === "" ? "" : Number(e.target.value))}
                                    className="block w-full ps-3 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base"
                                />

                            </div>

                            <div className="text-body sm:pb-3">bis</div>

                            <div className="relative flex-1">
                                <label
                                    htmlFor="died"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Gestorben:
                                </label>


                                <input
                                    id="died"
                                    type="number"
                                    placeholder="optional"
                                    value={died}
                                    onChange={(e) => setDied(e.target.value === "" ? "" : Number(e.target.value))}
                                    className="block w-full ps-3 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="bio"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Biographie:
                            </label>
                            <textarea
                                id="bio"
                                rows={8}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
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
                                    Achievements
                                </h3>

                                <button
                                    type="button"
                                    onClick={addAchievement}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900"
                                >
                                    + Achievement hinzufügen
                                </button>
                            </div>

                            {achievements.length === 0 ? (
                                <div className="text-sm text-gray-500 italic">
                                    Noch keine Subevents hinzugefügt.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {achievements.map((s, idx) => (
                                        <div
                                            key={s.id}
                                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    Achievement {idx + 1}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => removeAchievement(s.id)}
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
                                                            updateAchievement(s.id, "title", e.target.value)
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
                                                        placeholder="z.B. -44"
                                                        onChange={(e) =>
                                                            updateAchievement(
                                                                s.id,
                                                                "year",
                                                                e.target.value === "" ? 0 : Number(e.target.value)
                                                            )
                                                        }
                                                        className="block w-full ps-3 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base"
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
                                                            updateAchievement(s.id, "description", e.target.value)
                                                        }
                                                        placeholder="Beschreibung"
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