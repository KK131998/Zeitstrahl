// app/lib/data.ts

import pb from "./pocketbase"; // deinen PocketBase Client importieren

// -----------------------------------------------------
// A) DEINE TYPES
// -----------------------------------------------------

export type Era = {
  id: string;
  name: string;
  description?: string;
  start_year?: number;
  end_year?: number;
};

export type Event = {
  id: string;
  era_id: string;
  title: string;
  summary?: string;
  start_year?: number;
  end_year?: number;
  bild?: string;
};

export type Person = {
  id: string;
  era_id: string;
  name: string;
  bio?: string;
  description?: string;
  born?: number;
  died?: number;
  bild?: string;
};

export type Subevent = {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  year?: number;
};

export type PersonAchievement = {
  id: string;
  person_id: string;
  title: string;
  description?: string;
  year?: number;
};

// -----------------------------------------------------
// B) MAPPING-FUNKTIONEN (PocketBase Record → Deine Types)
// -----------------------------------------------------

function mapEra(record: any): Era {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    start_year: record.start_year,
    end_year: record.end_year,
  };
}

function mapEvent(record: any): Event {
  return {
    id: record.id,
    era_id: record.era_id,
    title: record.title,
    summary: record.summary,
    start_year: record.start_year,
    end_year: record.end_year,
    bild: record.bild,
  };
}

function mapPerson(record: any): Person {
  return {
    id: record.id,
    era_id: record.era_id,
    name: record.name,
    bio: record.bio,
    description: record.description,
    born: record.born,
    died: record.died,
    bild: record.bild,
  };
}

function mapSubevent(record: any): Subevent {
  return {
    id: record.id,
    event_id: record.event_id,
    title: record.title,
    description: record.description,
    year: record.year,
  };
}

function mapPersonAchievement(record: any): PersonAchievement {
  return {
    id: record.id,
    person_id: record.person_id,
    title: record.title,
    description: record.description,
    year: record.year,
  };
}

// -----------------------------------------------------
// C) POCKETBASE-ABFRAGEN (mit fertigen Typen zurückgeben)
// -----------------------------------------------------

export async function getEras(): Promise<Era[]> {
  const records = await pb.collection("eras").getFullList();
  return records.map(mapEra);
}

export async function getEra(eraId: string): Promise<Era> {
  const record = await pb.collection("eras").getOne(eraId);
  return mapEra(record);
}

export async function updateEra(
  eraId: string,
  data: Partial<Pick<Era, "name" | "description" | "start_year" | "end_year">>,
): Promise<Era> {
  const record = await pb.collection("eras").update(eraId, data);
  return mapEra(record);
}

export async function getEvents(): Promise<Event[]> {
  const records = await pb.collection("events").getFullList({
    sort: "start_year", // älteste zuerst
  });
  return records.map(mapEvent);
}

export async function getPersons(): Promise<Person[]> {
  const records = await pb.collection("persons").getFullList({
    sort: "born", // älteste zuerst
  });
  return records.map(mapPerson);
}

export async function getEventWithSubevents(
  eventId: string,
): Promise<{ event: Event; subevents: Subevent[] }> {
  const eventRecord = await pb.collection("events").getOne(eventId, {
    expand: "era_id",
  });

  const subeventRecords = await pb.collection("subevents").getFullList({
    filter: `event_id = "${eventId}"`,
    sort: "year",
  });

  return {
    event: mapEvent(eventRecord),
    subevents: subeventRecords.map(mapSubevent),
  };
}

