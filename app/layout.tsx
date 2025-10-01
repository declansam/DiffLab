import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Diff Checker",
  description: "Custom difference checker",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* set theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const stored = localStorage.getItem('theme'); const m = window.matchMedia('(prefers-color-scheme: dark)').matches; const t = stored === 'light' || stored === 'dark' ? stored : (m ? 'dark' : 'light'); const r = document.documentElement; if (t === 'dark') r.classList.add('dark'); else r.classList.remove('dark'); } catch (_) {} })();`,
          }}
        />

        <div className="w-full border-b border-black/10 dark:border-white/15">
          <div className="mx-auto max-w-screen-2xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">Diff Checker</div>
              <a
                href="https://lcsamyam.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs opacity-80 hover:opacity-100 underline underline-offset-4"
              >
                by lcsamyam
              </a>
            </div>
            <ThemeToggle />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
