import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/model-store";

export async function POST(req: NextRequest) {
  try {
    const { modelId } = await req.json();

    if (!modelId) {
      return NextResponse.json({ error: "modelId is required" }, { status: 400 });
    }

    const model = getModel(modelId);
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";

    const res = await fetch(`${pythonServiceUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: model.answers,
        model_type: model.modelType,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Python service error:", err);
      return NextResponse.json({ error: "Excel generation failed" }, { status: 502 });
    }

    const buffer = await res.arrayBuffer();
    const filename = `ModelUp_${model.answers.companyName ?? "Model"}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
