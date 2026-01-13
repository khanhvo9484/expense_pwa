import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "My Expense - Track Your Spending",
  description: "Smart expense tracking with AI-powered chat interface",
  viewport:
    "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My Expense",
  },
  themeColor: "oklch(0.205 0 0)",
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
        {children}
        <Script id="disable-zoom" strategy="afterInteractive">
          {`
            document.addEventListener("gesturestart", function (e) {
              e.preventDefault();
              document.body.style.zoom = 0.99;
            });

            document.addEventListener("gesturechange", function (e) {
              e.preventDefault();
              document.body.style.zoom = 0.99;
            });

            document.addEventListener("gestureend", function (e) {
              e.preventDefault();
              document.body.style.zoom = 1;
            });
          `}
        </Script>
      </body>
    </html>
  );
}
