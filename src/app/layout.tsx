import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "OpenAC Studio — Anonymous Credential Integration Designer",
  description:
    "Design, visualize, and analyze anonymous credential flows with interactive module selection, sequence diagrams, and threat modeling.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <TooltipProvider delayDuration={300}>
          <SiteNav />
          <main className="flex-1">{children}</main>
          <footer className="border-t bg-white py-6 text-center text-xs text-gray-400">
            OpenAC Studio — a checklist-based design tool, not a formal security proof.
          </footer>
        </TooltipProvider>
      </body>
    </html>
  );
}
