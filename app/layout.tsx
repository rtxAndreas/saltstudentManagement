import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestion scolaire",
  description: "Application de gestion des élèves et des résultats scolaires",
};

import Providers from "./Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
