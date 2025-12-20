// app/admin/events/[id]/edit/page.tsx
import EventForm from "@/components/EventForm";
import { getEventWithSubevents } from "@/lib/data";

function toNumberOrUndefined(v: any): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function Page(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { event, subevents } = await getEventWithSubevents(id);

  return (
    <main className="min-h-screen bg-gray-900 px-4 py-16 text-white">
      <EventForm
        eventId={id}
        initialValues={{
          title: event.title ?? "",
          start_year: toNumberOrUndefined(event.start_year),
          end_year: toNumberOrUndefined(event.end_year),
          summary: event.summary ?? "",
          subevents: subevents.map((s) => ({
            title: s.title ?? "",
            year: Number(s.year ?? NaN),
            description: s.description ?? "",
          })),
        }}
      />
    </main>
  );
}