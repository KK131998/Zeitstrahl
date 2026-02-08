import PocketBase from "pocketbase";

export async function POST(req: Request) {
  try {
    const pb = new PocketBase(process.env.POCKETBASE_URL);

    await pb
      .collection("_superusers")
      .authWithPassword("klaus.keisers@web.de", "CS49tenple!");

    const incoming = await req.formData();

    const name = incoming.get("name")?.toString().trim();
    const startRaw = incoming.get("start")?.toString(); // aus deinem Form: name="start"
    const endRaw = incoming.get("end")?.toString(); // aus deinem Form: name="end"
    const description = incoming.get("description")?.toString() ?? "";

    if (!name) {
      return Response.json({ error: "name fehlt." }, { status: 400 });
    }

    const start_year = Number(startRaw);
    const end_year = Number(endRaw);

    if (!Number.isFinite(start_year)) {
      return Response.json(
        { error: "start_year muss eine Zahl sein (z.B. -500, 800, 1945)." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(end_year)) {
      return Response.json(
        { error: "end_year muss eine Zahl sein (z.B. -500, 800, 1945)." },
        { status: 400 },
      );
    }

    if (end_year < start_year) {
      return Response.json(
        { error: "end_year darf nicht kleiner als start_year sein." },
        { status: 400 },
      );
    }

    // Falls deine PocketBase-Felder wirklich start_year / end_year heißen:
    const era = await pb.collection("eras").create({
      name,
      start_year,
      end_year,
      description,
    });

    if (!era?.id) {
      return Response.json(
        { error: "Era wurde nicht erstellt (keine id)." },
        { status: 500 },
      );
    }

    return Response.json({ eraId: era.id });
  } catch (err: any) {
    const message = err?.data
      ? JSON.stringify(err.data)
      : (err?.message ?? "Unknown error");
    return Response.json({ error: message }, { status: 500 });
  }
}
