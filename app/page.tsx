// app/page.tsx
import { getEras, getEvents, getPersons } from "./lib/data";
import TimelinePage from "./pages/TimelinePage"; // gleich erstellt



export default async function Page() {
  const eras = await getEras();
  const allEvents = await getEvents();
  const allPersons = await getPersons();

  return (
    <TimelinePage
      eras={eras}
      allEvents={allEvents}
      allPersons={allPersons}
    />
  );
}
