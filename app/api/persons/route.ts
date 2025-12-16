import PocketBase from "pocketbase";

export async function POST(req: Request) {
  try {
    const pb = new PocketBase(process.env.POCKETBASE_URL);

    await pb.collection("_superusers").authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );

    const incoming = await req.formData();

    // Subevents separat lesen
    const subeventsRaw = incoming.get("subevents");
    incoming.delete("subevents");

    // 0) Startjahr aus dem Hauptevent holen (NUMBER, z.B. -44, 1998)
    const startRaw = incoming.get("start_year")?.toString();
    const startYear = Number(startRaw);

    if (!Number.isFinite(startYear)) {
      return Response.json(
        { error: "start_year muss eine Zahl sein (z.B. -44, 1998)." },
        { status: 400 }
      );
    }

    // 1) passende Era finden (Number-Vergleich)
    let eraId: string | null = null;
    try {
      const era = await pb.collection("eras").getFirstListItem(
        `start_year <= ${startYear} && end_year >= ${startYear}`
      );
      eraId = era.id;
    } catch { }

    // 2) Event-Form bauen (nur Event-Felder)
    const eventForm = new FormData();
    for (const [key, value] of incoming.entries()) {
      eventForm.append(key, value);
    }

    // 3) Era-Relation setzen (falls gefunden)
    if (eraId) eventForm.set("era_id", eraId);

    // 4) Hauptevent erstellen
    const event = await pb.collection("events").create(eventForm);

    if (!event?.id) {
      return Response.json(
        { error: "Event wurde nicht erstellt (keine id)." },
        { status: 500 }
      );
    }

    // 5) Subevents erstellen (optional) — mit year:number
    if (typeof subeventsRaw === "string" && subeventsRaw.trim()) {
      const subevents = JSON.parse(subeventsRaw) as Array<{
        title: string;
        year: number;
        description: string;
      }>;

      await Promise.all(
        subevents.map((s) =>
          pb.collection("subevents").create({
            event_id: event.id,
            title: s.title,
            year: s.year,
            description: s.description,
          })
        )
      );
    }

    return Response.json({ eventId: event.id, eraId });
  } catch (err: any) {
    const message =
      err?.data ? JSON.stringify(err.data) : err?.message ?? "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
