import EraForm from "@/components/EraForm";
import { getEra } from "@/lib/data";

export default async function Page(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const era = await getEra(id);

  return (
    <main className="min-h-screen bg-gray-900 px-4 py-16 text-white">
      <EraForm
        eraId={id}
        initialValues={{
          name: era.name,
          start: Number(era.start_year),
          end: Number(era.end_year),
          description: era.description ?? "",
        }}
      />
    </main>
  );
}
