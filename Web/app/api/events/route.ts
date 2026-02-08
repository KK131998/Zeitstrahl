import PocketBase from "pocketbase";

type IncomingSubevent = {
  title: string;
  start_year?: number;
  end_year?: number;
  description: string;
};

export async function POST(req: Request) {
  const pb = new PocketBase(process.env.POCKETBASE_URL);
  pb.autoCancellation(false);
  try {
    // 1) Admin Login
    await pb
      .collection("_superusers")
      .authWithPassword("klaus.keisers@web.de", "CS49tenple!");

    // 2) FormData lesen
    const incoming = await req.formData();

    console.log("INCOMING FORM DATA:");
    for (const [key, value] of incoming.entries()) {
      console.log(
        key,
        value instanceof File
          ? `[File: ${value.name}, ${value.size} bytes]`
          : JSON.stringify(value),
      );
    }

    const title = String(incoming.get("title") ?? "").trim();
    const summary = String(incoming.get("summary") ?? "").trim();
    const startRaw = String(incoming.get("start_year") ?? "").trim();
    const endRaw = String(incoming.get("end_year") ?? "").trim();

    if (endRaw === "" || endRaw === "0") {
      incoming.delete("end_year");
    } else {
      const endYear = Number(endRaw);
      if (!Number.isFinite(endYear)) {
        return Response.json(
          { error: "end_year ist keine Zahl." },
          { status: 400 },
        );
      }
      incoming.set("end_year", String(endYear));
    }

    if (!title)
      return Response.json({ error: "title fehlt." }, { status: 400 });
    if (!startRaw)
      return Response.json({ error: "start_year fehlt." }, { status: 400 });

    const startYear = Number(startRaw);
    if (!Number.isFinite(startYear)) {
      return Response.json(
        { error: "start_year ist keine Zahl." },
        { status: 400 },
      );
    }

    const endYear = endRaw === "" ? null : Number(endRaw);
    if (endYear !== null && !Number.isFinite(endYear)) {
      return Response.json(
        { error: "end_year ist keine Zahl." },
        { status: 400 },
      );
    }

    // 3) Subevents separat lesen (FormData enthält es als string)
    const subeventsVal = incoming.get("subevents");
    const subeventsRaw = typeof subeventsVal === "string" ? subeventsVal : null;
    incoming.delete("subevents");

    // 4) passende Era finden (NUMBER Vergleich, ohne Quotes)
    let era: any;
    try {
      era = await pb
        .collection("eras")
        .getFirstListItem(
          `start_year <= ${startYear} && end_year >= ${startYear}`,
        );
    } catch (e: any) {
      // PocketBase wirft bei "nichts gefunden" 404
      if (e?.status === 404) {
        return Response.json(
          {
            error: `Keine Epoche gefunden, die start_year=${startYear} abdeckt.`,
          },
          { status: 400 },
        );
      }
      throw e;
    }

    // 5) Event anlegen
    // PocketBase create kann FormData direkt nehmen (inkl. Datei)
    // Aber wir setzen zusätzlich era_id.
    incoming.set("era_id", era.id);

    // optional: falls du sicherstellen willst, dass Zahlen als Number gespeichert werden:
    incoming.set("start_year", String(startYear));
    if (endYear === null) incoming.delete("end_year");
    else incoming.set("end_year", String(endYear));

    const event = await pb.collection("events").create(incoming);

    if (!event?.id) {
      return Response.json(
        { error: "Event wurde nicht erstellt (keine id)." },
        { status: 500 },
      );
    }

    // 6) Subevents erstellen (optional)
    if (subeventsRaw && subeventsRaw.trim() && subeventsRaw.trim() !== "[]") {
      const subevents = JSON.parse(subeventsRaw) as IncomingSubevent[];

      await Promise.all(
        subevents.map((s) => {
          const title = String(s.title ?? "").trim();
          const description = String(s.description ?? "").trim();

          if (!title) throw new Error("Subevent title fehlt.");

          const payload: any = {
            event_id: event.id,
            title,
            description,
          };

          // start_year optional, aber wenn vorhanden muss es Zahl sein
          if (s.start_year !== undefined && s.start_year !== null) {
            const n = Number(s.start_year);
            if (!Number.isFinite(n))
              throw new Error("Subevent start_year ungültig.");
            payload.start_year = n;
          }

          // end_year optional
          if (s.end_year !== undefined && s.end_year !== null) {
            const n = Number(s.end_year);
            if (!Number.isFinite(n))
              throw new Error("Subevent end_year ungültig.");
            payload.end_year = n;
          }

          return pb.collection("subevents").create(payload);
        }),
      );
    }

    return Response.json({ eventId: event.id, eraId: era.id }, { status: 201 });
  } catch (err: any) {
    // PocketBase Fehler enthalten oft status + data
    const status =
      err?.status && Number.isFinite(err.status) ? err.status : 500;
    const payload = err?.data
      ? { message: err?.message ?? "PocketBase error", data: err.data }
      : { message: err?.message ?? String(err) };

    console.error("POST /api/events failed:", { status, ...payload });

    return Response.json({ error: payload }, { status });
  }
}
