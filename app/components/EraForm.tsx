"use client";
import React, { useEffect, useState } from "react";

type EraValues = {
    name: string;
    start: number;
    end: number;
    description: string;
};

export default function EraForm({
    eraId,
    initialValues,
}: {
    eraId?: string;
    initialValues?: Partial<EraValues>;
}) {
    const [name, setName] = useState(initialValues?.name ?? "");
    const [startYear, setStartYear] = useState<number | "">(initialValues?.start ?? "");
    const [endYear, setEndYear] = useState<number | "">(initialValues?.end ?? "");
    const [description, setDescription] = useState(initialValues?.description ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Falls initialValues später reinkommen (z.B. nach fetch), States nachziehen:
    useEffect(() => {
        if (!initialValues) return;
        if (initialValues.name !== undefined) setName(initialValues.name);
        if (initialValues.start !== undefined) setStartYear(initialValues.start);
        if (initialValues.end !== undefined) setEndYear(initialValues.end);
        if (initialValues.description !== undefined) setDescription(initialValues.description);
    }, [initialValues]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) return setError("Bitte gib einen Namen an.");
        if (startYear === "" || !Number.isFinite(startYear)) return setError("Ungültiges Start-Jahr.");
        if (endYear === "" || !Number.isFinite(endYear)) return setError("Ungültiges End-Jahr.");
        if (endYear < startYear) return setError("Ende darf nicht vor Start liegen.");

        setIsSaving(true);
        try {
            const fd = new FormData();
            fd.append("name", name.trim());
            fd.append("start", String(startYear));
            fd.append("end", String(endYear));
            fd.append("description", description);

            const isEdit = Boolean(eraId);
            const url = isEdit ? `/api/eras/${eraId}` : "/api/eras";
            const method = isEdit ? "PATCH" : "POST";

            const res = await fetch(url, { method, body: fd });
            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            console.log(isEdit ? "Era aktualisiert:" : "Era gespeichert:", data);
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
                    Füge neue Epoche hinzu:
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        {/* Epochenname */}
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="name"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Epochen Name:
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                placeholder="Epoche"
                                required
                            />
                        </div>

                        {/* Dates */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            {/* Start */}
                            <div className="relative flex-1">
                                <label
                                    htmlFor="start_year"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Von:
                                </label>

                                <div className="relative">
                                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                        <svg
                                            className="w-4 h-4 !text-white"
                                            aria-hidden="true"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width={24}
                                            height={24}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke="currentColor"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
                                            />
                                        </svg>
                                    </div>

                                    <input
                                        id="start_year"
                                        type="number"
                                        placeholder="z.B. -500"
                                        value={startYear}
                                        onChange={(e) =>
                                            setStartYear(e.target.value === "" ? "" : Number(e.target.value))
                                        }
                                        className="block w-full ps-9 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body"
                                    />
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="text-body sm:pb-3">bis</div>

                            {/* End */}
                            <div className="relative flex-1">
                                <label
                                    htmlFor="end_year"
                                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                >
                                    Bis:
                                </label>

                                <div className="relative">
                                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                        <svg
                                            className="w-4 h-4 text-white"
                                            aria-hidden="true"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width={24}
                                            height={24}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke="currentColor"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
                                            />
                                        </svg>
                                    </div>

                                    <input
                                        id="end_year"
                                        type="number"
                                        placeholder="z.B. 476"
                                        value={endYear}
                                        onChange={(e) =>
                                            setEndYear(e.target.value === "" ? "" : Number(e.target.value))
                                        }
                                        className="block w-full ps-9 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="sm:col-span-2 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {/* Beschreibung */}
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="description"
                                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >
                                Beschreibung:
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={8}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                                placeholder="Deine Beschreibung hier"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-primary-700 rounded-lg focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSaving ? "Speichern..." : "Speichern"}
                    </button>
                </form>
            </div>
        </section>
    );
}