export async function updateEventWithSubevents(
  eventId: string,
  eventData: Partial<
    Pick<
      Event,
      "title" | "summary" | "start_year" | "end_year" | "bild" | "era_id"
    >
  >,
  subevents: Array<Pick<Subevent, "title" | "description" | "year">>,
): Promise<{ event: Event; subevents: Subevent[] }> {
  // 1) Event updaten
  const updatedEventRecord = await pb
    .collection("events")
    .update(eventId, eventData);

  // 2) bestehende Subevents laden (damit wir updaten/löschen können)
  const existing = await pb.collection("subevents").getFullList({
    filter: `event_id = "${eventId}"`,
    sort: "year",
  });

  // 3) upsert per Reihenfolge
  const keptIds: string[] = [];

  for (let i = 0; i < subevents.length; i++) {
    const s = subevents[i];

    // skip komplett leere Einträge
    if (!s.title?.trim()) continue;

    const payload = {
      event_id: eventId,
      title: s.title.trim(),
      description: s.description ?? "",
      year: s.year, // <-- in deiner DB heißt es date
    };

    const existingAtIndex = existing[i];

    if (existingAtIndex) {
      const upd = await pb
        .collection("subevents")
        .update(existingAtIndex.id, payload);
      keptIds.push(upd.id);
    } else {
      const created = await pb.collection("subevents").create(payload);
      keptIds.push(created.id);
    }
  }

  // 4) alles löschen, was übrig ist (wenn user Subevents entfernt hat)
  for (let i = subevents.length; i < existing.length; i++) {
    await pb.collection("subevents").delete(existing[i].id);
  }

  // 5) Final neu laden (sauber sortiert)
  const finalSubevents = await pb.collection("subevents").getFullList({
    filter: `event_id = "${eventId}"`,
    sort: "year",
  });

  return {
    event: mapEvent(updatedEventRecord),
    subevents: finalSubevents.map(mapSubevent),
  };
}

export async function getAllEventsWithSubevents() {
  const events = await getEvents();
  const result = [];

  for (const event of events) {
    const subeventRecords = await pb.collection("subevents").getFullList({
      filter: `event_id = "${event.id}"`,
      sort: "year",
    });

    result.push({
      event,
      subevents: subeventRecords.map(mapSubevent),
    });
  }

  return result;
}

export async function getPersonWithAchievements(
  personId: string,
): Promise<{ person: Person; achievements: PersonAchievement[] }> {
  const personRecord = await pb.collection("persons").getOne(personId, {
    expand: "era_id",
  });

  const achievementRecords = await pb
    .collection("person_achievements")
    .getFullList({
      filter: `person_id = "${personId}"`,
      sort: "year",
    });

  return {
    person: mapPerson(personRecord),
    achievements: achievementRecords.map(mapPersonAchievement),
  };
}

export async function updatePersonWithAchievements(
  personId: string,
  personData: Partial<
    Pick<
      Person,
      "name" | "bio" | "description" | "born" | "died" | "bild" | "era_id"
    >
  >,
  achievements: Array<
    Pick<PersonAchievement, "title" | "description" | "year">
  >,
): Promise<{ person: Person; achievements: PersonAchievement[] }> {
  // 1) Person updaten
  const updatedPersonRecord = await pb
    .collection("persons")
    .update(personId, personData);

  // 2) bestehende Achievements laden
  const existing = await pb.collection("person_achievements").getFullList({
    filter: `person_id = "${personId}"`,
    sort: "year",
  });

  // 3) upsert per Reihenfolge
  for (let i = 0; i < achievements.length; i++) {
    const a = achievements[i];

    if (!a.title?.trim()) continue;

    const payload = {
      person_id: personId,
      title: a.title.trim(),
      description: a.description ?? "",
      year: a.year,
    };

    const existingAtIndex = existing[i];

    if (existingAtIndex) {
      await pb
        .collection("person_achievements")
        .update(existingAtIndex.id, payload);
    } else {
      await pb.collection("person_achievements").create(payload);
    }
  }

  // 4) überzählige löschen
  for (let i = achievements.length; i < existing.length; i++) {
    await pb.collection("person_achievements").delete(existing[i].id);
  }

  // 5) Final neu laden
  const finalAchievements = await pb
    .collection("person_achievements")
    .getFullList({
      filter: `person_id = "${personId}"`,
      sort: "year",
    });

  return {
    person: mapPerson(updatedPersonRecord),
    achievements: finalAchievements.map(mapPersonAchievement),
  };
}

export async function getAllPersonsWithAchievements() {
  const persons = await getPersons();
  const result = [];

  for (const person of persons) {
    const achievementRecords = await pb
      .collection("person_achievements")
      .getFullList({
        filter: `person_id = "${person.id}"`,
        sort: "year",
      });

    result.push({
      person,
      achievements: achievementRecords.map(mapPersonAchievement),
    });
  }

  return result;
}
