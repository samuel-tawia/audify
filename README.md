# Audify — PDF to Audio

> Convert your lecture slides, textbooks, and documents into audio. Learn on the go.

---

## Quick Start

```bash
# 1. Install
npm install

# 2. Set up environment
cp .env.local.example .env.local
# → Add your free Gemini API key (see below)

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Getting Your Free Gemini API Key

1. Go to **[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Sign in with Google → click **Create API key**
3. Add to `.env.local`:
```env
GEMINI_API_KEY=AIzaSy...
```

Free limits: **15 req/min · 1M tokens/day · no credit card needed**

---

## Features

- **Drag & drop upload** — PDF, DOCX, PPTX, TXT (up to 50 MB)
- **Conversion pipeline** — text extraction with real-time progress steps
- **Audio player** — waveform visualisation, seek, skip ±15/30s, speed 0.5×–2×, volume
- **AI Summary** — Gemini generates text summary + key bullet points + audio version
- **Library** — persisted history of all conversions with summary badges
- **Settings** — auto-summarise, default voice, default speed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 (with persist) |
| Data fetching | TanStack Query v5 |
| Validation | Zod v3 |
| Icons | Lucide React |
| AI (Summary) | Google Gemini 1.5 Flash (free tier) |
| PDF parsing | pdf-parse |
| DOCX parsing | mammoth |
| Toasts | Sonner |
| Fonts | Playfair Display · DM Sans · DM Mono |

---

## Documentation

| File | Contents |
|---|---|
| `docs/SETUP.md` | Full install guide + troubleshooting |
| `docs/ARCHITECTURE.md` | Code structure, data flow, design decisions |
| `docs/ADDING_REAL_TTS.md` | How to wire ElevenLabs / OpenAI / Google TTS |

---

## Project Structure

```
src/
├── app/                  Next.js routes + API handlers
├── components/           UI components (layout, upload, player, summary)
├── hooks/                TanStack Query mutations
├── lib/                  Utilities, Zod schemas, constants
├── store/                Zustand stores
└── types/                TypeScript interfaces
```

---

## Deploy to Vercel

```bash
vercel --prod
```

Add `GEMINI_API_KEY` in Vercel → Project → Settings → Environment Variables.
