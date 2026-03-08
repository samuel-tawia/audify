// app/api/tts/route.ts
// POST /api/tts
//
// Converts text → audio using Gemini 2.5 Flash TTS (preview).
// Same GOOGLE_TTS_API_KEY / GEMINI_API_KEY from AI Studio — no Cloud Console needed.
//
// Gemini TTS returns raw PCM (LINEAR16, 24000Hz mono).
// We wrap it in a WAV header so the browser <audio> element can play it natively.
// Long documents are chunked at sentence boundaries and synthesized in batches.

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// ─── Voice map ────────────────────────────────────────────────────────────────
// Gemini prebuilt voices: Kore, Charon, Fenrir, Aoede, Puck, Leda, Orus, Zephyr

const VOICE_MAP: Record<string, { name: string; style: string }> = {
  "neural":       { name: "Kore",   style: "Clear, natural, and professional." },
  "male-deep":    { name: "Charon", style: "Deep, rich baritone. Authoritative and steady." },
  "female-clear": { name: "Aoede",  style: "Crisp and articulate. Clear and engaging." },
  "british-warm": { name: "Fenrir", style: "Warm and refined. Measured British cadence." },
  "slow-study":   { name: "Leda",   style: "Calm and clear. Slow deliberate pace, ideal for studying and note-taking." },
};

const DEFAULT_VOICE = VOICE_MAP["neural"];

// ─── Schema ───────────────────────────────────────────────────────────────────

const ttsRequestSchema = z.object({
  text:  z.string().min(1).max(500_000),
  voice: z.string().default("neural"),
  speed: z.number().min(0.25).max(4.0).default(1.0),
});

// ─── Chunking ─────────────────────────────────────────────────────────────────

function splitIntoChunks(text: string, maxChars = 3000): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+|\S[^.!?]*/g) ?? [text];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars) {
      if (current.trim()) chunks.push(current.trim());
      if (sentence.length > maxChars) {
        for (let i = 0; i < sentence.length; i += maxChars) {
          chunks.push(sentence.slice(i, i + maxChars));
        }
        current = "";
      } else {
        current = sentence;
      }
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ─── WAV header builder ───────────────────────────────────────────────────────
// Wraps raw PCM bytes (LINEAR16, 24000Hz, mono) into a valid WAV container.

function buildWavBuffer(pcmChunks: Buffer[]): Buffer {
  const pcm           = Buffer.concat(pcmChunks);
  const sampleRate    = 24000;
  const numChannels   = 1;
  const bitsPerSample = 16;
  const byteRate      = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign    = numChannels * (bitsPerSample / 8);
  const dataSize      = pcm.length;
  const buf           = Buffer.alloc(44 + dataSize);
  let o               = 0;

  buf.write("RIFF", o); o += 4;
  buf.writeUInt32LE(36 + dataSize, o); o += 4;
  buf.write("WAVE", o); o += 4;
  buf.write("fmt ", o); o += 4;
  buf.writeUInt32LE(16, o);           o += 4;
  buf.writeUInt16LE(1, o);            o += 2;  // PCM
  buf.writeUInt16LE(numChannels, o);  o += 2;
  buf.writeUInt32LE(sampleRate, o);   o += 4;
  buf.writeUInt32LE(byteRate, o);     o += 4;
  buf.writeUInt16LE(blockAlign, o);   o += 2;
  buf.writeUInt16LE(bitsPerSample, o); o += 2;
  buf.write("data", o); o += 4;
  buf.writeUInt32LE(dataSize, o);     o += 4;
  pcm.copy(buf, o);

  return buf;
}

// ─── Single chunk synthesis ───────────────────────────────────────────────────

async function synthesizeChunk(
  text: string,
  voiceName: string,
  style: string,
  genAI: GoogleGenerativeAI,
): Promise<Buffer> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (model as any).generateContent({
    contents: [{ parts: [{ text: `${style}\n\n${text}` }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const part    = result?.response?.candidates?.[0]?.content?.parts?.[0];
  const base64  = part?.inlineData?.data;
  if (!base64) throw new Error("No audio data returned from Gemini TTS");

  return Buffer.from(base64, "base64");
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = ttsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_TTS_API_KEY ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GOOGLE_TTS_API_KEY is not set in .env.local" },
        { status: 500 }
      );
    }

    const { text, voice } = parsed.data;
    const voiceConfig     = VOICE_MAP[voice] ?? DEFAULT_VOICE;
    const chunks          = splitIntoChunks(text);
    const genAI           = new GoogleGenerativeAI(apiKey);

    // Synthesize in batches of 5 to stay within rate limits
    const BATCH_SIZE  = 5;
    const pcmBuffers: Buffer[] = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch   = chunks.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((chunk) => synthesizeChunk(chunk, voiceConfig.name, voiceConfig.style, genAI))
      );
      pcmBuffers.push(...results);
    }

    const wavBuffer       = buildWavBuffer(pcmBuffers);
    const audioBase64     = wavBuffer.toString("base64");
    // 24000 samples/sec × 2 bytes/sample = 48000 bytes/sec
    const durationSeconds = Math.round(
      pcmBuffers.reduce((acc, b) => acc + b.length, 0) / 48000
    );

    return NextResponse.json({
      success: true,
      audioBase64,
      durationSeconds,
      mimeType: "audio/wav",
    });
  } catch (error) {
    console.error("[POST /api/tts]", error);
    const msg      = error instanceof Error ? error.message : "TTS failed";
    const isQuota  = msg.includes("429") || msg.toLowerCase().includes("quota");

    return NextResponse.json(
      {
        success: false,
        error: isQuota
          ? "Gemini TTS rate limit reached. Wait a moment and try again."
          : msg,
      },
      { status: 500 }
    );
  }
}
