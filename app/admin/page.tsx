"use client";

import { useState, useEffect, FormEvent } from "react";
import pb from "../../lib/pocketbase"; // ggf. Pfad anpassen: "../lib/pocketbase" wenn admin direkt unter app liegt

type Tab = "eras" | "persons" | "events";
import ErasList from "../components/Eraslist";
import PersonList from "../components/Personlist";
import EventList from "../components/Eventlist";

import Link from "next/link";

export default function AdminPage() {
    const [tab, setTab] = useState<Tab>("persons");
    const [hydrated, setHydrated] = useState(false);
    const [loggedIn, setLoggedIn] = useState(false);

    // Login-State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        setHydrated(true);
        setLoggedIn(pb.authStore.isValid);
    }, []);

    if (!hydrated) {
        return (
            <main className="min-h-screen bg-gray-900 px-4 py-16 text-white">
                <div className="max-w-sm mx-auto text-gray-300">Lade…</div>
            </main>
        );
    }

    async function handleLogin(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoginError(null);
        setIsLoggingIn(true);

        try {
            // ⬇️ Wichtig: Das ist der normale User-Login (nicht Admin!)
            await pb.collection("users").authWithPassword(email, password);
            setLoggedIn(true);
        } catch (err: any) {
            console.error(err);
            setLoginError(err?.message ?? "Login fehlgeschlagen");
        } finally {
            setIsLoggingIn(false);
        }
    }

    function handleLogout() {
        pb.authStore.clear();
        setLoggedIn(false);
    }

    // 🔒 Wenn NICHT eingeloggt → nur Login-Form anzeigen
    if (!loggedIn) {
        return (
            <main className="min-h-screen bg-gray-900 px-4 py-16 text-white">

                <section className="bg-gray-50 dark:bg-gray-900 w-full">
                    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                        <a
                            href="#"
                            className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
                        >
                            <img
                                className="w-8 h-8 mr-2"
                                src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/logo.svg"
                                alt="logo"
                            />
                            Admin
                        </a>
                        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                                <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                                    Sign in to your account
                                </h1>

                                {loginError && (
                                    <p className="text-sm text-red-400">{loginError}</p>
                                )}

                                <form
                                    className="space-y-4 md:space-y-6"
                                    onSubmit={handleLogin}
                                >
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Your email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            placeholder="name@example.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="password"
                                            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                        >
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            id="password"
                                            placeholder="••••••••"
                                            className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoggingIn}
                                        className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:opacity-60"
                                    >
                                        {isLoggingIn ? "Signing in..." : "Sign in"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    // ✅ Eingeloggt → Admin-Bereich mit Tabs
    return (
        <main className="min-h-screen bg-gray-900 px-4 py-16 text-white">
            <section className="bg-white dark:bg-gray-900">
                <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
                    <div className="mx-auto max-w-screen-sm text-center">
                        <h2 className="mb-4 text-4xl tracking-tight font-extrabold leading-tight text-gray-900 dark:text-white">
                            Admin Bereich
                        </h2>
                    </div>
                </div>
            </section>
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-sm font-medium text-center border-b border-gray-700">
                    <ul className="flex flex-wrap -mb-px">
                        <li className="me-2">
                            <button
                                type="button"
                                onClick={() => setTab("eras")}
                                className={`inline-flex items-center px-4 py-3 rounded-t-lg border-b-2 transition-colors ${tab === "eras"
                                    ? "text-blue-400 border-blue-400 bg-gray-800 font-semibold"
                                    : "text-gray-400 border-transparent hover:text-blue-300 hover:border-blue-300"
                                    }`}
                            >
                                Eras
                            </button>
                        </li>

                        <li className="me-2">
                            <button
                                type="button"
                                onClick={() => setTab("persons")}
                                className={`inline-flex items-center px-4 py-3 rounded-t-lg border-b-2 transition-colors ${tab === "persons"
                                    ? "text-blue-400 border-blue-400 bg-gray-800 font-semibold"
                                    : "text-gray-400 border-transparent hover:text-blue-300 hover:border-blue-300"
                                    }`}
                            >
                                Personen
                            </button>
                        </li>

                        <li className="me-2">
                            <button
                                type="button"
                                onClick={() => setTab("events")}
                                className={`inline-flex items-center px-4 py-3 rounded-t-lg border-b-2 transition-colors ${tab === "events"
                                    ? "text-blue-400 border-blue-400 bg-gray-800 font-semibold"
                                    : "text-gray-400 border-transparent hover:text-blue-300 hover:border-blue-300"
                                    }`}
                            >
                                Events
                            </button>
                        </li>
                        <li className="me-2 ml-auto">
                            <Link
                                href={`/admin/${tab}/new`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-30 h-10 px-4 rounded-base text-sm font-medium leading-none text-heading bg-blue border border-white hover:bg-sky-900"
                            >
                                Neu erstellen
                            </Link>
                        </li>

                    </ul>

                </div>




                {/* Inhalt je nach Tab */}
                {/* Inhalt */}
                <div className="pt-4">
                    {tab === "eras" && <ErasList />}
                    {tab === "persons" && <PersonList />}
                    {tab === "events" && <EventList />}
                </div>
            </div>

        </main>

    );
}

/* --- ab hier kannst du deine bestehenden Formulare einbauen --- */

function PersonForm() {
    // hier kommt im Grunde der Code aus deiner bisherigen Admin-Person-Seite rein
    return <div>Formular für Personen</div>;
}

function EventForm() {
    // später: pb.collection("events").create(...)
    return <div>Formular für Events</div>;
}

function EraForm() {
    // später: pb.collection("eras").create(...)
    return <div>Formular für Epochen</div>;
}
