import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGemini() {
  if (!process.env.GEMINI_API_KEY) throw new Error("Thiếu GEMINI_API_KEY");
  return (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));
}