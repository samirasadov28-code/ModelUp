import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/model-store";
import { generateExcelBuffer } from "@/lib/excel-generator";
import type { ModelOutputs } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { modelId?: string; model?: ModelOutputs };

    let model: ModelOutputs | null = null;
    if (body.model && body.model.modelId) {
      model = body.model;
    } else if (body.modelId) {
      model = getModel(body.modelId);
    }

    if (!model) {
      return NextResponse.json(
        { error: "Model not found. Pass either a stored modelId or the full model in the request body." },
        { status: 404 }
      );
    }

    const buffer = await generateExcelBuffer(model);
    const safeName = (model.answers.companyName ?? "Model").replace(/[^a-z0-9_-]+/gi, "_");
    const filename = `ModelUp_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
