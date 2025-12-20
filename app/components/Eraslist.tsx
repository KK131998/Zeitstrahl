"use client";

import { useEffect, useState } from "react";
import { getEras } from "../lib/data";
import Link from "next/link";

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

    function formatYear(year?: string | number) {
    if (year === undefined || year === null || year === "" || year === 0 || year === "0") {
        return "";
    }

    const num = typeof year === "string" ? Number(year) : year;
    if (!Number.isFinite(num) || num === 0) return ""; // extra safety

    const abs = Math.abs(num);

    if (abs >= 1_000_000_000) {
        return `${(abs / 1_000_000_000).toFixed(1)} Mrd. ${num < 0 ? "v. Chr." : "n. Chr."}`;
    }
    if (abs >= 1_000_000) {
        return `${(abs / 1_000_000).toFixed(1)} Mio. ${num < 0 ? "v. Chr." : "n. Chr."}`;
    }
    return num < 0
        ? `${abs.toLocaleString("de-DE")} v. Chr.`
        : `${abs.toLocaleString("de-DE")} n. Chr.`;
}


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
                                {formatYear(era.start_year)} – {formatYear(era.end_year)}
                            </p>
                        </div>

                        <Link
                            href={`/admin/eras/${era.id}/edit`}
                            className="inline-flex items-center justify-center mr-2 mt-4 w-30 h-10 px-4 rounded-base text-sm font-medium leading-none text-heading bg-blue border border-white hover:bg-sky-900"
                        >
                            Bearbeiten
                        </Link>
                    </div>

                </li>
            ))}
        </ul>

    );
}

