export type AiSettings = {
  saveHistory: boolean;
};

export const DEFAULT_AI_SETTINGS: AiSettings = { saveHistory: true };

export function parseAiSettings(raw: unknown): AiSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { saveHistory: r.saveHistory === false ? false : true };
}