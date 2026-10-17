import type { Metadata } from "next";
import CaseStudy from "@/components/portfolio/CaseStudy";

export const metadata: Metadata = {
  title: "Zinkognito · Case study · Manish",
  description: "How I built Zinkognito, an interview-prep coach that helps capable students explain their skills and projects.",
};

export default function ZinkognitoCaseStudy() {
  return <CaseStudy />;
}
