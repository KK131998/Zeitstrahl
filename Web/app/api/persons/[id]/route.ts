// app/api/persons/[id]/route.ts
import { NextResponse } from "next/server";
import { updatePersonWithAchievements } from "@/lib/data";

type IncomingAchievement = {
  title: string;
  year: number;
  description: string;
};

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: personId } = await context.params;
    const formData = await req.formData();

    // Person-Daten auslesen
    const name = formData.get("name");
    const bio = formData.get("bio");
    const bornRaw = formData.get("born");
    const diedRaw = formData.get("died");
    const bild = formData.get("bild");

    const personData: any = {};
    if (typeof name === "string") personData.name = name.trim();
    if (typeof bio === "string") personData.bio = bio;

    if (bornRaw !== null && bornRaw !== "") {
      const n = Number(bornRaw);
      if (!Number.isFinite(n))
        return NextResponse.json({ error: "born ungültig" }, { status: 400 });
      personData.born = n;
    }

    if (diedRaw !== null) {
      if (diedRaw === "") {
        // Optional: falls du "died" löschen willst
        personData.died = null;
      } else {
        const n = Number(diedRaw);
        if (!Number.isFinite(n))
          return NextResponse.json({ error: "died ungültig" }, { status: 400 });
        personData.died = n;
      }
    }

    if (bild instanceof File) personData.bild = bild;

    // Achievements JSON auslesen (FormKey bleibt: person_achievements)
    const rawAchievements = formData.get("person_achievements");
    let incoming: IncomingAchievement[] = [];

    if (typeof rawAchievements === "string") {
      try {
        const parsed = JSON.parse(rawAchievements);
        if (!Array.isArray(parsed)) throw new Error();
        incoming = parsed;
      } catch {
        return NextResponse.json(
          { error: "person_achievements ist kein gültiges JSON Array" },
          { status: 400 }
        );
      }
    }

    // auf DB-Schema mappen (year bleibt year)
    const achievements = incoming.map((a) => ({
      title: a.title,
      description: a.description,
      year: a.year,
    }));

    const result = await updatePersonWithAchievements(personId, personData, achievements);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("PATCH /api/persons/[id] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Person Update fehlgeschlagen", data: err?.data },
      { status: 500 }
    );
  }
}
