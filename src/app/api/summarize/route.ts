// app/api/summarize/route.ts
// POST /api/summarize
//
// Uses Google Gemini 1.5 Flash to generate:
//   - A flowing text summary (3-4 paragraphs)
//   - 4-6 structured key points
//
// Uses GOOGLE_TTS_API_KEY (same Google AI Studio key works for both TTS and Gemini).
// Falls back to GEMINI_API_KEY if present for backwards compatibility.

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { summarizeRequestSchema } from "@/lib/schemas";
import { generateId } from "@/lib/utils";

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(fileName: string, wordCount: number, text: string): string {
  return `
You are an expert academic summarizer. Analyze the document below and produce a structured summary optimized for audio learning.

Document: "${fileName}"
Word count: ${wordCount}

Content:
${text}

Return ONLY a raw JSON object — no markdown fences, no preamble, no trailing text. Just the JSON:
{
  "textSummary": "A flowing 3-4 paragraph summary written as if narrating to a student. Clear and engaging.",
  "keyPoints": [
    { "index": 1, "title": "Short descriptive title", "body": "1-2 sentence elaboration." },
    { "index": 2, "title": "Short descriptive title", "body": "1-2 sentence elaboration." }
  ],
  "wordCount": ${wordCount},
  "readingTimeMinutes": ${Math.ceil(wordCount / 200)}
}

Include exactly 4-6 key points. Be precise and educational. No filler phrases.
`.trim();
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = summarizeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Accept either key — same Google AI Studio key works for both Gemini and Cloud TTS
    const apiKey = process.env.GOOGLE_TTS_API_KEY ?? process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No API key found. Add GOOGLE_TTS_API_KEY to your .env.local file. " +
            "Get a free key at https://aistudio.google.com/app/apikey",
        },
        { status: 500 }
      );
    }

    const { audioId, extractedText, fileName } = parsed.data;
    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.ceil(wordCount / 200);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const prompt = buildPrompt(
      fileName,
      wordCount,
      extractedText.slice(0, 10000)
    );

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    const summaryData = JSON.parse(cleanJson);

    const summary = {
      id: generateId(),
      audioId,
      textSummary: summaryData.textSummary ?? "",
      keyPoints: Array.isArray(summaryData.keyPoints) ? summaryData.keyPoints : [],
      wordCount: summaryData.wordCount ?? wordCount,
      readingTimeMinutes: summaryData.readingTimeMinutes ?? readingTimeMinutes,
      generatedAt: Date.now(),
    };

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("[POST /api/summarize]", error);

    const msg = error instanceof Error ? error.message : "";
    const isQuota = msg.includes("429") || msg.toLowerCase().includes("quota");

    return NextResponse.json(
      {
        success: false,
        error: isQuota
          ? "Gemini rate limit reached. Wait 60 seconds and try again."
          : "Summary generation failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
