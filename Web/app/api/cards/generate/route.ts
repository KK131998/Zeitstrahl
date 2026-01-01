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

    contextText = `
TYPE: PERSON
Name: ${p.name}
Geburtsjahr: ${p.born ?? ""}
Sterbejahr: ${p.died ?? ""}
Biografie: ${p.bio ?? ""}

Achievements:
${(p.achievements ?? [])
  .map(
    (a) =>
      `- ${a.title}` +
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

    contextText = `
TYPE: EVENT
Titel: ${e.title}
Zeitraum: ${e.start_year ?? ""}${e.end_year ? `–${e.end_year}` : ""}
Ort: ${e.place ?? ""}
Beschreibung: ${e.summary ?? ""}

Unterpunkte:
${(e.subevents ?? [])
  .map(
    (a) =>
      `- ${a.title}` +
      `${a.year ? ` (${a.year})` : ""}` +
      `${a.description ? `: ${a.description}` : ""}`,
  )
  .join("\n")}
`.trim();
  } else {
    return NextResponse.json(
      { error: "type muss 'person' oder 'event' sein" },
      { status: 400 },
    );
  }

  // --- KI Karten generieren ---
  let cards;
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
      ...link, // person_id ODER event_id
    });

    ids.push(created.id);
  }

  return NextResponse.json({ ok: true, created: ids.length, ids });
}
