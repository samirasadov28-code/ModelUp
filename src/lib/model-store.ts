import type { ModelOutputs } from "./types";

// Server-side in-memory store — replaced by Supabase in production.
// Keys are model IDs (UUIDs); values are full ModelOutputs.
const store = new Map<string, ModelOutputs>();

export function saveModel(outputs: ModelOutputs): void {
  store.set(outputs.modelId, outputs);
}

export function getModel(id: string): ModelOutputs | null {
  return store.get(id) ?? null;
}

export function listModels(): ModelOutputs[] {
  return Array.from(store.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
