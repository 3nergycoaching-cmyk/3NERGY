import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "3NERGY CRM",
  description: "CRM de coaching triathlon, cyclisme et course à pied",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${bricolage.variable} font-sans antialiased bg-[#f7f5f3] text-[#1a1218]`}>
        <ClerkProvider localization={frFR}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
