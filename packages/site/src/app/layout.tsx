import type { Metadata } from "next";
import "./globals.css";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

export const metadata: Metadata = {
  title: "Structured Schema Validator | Codygo",
  description:
    "Validate JSON schemas for LLM structured outputs across OpenAI, Google Gemini, and Anthropic Claude.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
