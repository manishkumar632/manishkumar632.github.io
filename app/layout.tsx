import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./portfolio.css";

// Engineer-style type: Space Grotesk (technical grotesk) for UI/body,
// JetBrains Mono for code-like labels. Variable names kept so every
// existing reference (CSS + SVG diagrams) picks them up automatically.
const geistSans = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manish · Flutter Developer",
  description:
    "Flutter developer who analyzes every detail, prototypes in Figma, designs lean databases and builds secure, scalable apps.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
