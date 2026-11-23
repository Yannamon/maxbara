import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";

export const metadata: Metadata = {
  title: "Max Bara | Création d’entreprise en Côte d’Ivoire",
  description: "Estimez les frais de création et de domiciliation de votre société en Côte d’Ivoire.",
};

export default function FrenchLayout({ children }: { children: ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
