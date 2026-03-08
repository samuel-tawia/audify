// ─────────────────────────────────────────────────────────────────────────────
// app/api/convert/route.ts
// POST /api/convert
//
// Accepts a base64-encoded file, extracts its text content, estimates audio
// duration, and returns metadata. In production, this route would also call
// a TTS provider (ElevenLabs / OpenAI / Google Cloud TTS) and return an audioUrl.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { convertRequestSchema } from "@/lib/schemas";
import { generateId } from "@/lib/utils";

// ─── Text extractors ──────────────────────────────────────────────────────────

async function extractFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (e) {
    console.error("pdf-parse error:", e);
    return "";
  }
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (e) {
    console.error("mammoth error:", e);
    return "";
  }
}

async function extractText(buffer: Buffer, fileType: string): Promise<string> {
  switch (fileType) {
    case "pdf":
      return extractFromPdf(buffer);
    case "docx":
      return extractFromDocx(buffer);
    case "pptx":
      // Full PPTX parsing requires a dedicated library (e.g. pptx2json).
      // For now we return a placeholder that still goes through summarization.
      return "PowerPoint presentation content. Slide-by-slide extraction requires additional configuration — see README for details.";
    case "txt":
      return buffer.toString("utf-8");
    default:
      return "";
  }
}

// ─── Duration estimation ──────────────────────────────────────────────────────

function estimateDuration(text: string, voiceId: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const wpm = voiceId === "slow-study" ? 105 : 140;
  return Math.max(30, Math.round((wordCount / wpm) * 60));
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = convertRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { fileBase64, fileName, fileType, voice } = parsed.data;
    const buffer = Buffer.from(fileBase64, "base64");

    const extractedText = await extractText(buffer, fileType);
    const durationSeconds = estimateDuration(extractedText, voice);
    const audioId = generateId();

    // ── TODO: Wire up real TTS ──────────────────────────────────────────────
    // const ttsClient = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
    // const audioStream = await ttsClient.generate({ voice: "Rachel", text: extractedText });
    // const audioUrl = await uploadToStorage(audioStream, audioId);
    // ──────────────────────────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      audioId,
      fileName,
      extractedText: extractedText.slice(0, 20000), // cap payload size
      durationSeconds,
      audioUrl: "", // populated once TTS is connected
    });
  } catch (error) {
    console.error("[POST /api/convert]", error);
    return NextResponse.json(
      { success: false, error: "Conversion failed. Please try again." },
      { status: 500 }
    );
  }
}
