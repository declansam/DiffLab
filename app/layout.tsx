import type { Metadata, Viewport } from "next";
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
  title: {
    default: "DiffLab - Text Diff Comparison Tool",
    template: "%s | DiffLab",
  },
  description:
    "A powerful text diff comparison tool built with Next.js and TypeScript. Compare code, text files, and documents with side-by-side and inline diff views. Features syntax highlighting, whitespace handling, and responsive design.",
  keywords: [
    "diff tool",
    "text comparison",
    "code diff",
    "file comparison",
    "text diff",
    "side by side diff",
    "inline diff",
    "developer tools",
    "Next.js",
    "TypeScript",
    "lcsamyam",
  ],
  authors: [
    {
      name: "lcsamyam",
      url: "https://lcsamyam.com",
    },
  ],
  creator: "lcsamyam",
  publisher: "lcsamyam",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://difflab.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DiffLab - Text Diff Comparison Tool",
    description:
      "A powerful text diff comparison tool built with Next.js and TypeScript. Compare code, text files, and documents with advanced diff visualization.",
    url: "https://difflab.vercel.app",
    siteName: "DiffLab",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DiffLab - Text Diff Comparison Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DiffLab - Text Diff Comparison Tool",
    description:
      "A powerful text diff comparison tool built with Next.js and TypeScript. Compare code and text with advanced visualization.",
    creator: "@lcsamyam",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
                <div className="text-xl sm:text-2xl font-bold text-slate-800">
                  DiffLab
                </div>
                <a
                  href="https://lcsamyam.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 hover:text-slate-800 underline underline-offset-4"
                >
                  by lcsamyam
                </a>
              </div>
              <div
                id="diff-controls"
                className="flex flex-wrap items-center gap-2 sm:gap-4"
              >
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
