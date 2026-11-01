export const AI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
export const USER_DAILY_LIMIT = Number(process.env.AI_USER_DAILY_LIMIT ?? 10);
export const GLOBAL_DAILY_LIMIT = Number(process.env.AI_GLOBAL_DAILY_LIMIT ?? 400);

export const MAX_DOC_CHARS_CONTEXT = 30_000;
export const MAX_DOC_CHARS_STORED = 100_000;
export const MAX_HISTORY_MESSAGES = 6;
export const MAX_MESSAGE_CHARS = 2000;
export const HISTORY_RETENTION_DAYS = 30;
export const MAX_SAVED_PROMPTS = 20;