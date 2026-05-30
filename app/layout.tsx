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
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <main style={{ flex: 1, marginLeft: 240, padding: "40px 48px", minWidth: 0 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
