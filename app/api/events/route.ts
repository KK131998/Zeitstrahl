import PocketBase from "pocketbase";

export async function POST(req: Request) {
  try {
    const pb = new PocketBase(process.env.POCKETBASE_URL);

    await pb.collection("_superusers").authWithPassword(
      process.env.POCKETBASE_ADMIN_EMAIL!,
      process.env.POCKETBASE_ADMIN_PASSWORD!
    );

    const incoming = await req.formData();
    console.log(incoming);

    // Subevents separat lesen
    const subeventsRaw = incoming.get("subevents");
    incoming.delete("subevents");

    // 0) Startdatum aus dem Hauptevent holen (dein Feld heißt start_year)
    const startDate = incoming.get("start_year")?.toString(); // z.B. "1998-01-01"
    if (!startDate) {
      return Response.json({ error: "start_year fehlt." }, { status: 400 });
    }

    // 1) passende Era finden (Date-Felder vergleichen)
    // ⚠️ falls deine Era-Felder anders heißen, hier anpassen
    const era = await pb.collection("eras").getFirstListItem(
      `start_year <= "${startDate}" && end_year >= "${startDate}"`
    );

    // 2) Event-Form bauen (nur Event-Felder)
    const eventForm = new FormData();
    for (const [key, value] of incoming.entries()) {
      eventForm.append(key, value);
    }

    // 3) Era-Relation setzen (⚠️ Feldname im events-Schema ggf. anpassen)
    eventForm.set("era_id", era.id);

    // 4) Hauptevent erstellen
    const event = await pb.collection("events").create(eventForm);

    if (!event?.id) {
      return Response.json(
        { error: "Event wurde nicht erstellt (keine id)." },
        { status: 500 }
      );
    }

    // 5) Subevents erstellen (optional)
    if (typeof subeventsRaw === "string" && subeventsRaw.trim()) {
      const subevents = JSON.parse(subeventsRaw) as Array<{
        title: string;
        date: string;
        description: string;
      }>;

      await Promise.all(
        subevents.map((s) =>
          pb.collection("subevents").create({
            event_id: event.id,
            title: s.title,
            date: s.date,
            description: s.description,
          })
        )
      );
    }

    return Response.json({ eventId: event.id, eraId: era.id });
  } catch (err: any) {
    const message =
      err?.data ? JSON.stringify(err.data) : err?.message ?? "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}

