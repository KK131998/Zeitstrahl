// app/admin/persons/[id]/edit/page.tsx
import PersonForm from "@/components/PersonForm";
import { getPersonWithAchievements } from "@/lib/data";

function toNumberOrUndefined(v: any): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function Page(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { person, achievements } = await getPersonWithAchievements(id);

  return (
    <main className="min-h-screen bg-gray-900 px-4 py-16 text-white">
      <PersonForm
        personId={id}
        initialValues={{
          name: person.name ?? "",
          born: toNumberOrUndefined(person.born),
          died: toNumberOrUndefined(person.died),
          bio: person.bio ?? "",
          achievements: achievements.map((a) => ({
            title: a.title ?? "",
            year: Number(a.year ?? NaN),
            description: a.description ?? "",
          })),
        }}
      />
    </main>
  );
}
