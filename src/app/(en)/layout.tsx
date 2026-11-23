import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";

export const metadata: Metadata = {
  title: "Max Bara | Company formation in Côte d’Ivoire",
  description: "Estimate your company formation and registered address costs in Côte d’Ivoire.",
};

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
