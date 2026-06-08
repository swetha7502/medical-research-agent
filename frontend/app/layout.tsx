import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedResearch AI",
  description: "Medical evidence retrieval powered by LangGraph agents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
