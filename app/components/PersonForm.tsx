"use client";

import React, { useEffect, useState } from "react";
import { Alert } from "flowbite-react";


type AchievementInput = {
  title: string;
  year: number;
  description: string;
};

type AchievementUI = AchievementInput & { id: string };

export type PersonInitialValues = Partial<{
  name: string;
  born: number;
  died: number;
  bio: string;
  achievements: AchievementInput[];
}>;

export default function PersonForm({
  personId,
  initialValues,
}: {
  personId?: string;
  initialValues?: PersonInitialValues;
}) {
  // Main person
  const [name, setName] = useState(initialValues?.name ?? "");
  const [born, setBorn] = useState<number | "">(initialValues?.born ?? "");
  const [died, setDied] = useState<number | "">(initialValues?.died ?? "");
  const [bio, setBio] = useState(initialValues?.bio ?? "");
  const [bild, setBild] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  

  // Achievements (UI mit id)
  const [achievements, setAchievements] = useState<AchievementUI[]>(
    (initialValues?.achievements ?? []).map((a) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...a,
    }))
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // initialValues nachziehen (Edit-Page)
  useEffect(() => {
    if (!initialValues) return;

    if (initialValues.name !== undefined) setName(initialValues.name);
    if (initialValues.born !== undefined) setBorn(initialValues.born);
    if (initialValues.died !== undefined) setDied(initialValues.died);
    if (initialValues.bio !== undefined) setBio(initialValues.bio);

    if (initialValues.achievements !== undefined) {
      setAchievements(
        initialValues.achievements.map((a) => ({
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          ...a,
        }))
      );
    }
  }, [initialValues]);

  const addAchievement = () => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setAchievements((prev) => [...prev, { id, title: "", year: NaN, description: "" }]);
  };

  const removeAchievement = (id: string) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAchievement = <K extends keyof AchievementUI>(
    id: string,
    key: K,
    value: AchievementUI[K]
  ) => {
    setAchievements((prev) => prev.map((a) => (a.id === id ? { ...a, [key]: value } : a)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Minimal-Validierung (wie EventForm)
    if (!name.trim()) return setError("Bitte gib einen Namen an.");
    if (born !== "" && !Number.isFinite(born)) return setError("Ungültiges Geburtsjahr.");
    if (died !== "" && !Number.isFinite(died)) return setError("Ungültiges Sterbejahr.");
    if (typeof born === "number" && typeof died === "number" && died < born)
      return setError("Gestorben darf nicht vor Geboren liegen.");

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());

      if (born !== "") fd.append("born", String(born));
      if (died !== "") fd.append("died", String(died));

      fd.append("bio", bio);

      if (bild) fd.append("bild", bild);

      // Achievements als JSON (ohne UI-id) — Feldname bleibt wie bei dir: person_achievements
      fd.append(
        "person_achievements",
        JSON.stringify(achievements.map(({ id, ...rest }) => rest))
      );

      const isEdit = Boolean(personId);
      const url = isEdit ? `/api/persons/${personId}` : "/api/persons";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, { method, body: fd });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setSuccess(personId ? "Änderungen wurden gespeichert." : "Eintrag wurde erstellt.");

      console.log(isEdit ? "Person aktualisiert:" : "Person gespeichert:", data);
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
          {personId ? "Persönlichkeit bearbeiten:" : "Füge neue Persönlichkeit hinzu:"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {/* Name */}
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Name:
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Name"
                required
              />
            </div>

            {/* Dates */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:col-span-2">
              <div className="relative flex-1">
                <label htmlFor="born" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Geboren:
                </label>
                <input
                  id="born"
                  type="number"
                  placeholder="z.B. -44"
                  value={born}
                  onChange={(e) => setBorn(e.target.value === "" ? "" : Number(e.target.value))}
                  className="block w-full ps-3 pe-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base"
                />
              </div>

              <div className="text-body sm:pb-3">bis</div>

              <div className="relative flex-1">
                <label htmlFor="died" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
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

            {/* Error */}
            {error && <div className="sm:col-span-2 text-sm text-red-600">{error}</div>}

            {/* Bio */}
            <div className="sm:col-span-2">
              <label htmlFor="bio" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Biographie:
              </label>
              <textarea
                id="bio"
                rows={8}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Die Biographie der Persönlichkeit..."
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

              {personId && (
                <p className="text-xs mt-2 text-gray-400">
                  Hinweis: Beim Bearbeiten kann man ein neues Bild hochladen (überschreibt das alte).
                </p>
              )}
            </div>

            {/* ACHIEVEMENTS */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Achievements</h3>

                <button
                  type="button"
                  onClick={addAchievement}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900"
                >
                  + Achievement hinzufügen
                </button>
              </div>

              {achievements.length === 0 ? (
                <div className="text-sm text-gray-500 italic">Noch keine Achievements hinzugefügt.</div>
              ) : (
                <div className="space-y-4">
                  {achievements.map((a, idx) => (
                    <div
                      key={a.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          Achievement {idx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeAchievement(a.id)}
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
                            value={a.title}
                            onChange={(e) => updateAchievement(a.id, "title", e.target.value)}
                            placeholder="Titel des Achievements"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        {/* Year */}
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Jahr</label>
                          <input
                            type="number"
                            value={Number.isFinite(a.year) ? a.year : ""}
                            placeholder="z.B. -44"
                            onChange={(e) =>
                              updateAchievement(a.id, "year", e.target.value === "" ? NaN : Number(e.target.value))
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
                            value={a.description}
                            onChange={(e) => updateAchievement(a.id, "description", e.target.value)}
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
          {success && (
          <Alert color="success" className="sm:col-span-2 mt-4">
              <span className="font-medium">Erfolg!</span> {success}
          </Alert>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Speichern..." : personId ? "Änderungen speichern" : "Hinzufügen"}
          </button>
        </form>
      </div>
    </section>
  );
}
