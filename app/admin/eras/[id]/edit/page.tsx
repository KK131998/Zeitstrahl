import EraForm from "@/components/EraForm";
import { getEra } from "@/lib/data";

export default async function Page({ params }: { params: { id: string } }) {
    const era = await getEra(params.id);

    return (
        <main className="min-h-screen bg-gray-900 px-4 py-16 text-white">
            <EraForm
                eraId={params.id}
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
