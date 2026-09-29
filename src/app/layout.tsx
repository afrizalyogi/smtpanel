import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://smtpanel.vercel.app"),
  title: "SMTPanel | Privacy-First Stateless SMTP Web Client",
  description: "Connect your SMTP server and send emails instantly. SMTPanel is a zero-database, privacy-first web client where your data stays locally in your browser.",
  keywords: ["SMTP", "Email Client", "Self-hosted", "Newsletter", "Privacy-first", "Stateless", "Zero Database", "Next.js"],
  authors: [{ name: "SMTPanel Contributors" }],
  openGraph: {
    title: "SMTPanel | Privacy-First SMTP Web Client",
    description: "Zero databases. No telemetry. Manage and send emails securely directly from your browser.",
    url: "https://smtpanel.vercel.app",
    siteName: "SMTPanel",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SMTPanel | Privacy-First SMTP Web Client",
    description: "Zero databases. No telemetry. Manage and send emails securely directly from your browser.",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "SMTPanel",
              "url": "https://smtpanel.vercel.app",
              "description": "A privacy-first, stateless SMTP web client built with Next.js. Requires zero databases.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-bg text-fg text-sm antialiased`}>
        <Providers>
          {children}
          <Toaster 
            theme="system" 
            toastOptions={{
              className: 'bg-surface border-border text-fg rounded-md shadow-lg',
              style: {
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--fg)',
              }
            }} 
          />
        </Providers>
      </body>
    </html>
  );
}
