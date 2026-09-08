import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proof Sheet — Passport Photo Layout Maker",
  description:
    "Arrange 25–30 passport-size photos on a print-ready A4 sheet at true DPI. Free, no login, nothing ever leaves your device.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
