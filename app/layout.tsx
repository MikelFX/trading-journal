import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/ui/Sidebar";

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Inteligentní obchodní deník pro forex/krypto tradery",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-60 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
