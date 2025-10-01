import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DiffLab",
  description: "A simple text diff comparison tool",
  icons: {
    icon: "/favicon.ico",
  },
  viewport: "width=device-width, initial-scale=1",
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
        <div className="w-full border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-screen-2xl p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <div className="text-xl sm:text-2xl font-bold text-slate-800">DiffLab</div>
                <a
                  href="https://lcsamyam.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 hover:text-slate-800 underline underline-offset-4"
                >
                  by lcsamyam
                </a>
              </div>
              <div id="diff-controls" className="flex flex-wrap items-center gap-2 sm:gap-4">
                {/* Controls will be rendered here by DiffChecker */}
              </div>
            </div>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
