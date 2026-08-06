import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import { GlobalSettingsEffects } from "@/components/global-settings-effects";
import "./globals.css";

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Keyclash — Competitive Typing Platform",
  description:
    "Ranked typing matches, daily challenges, and progression. Where typists become champions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        {/*
          Blocking inline script, runs before first paint. Without this,
          the page would render with no theme class for a frame (or the
          previous default) and then visibly flash to the correct theme
          once React hydrates and GlobalSettingsEffects runs — the classic
          "flash of wrong theme" problem. Reading localStorage synchronously
          here and setting the class immediately avoids that entirely.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var raw = localStorage.getItem("keyclash:settings");
                var theme = raw ? (JSON.parse(raw).theme || "dark") : "dark";
                document.documentElement.classList.add(theme);
              } catch (e) {
                document.documentElement.classList.add("dark");
              }
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <GlobalSettingsEffects />
        {children}
      </body>
    </html>
  );
}
