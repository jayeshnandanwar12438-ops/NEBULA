import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEBULA — Autonomous Space Anomaly Investigator",
  description: "Space anomaly investigation platform powered by Strands Decider 2B and Amazon Bedrock.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-space-950 text-slate-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
