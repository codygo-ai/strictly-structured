import type { Metadata } from 'next';

import './globals.css';
import { FirebaseAnalytics } from '~/components/FirebaseAnalytics';
import { GoogleOneTap } from '~/components/GoogleOneTap';
import { SiteHeader } from '~/components/SiteHeader';
import { ThemeProvider } from '~/components/ThemeProvider';

const siteName = "Codygo's Strictly Structured";
const description =
  'Validate, auto-fix, and optimize JSON schemas for LLM structured outputs. Test schemas across OpenAI, Google, and Anthropic. Fix invalid keywords and get model-specific compatibility.';
const baseUrl = 'https://structured.codygo.com';

export const metadata: Metadata = {
  title: {
    default: `${siteName} | JSON schema validator for LLMs`,
    template: `%s | ${siteName}`,
  },
  description,
  icons: [
    // { url: "/icon.svg", type: "image/svg+xml" },
    { url: '/icon.png', type: 'image/png', sizes: '32x32' },
  ],
  keywords: [
    'JSON schema',
    'LLM',
    'structured output',
    'OpenAI',
    'Anthropic',
    'Gemini',
    'schema validator',
    'GPT',
    'Claude',
    'Codygo',
  ],
  authors: [{ name: 'Codygo', url: 'https://codygo.com' }],
  creator: 'Codygo',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName,
    title: siteName,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col h-screen antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <FirebaseAnalytics />
          <GoogleOneTap />
          <SiteHeader subtitle />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
