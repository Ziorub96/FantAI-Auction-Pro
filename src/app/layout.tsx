import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FantAI Auction Pro",
  description: "Assistente d'asta adattivo per Fantacalcio",
  manifest: "/manifest.json",
  themeColor: "#0a0a0a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FantAI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}