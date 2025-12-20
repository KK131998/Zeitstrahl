// app/api/events/[id]/route.ts
import { NextResponse } from "next/server";
import { updateEventWithSubevents } from "@/lib/data";

type IncomingSubevent = {
  title: string;
  year: number;
  description: string;
};

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const formData = await req.formData();

    // Event-Daten auslesen
    const title = formData.get("title");
    const summary = formData.get("summary");
    const startRaw = formData.get("start_year");
    const endRaw = formData.get("end_year");
    const bild = formData.get("bild");

    const eventData: any = {};
    if (typeof title === "string") eventData.title = title.trim();
    if (typeof summary === "string") eventData.summary = summary;

    if (startRaw !== null && startRaw !== "") {
      const n = Number(startRaw);
      if (!Number.isFinite(n))
        return NextResponse.json({ error: "start_year ungültig" }, { status: 400 });
      eventData.start_year = n;
    }

    if (endRaw !== null) {
      if (endRaw === "") eventData.end_year = null;
      else {
        const n = Number(endRaw);
        if (!Number.isFinite(n))
          return NextResponse.json({ error: "end_year ungültig" }, { status: 400 });
        eventData.end_year = n;
      }
    }

    if (bild instanceof File) eventData.bild = bild;

    // Subevents JSON auslesen
    const rawSubevents = formData.get("subevents");
    let incoming: IncomingSubevent[] = [];

    if (typeof rawSubevents === "string") {
      try {
        const parsed = JSON.parse(rawSubevents);
        if (!Array.isArray(parsed)) throw new Error();
        incoming = parsed;
      } catch {
        return NextResponse.json(
          { error: "subevents ist kein gültiges JSON Array" },
          { status: 400 }
        );
      }
    }

    // auf dein DB-Schema mappen: year -> date
    const subevents = incoming.map((s) => ({
      title: s.title,
      description: s.description,
      date: s.year,
    }));

    const result = await updateEventWithSubevents(eventId, eventData, subevents);

    return NextResponse.json(result);
} catch (err: any) {
  console.error("PATCH /api/events/[id] error:", err);
  return NextResponse.json(
    { error: err?.message ?? "Event Update fehlgeschlagen", data: err?.data },
    { status: 500 }
  );
}
}
