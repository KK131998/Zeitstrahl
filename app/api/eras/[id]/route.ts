import { NextResponse } from "next/server";
import { updateEra } from "@/lib/data";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const formData = await req.formData();

    const data = {
      name: formData.get("name") as string,
      start_year: Number(formData.get("start")),
      end_year: Number(formData.get("end")),
      description: (formData.get("description") as string) ?? "",
    };

    const era = await updateEra(id, data);

    return NextResponse.json(era);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Update fehlgeschlagen" },
      { status: 500 }
    );
  }
}

