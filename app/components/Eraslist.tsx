"use client";

import { useEffect, useState } from "react";
import { getEras } from "../../lib/data";

export default function ErasList() {
    const [eras, setEras] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        async function load() {
            try {
                setLoading(true);
                const data = await getEras();
                if (!alive) return;
                setEras(data);
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
            {eras.map((era) => (
                <li key={era.id} className="pb-3 sm:pb-4">
                    <div className="flex items-center justify-between w-full">
                        <div>
                            <p className="text-sm font-medium text-heading">
                                {era.name}
                            </p>
                            <p className="text-sm text-body">
                                {era.start_year} – {era.end_year}
                            </p>
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

