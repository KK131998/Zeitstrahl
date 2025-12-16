"use client";

import { useEffect, useState } from "react";
import { getPersons } from "../../lib/data";

export default function PersonList() {
    const [persons, setPersons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        async function load() {
            try {
                setLoading(true);
                const data = await getPersons();
                if (!alive) return;
                setPersons(data);
            } catch (err: any) {
                // ✅ PocketBase-Abbruch ignorieren
                if (err?.isAbort) return;
                setError(err?.message ?? "Fehler beim Laden der Epochen");
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();

        return () => {
            alive = false;
        };
    }, []);


    if (loading) return <div className="text-gray-400">Lade Epochen…</div>;
    if (error) return <div className="text-red-400">{error}</div>;

    return (
        <ul className="w-full divide-y divide-default">
            {persons.map((person) => (
                <li key={person.id} className="pb-3 sm:pb-4">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-heading truncate">{person.name}</p>
                            <p className="text-sm text-body truncate">{person.born} – {person.died}</p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center m-2 w-30 h-10 px-4 rounded-base text-sm font-medium leading-none text-heading bg-blue border border-white hover:bg-sky-900"
                        >
                            Bearbeiten
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
}

