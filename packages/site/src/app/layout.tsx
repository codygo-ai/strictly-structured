import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Structured Output Validators | Codygo",
  description:
    "Validate, auto-fix, and optimize JSON schemas for any LLM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
