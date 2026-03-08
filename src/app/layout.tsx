// app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/layout/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audify — PDF to Audio",
  description: "Convert your lecture slides, textbooks, and documents into audio. Learn on the go.",
  keywords: ["PDF to audio", "text to speech", "lecture notes", "study tool"],
  openGraph: {
    title: "Audify — PDF to Audio",
    description: "Turn your documents into audio for learning on the go.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Google+Sans+Display:wght@400;500;600;700&family=Google+Sans+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <QueryProvider>
          {children}
          <Toaster
            theme="system"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontFamily: "'Google Sans', system-ui, sans-serif",
                fontWeight: "500",
                fontSize: "14px",
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
