import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenAC Flow Builder",
  description: "Scenario → Module Graph → Mermaid Flow generator for anonymous credentials",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="border-b bg-white px-6 py-3 flex items-center gap-6">
          <span className="font-bold text-lg">OpenAC Flow Builder</span>
          <a href="/scenario" className="text-blue-600 hover:underline text-sm">
            Scenario (MVP1)
          </a>
          <a href="/canvas" className="text-blue-600 hover:underline text-sm">
            Canvas (MVP3)
          </a>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
