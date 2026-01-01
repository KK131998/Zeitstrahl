"use client";

import { useEffect, useState } from "react";
import { getPersons } from "../lib/data";
import Link from "next/link";


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

    function formatYear(year?: string | number) {
  if (year === undefined || year === null || year === "" || year === 0 || year === "0") {
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

  return num < 0
    ? `${yearString} v. Chr.`
    : `${yearString} n. Chr.`;
}



    if (loading) return <div className="text-gray-400">Lade Epochen…</div>;
    if (error) return <div className="text-red-400">{error}</div>;

    return (
        <ul className="w-full divide-y divide-default">
            {persons.map((person) => (
                <li key={person.id} className="pb-3 sm:pb-4">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-heading truncate">{person.name}</p>
                            <p className="text-sm text-body truncate">{formatYear(person.born)} – {formatYear(person.died)}</p>
                        </div>
                        <Link
                            href={`/admin/persons/${person.id}/edit`}
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

