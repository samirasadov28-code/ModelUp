import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/model-store";
import { getModelFromDb } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const outputs = getModel(params.id) ?? (await getModelFromDb(params.id));
  if (!outputs) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }
  return NextResponse.json(outputs);
}
