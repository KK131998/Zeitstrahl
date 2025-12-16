// app/lib/data.ts

import pb from "./pocketbase";  // deinen PocketBase Client importieren

// -----------------------------------------------------
// A) DEINE TYPES
// -----------------------------------------------------

export type Era = {
    id: string;
    name: string;
    description?: string;
    start_year?: string;
    end_year?: string;
};

export type Event = {
    id: string;
    era_id: string;
    title: string;
    summary?: string;
    start_year?: string;
    end_year?: string;
    bild?: string;
};

export type Person = {
    id: string;
    era_id: string;
    name: string;
    bio?: string;
    description?: string;
    born?: string;
    died?: string;
    bild?: string;
};

export type Subevent = {
    id: string;
    event_id: string;
    title: string;
    description?: string;
    date?: string;
};

export type PersonAchievement = {
    id: string;
    person_id: string;
    title: string;
    description?: string;
    date?: string;
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
        date: record.date,
    };
}

function mapPersonAchievement(record: any): PersonAchievement {
    return {
        id: record.id,
        person_id: record.person_id,
        title: record.title,
        description: record.description,
        date: record.date,
    };
}

// -----------------------------------------------------
// C) POCKETBASE-ABFRAGEN (mit fertigen Typen zurückgeben)
// -----------------------------------------------------

export async function getEras(): Promise<Era[]> {
    const records = await pb.collection("eras").getFullList();
    return records.map(mapEra);
}

export async function getEvents(): Promise<Event[]> {
    const records = await pb.collection("events").getFullList();
    return records.map(mapEvent);
}

export async function getPersons(): Promise<Person[]> {
    const records = await pb.collection("persons").getFullList();
    return records.map(mapPerson);
}

export async function getEventWithSubevents(
    eventId: string
): Promise<{ event: Event; subevents: Subevent[] }> {
    const eventRecord = await pb.collection("events").getOne(eventId, {
        expand: "era_id",
    });

    const subeventRecords = await pb.collection("subevents").getFullList({
        filter: `event_id = "${eventId}"`,
        sort: "+date",
    });

    return {
        event: mapEvent(eventRecord),
        subevents: subeventRecords.map(mapSubevent),
    };
}

export async function getAllEventsWithSubevents() {
    const events = await getEvents();
    const result = [];

    for (const event of events) {
        const subeventRecords = await pb.collection("subevents").getFullList({
            filter: `event_id = "${event.id}"`,
            sort: "+date",
        });

        result.push({
            event,
            subevents: subeventRecords.map(mapSubevent),
        });
    }

    return result;
}

export async function getPersonWithAchievements(
    personId: string
): Promise<{ person: Person; achievements: PersonAchievement[] }> {
    const personRecord = await pb.collection("persons").getOne(personId, {
        expand: "era_id",
    });

    const achievementRecords = await pb
        .collection("person_achievements")
        .getFullList({
            filter: `person_id = "${personId}"`,
            sort: "+date",
        });

    return {
        person: mapPerson(personRecord),
        achievements: achievementRecords.map(mapPersonAchievement),
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
                sort: "+date",
            });

        result.push({
            person,
            achievements: achievementRecords.map(mapPersonAchievement),
        });
    }

    return result;
}



