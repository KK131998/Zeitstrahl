import { GoogleGenAI } from "@google/genai";

export type CardDraft = { question: string; answer: string };

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, // oder leer lassen, wenn env gesetzt
});

export async function generateCards(context: string): Promise<CardDraft[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY fehlt in .env.local");
  }

  // JSON Schema: Gemini kann Structured Outputs strikt an Schema binden. :contentReference[oaicite:3]{index=3}
  const responseSchema = {
    type: "object",
    properties: {
      cards: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
          required: ["question", "answer"],
        },
      },
    },
    required: ["cards"],
    additionalProperties: false,
  } as const;

  const resp = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "Erstelle Lernkarten (Frage/Antwort) für ein Spaced-Repetition-System.\n" +
              "Regeln: kurze, eindeutige Faktenfragen; keine Trickfragen; keine Duplikate; " +
              "nur Informationen verwenden, die im CONTEXT stehen.\n" +
              "Erstelle 3–5 Basisfragen. Wenn Achievements/Unterpunkte vorhanden sind, zusätzlich 2–3 dazu.\n\n" +
              'Antworte AUSSCHLIESSLICH mit gültigem JSON im Schema {"cards":[{"question":"...","answer":"..."}]} – ohne erklärenden Text.' +
              "\n\n" +
              "CONTEXT:\n" +
              context,
          },
        ],
      },
    ],
    // Structured output:
    // In vielen Google-Beispielen heißt das Feld responseSchema/responseMimeType oder wird über config gesetzt;
    // die Doku dazu ist "Structured Outputs". :contentReference[oaicite:4]{index=4}
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  } as any);

  const text = resp.text;
  if (!text) throw new Error("Gemini API: Antwort ohne Text erhalten");

  // 1) Versuch: direktes JSON
  try {
    const data = JSON.parse(text) as { cards: CardDraft[] };
    return data.cards;
  } catch {
    // 2) Fallback: JSON-Block aus Text extrahieren
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error(
        "Gemini API: Kein JSON im Output gefunden: " + text.slice(0, 200),
      );
    }

    const jsonSlice = text.slice(start, end + 1);
    const data = JSON.parse(jsonSlice) as { cards: CardDraft[] };
    return data.cards;
  }
}
