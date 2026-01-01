import PocketBase from "pocketbase";
import { NextResponse } from "next/server";

type IncomingAchievement = {
  title: string;
  year?: number;
  description: string;
};

export async function POST(req: Request) {
  const pb = new PocketBase(process.env.POCKETBASE_URL);

  try {
    await pb
      .collection("_superusers")
      .authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL!,
        process.env.POCKETBASE_ADMIN_PASSWORD!,
      );

    const incoming = await req.formData();

    // achievements separat lesen
    const achVal = incoming.get("person_achievements");
    const achievementsRaw = typeof achVal === "string" ? achVal : null;
    incoming.delete("person_achievements");

    // Pflichtfelder
    const name = String(incoming.get("name") ?? "").trim();
    const bornRaw = String(incoming.get("born") ?? "").trim();

    if (!name) return Response.json({ error: "name fehlt." }, { status: 400 });
    if (!bornRaw)
      return Response.json({ error: "born fehlt." }, { status: 400 });

    const born = Number(bornRaw);
    if (!Number.isFinite(born)) {
      return Response.json({ error: "born ist keine Zahl." }, { status: 400 });
    }

    // died optional — wenn leer, weglassen (PB würde sonst gern 0 machen)
    const diedRaw = String(incoming.get("died") ?? "").trim();
    if (diedRaw === "") {
      incoming.delete("died");
    } else {
      const died = Number(diedRaw);
      if (!Number.isFinite(died)) {
        return Response.json(
          { error: "died ist keine Zahl." },
          { status: 400 },
        );
      }
      incoming.set("died", String(died));
    }

    // Era finden über born
    let eraId: string | null = null;
    try {
      const era = await pb
        .collection("eras")
        .getFirstListItem(`start_year <= ${born} && end_year >= ${born}`);
      eraId = era.id;
    } catch (e: any) {
      if (e?.status === 404) {
        return Response.json(
          { error: `Keine Epoche gefunden, die born=${born} abdeckt.` },
          { status: 400 },
        );
      }
      throw e;
    }

    // Relation setzen
    if (eraId) incoming.set("era_id", eraId);

    // born als Zahl sicher setzen (PB bekommt FormData als Strings)
    incoming.set("born", String(born));

    // Person erstellen (inkl. bild File, falls vorhanden)
    const person = await pb.collection("persons").create(incoming);

    if (!person?.id) {
      return Response.json(
        { error: "Person wurde nicht erstellt (keine id)." },
        { status: 500 },
      );
    }

    // Achievements erstellen (optional)
    if (
      achievementsRaw &&
      achievementsRaw.trim() &&
      achievementsRaw.trim() !== "[]"
    ) {
      const achievements = JSON.parse(achievementsRaw) as IncomingAchievement[];

      await Promise.all(
        achievements.map((a) => {
          const title = String(a.title ?? "").trim();
          const description = String(a.description ?? "").trim();
          const year = typeof a.year === "number" ? a.year : NaN;

          if (!title) throw new Error("Achievement title fehlt.");
          if (!Number.isFinite(year) || year === 0)
            throw new Error("Achievement year fehlt/ungueltig.");
          if (!description) throw new Error("Achievement description fehlt.");

          return pb.collection("person_achievements").create({
            person_id: person.id,
            title,
            year,
            description,
          });
        }),
      );
    }

    return NextResponse.json(
      { id: person.id, personId: person.id, eraId },
      { status: 201 },
    );
  } catch (err: any) {
    const status =
      err?.status && Number.isFinite(err.status) ? err.status : 500;
    const payload = err?.data
      ? { message: err?.message ?? "PocketBase error", data: err.data }
      : { message: err?.message ?? String(err) };

    console.error("POST /api/persons failed:", { status, ...payload });
    return Response.json({ error: payload }, { status });
  }
}

export async function GET() {
  return Response.json({ ok: true, hint: "Use POST with FormData" });
}
