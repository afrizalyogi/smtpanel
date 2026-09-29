import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SMTPanel",
  description: "Your SMTP. One clean interface. Zero data stored.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-bg text-fg antialiased`}>
        <Providers>
          {children}
          <Toaster 
            theme="dark" 
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
