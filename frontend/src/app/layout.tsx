import type { Metadata } from "next";
import "./globals.css";
import { TabProvider } from "@/context/TabContext";

export const metadata: Metadata = {
  title: "Policy-as-Code Engine – Academic Compliance",
  description: "AI-powered clause-level regulatory retrieval and grounded generation for UGC, AICTE, and institutional policies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TabProvider>
          {children}
        </TabProvider>
      </body>
    </html>
  );
}
