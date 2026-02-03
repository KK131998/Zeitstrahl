import { NextResponse } from "next/server";
import pb from "@/lib/pocketbase";
import { generateCards } from "@/lib/ai/generateCards";

export const runtime = "nodejs";

type Achievement = { title: string; summary?: string; year?: number };
type Subevents = { title: string; description?: string; year?: number };

type PersonPayload = {
  type: "person";
  personId: string;
  person: {
    name: string;
    born?: number;
    died?: number;
    bio?: string;
    achievements?: Achievement[];
  };
};

type EventPayload = {
  type: "event";
  eventId: string;
  event: {
    title: string;
    start_year?: number;
    end_year?: number;
    place?: string;
    summary?: string;
    subevents?: Subevents[]; // oder subevents
  };
};

type Payload = PersonPayload | EventPayload;

export async function POST(req: Request) {
  let body: Payload;

  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json(
      { error: "Ungültiger JSON-Body" },
      { status: 400 },
    );
  }

  // --- Context + Link bauen ---
  let contextText = "";
  let link: { person_id?: string; event_id?: string } = {};

  if (body.type === "person") {
    if (!body.personId || !body.person?.name) {
      return NextResponse.json(
        { error: "personId und person.name sind erforderlich" },
        { status: 400 },
      );
    }

    const p = body.person;
    link = { person_id: body.personId };

    const achievements = p.achievements ?? [];
    const totalCards = 3 + achievements.length * 2;

    contextText = `
SYSTEM / AUFGABE:
Du bist ein Lernkarten-Generator. Gib als Ausgabe ausschließlich ein JSON-Array "cards" zurück.
Jedes Element hat exakt: { "question": string, "answer": string }.
Keine zusätzlichen Felder, kein Fließtext.

WICHTIGE REGELN ZUR ANZAHL:
- Erstelle GENAU ${totalCards} Karten.
- Davon GENAU 3 Karten zur PERSON insgesamt (übergreifend, nicht auf einzelne Achievements beschränkt).
- Für JEDES Achievement GENAU 2 Karten, die sich klar auf dieses Achievement beziehen.

VARIATION (Achievements):
- Die 2 Karten pro Achievement müssen unterschiedliche Blickwinkel haben
  (z.B. Handlung/Entscheidung, Bedeutung/Wirkung, Herausforderung, Lernen/Folge).
- Keine nahezu identischen Fragen innerhalb desselben Achievements.

INHALTLICHE QUALITÄT:
- Fragen kurz, konkret, verständlich.
- Antworten präzise und nur aus dem Kontext ableitbar.
- Keine erfundenen Fakten.
- Sprache: Deutsch.

KONTEXT:
TYPE: PERSON
Name: ${p.name}
Geburtsjahr: ${p.born ?? ""}
Sterbejahr: ${p.died ?? ""}
Biografie: ${p.bio ?? ""}

ACHIEVEMENTS (in Reihenfolge, je 2 Karten):
${achievements
  .map(
    (a, idx) =>
      `${idx + 1}. ${a.title}` +
      `${a.year ? ` (${a.year})` : ""}` +
      `${a.summary ? `: ${a.summary}` : ""}`,
  )
  .join("\n")}
`.trim();
  } else if (body.type === "event") {
    if (!body.eventId || !body.event?.title) {
      return NextResponse.json(
        { error: "eventId und event.title sind erforderlich" },
        { status: 400 },
      );
    }

    const e = body.event;
    link = { event_id: body.eventId };

    const subevents = e.subevents ?? [];
    const totalCards = 3 + subevents.length * 2;

    contextText = `
SYSTEM / AUFGABE:
Du bist ein Lernkarten-Generator. Gib als Ausgabe ausschließlich ein JSON-Array "cards" zurück.
Jedes Element hat exakt: { "question": string, "answer": string }.
Keine zusätzlichen Felder, kein Fließtext.

WICHTIGE REGELN ZUR ANZAHL:
- Erstelle GENAU ${totalCards} Karten.
- Davon GENAU 3 Karten zum HAUPTEVENT.
- Für JEDES Subevent GENAU 2 Karten nur zu diesem Subevent.

INHALTLICHE QUALITÄT:
- Fragen kurz, konkret, verständlich.
- Antworten präzise, nur aus dem Kontext ableitbar; keine erfundenen Fakten.
- Sprache: Deutsch.

KONTEXT:
TYPE: EVENT
Titel: ${e.title}
Zeitraum: ${e.start_year ?? ""}${e.end_year ? `–${e.end_year}` : ""}
Ort: ${e.place ?? ""}
Beschreibung: ${e.summary ?? ""}

SUBEVENTS (in Reihenfolge, je 2 Karten):
${subevents
  .map(
    (s, idx) =>
      `${idx + 1}. ${s.title}` +
      `${s.year ? ` (${s.year})` : ""}` +
      `${s.description ? `: ${s.description}` : ""}`,
  )
  .join("\n")}
`.trim();
  } else {
    // <<< wichtig: falls type irgendwas anderes ist
    return NextResponse.json({ error: "Unbekannter type" }, { status: 400 });
  }

  // --- KI Karten generieren ---
  let cards: Array<{ question: string; answer: string }>;
  try {
    cards = await generateCards(contextText);
  } catch (e) {
    console.error("generateCards failed:", e);
    return NextResponse.json(
      { error: "Lernkarten konnten nicht generiert werden" },
      { status: 502 },
    );
  }

  // --- Speichern ---
  const dueAt = new Date().toISOString();
  const ids: string[] = [];

  for (const c of cards) {
    const q = (c.question ?? "").trim();
    const a = (c.answer ?? "").trim();
    if (!q || !a) continue;

    const created = await pb.collection("cards").create({
      question: q,
      answer: a,
      status: "new",
      due_at: dueAt,
      ...link,
    });

    ids.push(created.id);
  }

  return NextResponse.json({ ok: true, created: ids.length, ids });
}
