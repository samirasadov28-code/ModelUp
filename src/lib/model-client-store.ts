"use client";

/**
 * Client-side model persistence via localStorage.
 * This is the primary storage mechanism for Netlify deployments where
 * serverless function instances don't share in-memory state.
 *
 * Models are stored as: localStorage["modelup_model_{id}"] = JSON string
 */

import type { ModelOutputs } from "./types";

const PREFIX = "modelup_model_";
const MAX_MODELS = 10;

export function saveModelLocally(outputs: ModelOutputs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}${outputs.modelId}`, JSON.stringify(outputs));
    pruneOldModels();
  } catch (e) {
    // Storage quota exceeded — clear oldest and retry
    clearOldestModel();
    try {
      localStorage.setItem(`${PREFIX}${outputs.modelId}`, JSON.stringify(outputs));
    } catch {
      // Give up silently
    }
  }
}

export function getModelLocally(id: string): ModelOutputs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as ModelOutputs;
  } catch {
    return null;
  }
}

export function listModelsLocally(): ModelOutputs[] {
  if (typeof window === "undefined") return [];
  const results: ModelOutputs[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (raw) results.push(JSON.parse(raw) as ModelOutputs);
    } catch {
      // Skip corrupted entries
    }
  }
  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function pruneOldModels(): void {
  const all = listModelsLocally();
  if (all.length <= MAX_MODELS) return;
  const toDelete = all.slice(MAX_MODELS);
  toDelete.forEach((m) => localStorage.removeItem(`${PREFIX}${m.modelId}`));
}

function clearOldestModel(): void {
  const all = listModelsLocally();
  if (all.length === 0) return;
  const oldest = all[all.length - 1];
  localStorage.removeItem(`${PREFIX}${oldest.modelId}`);
}
