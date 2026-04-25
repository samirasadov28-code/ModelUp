import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/model-store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const outputs = getModel(params.id);
  if (!outputs) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }
  return NextResponse.json(outputs);
}
