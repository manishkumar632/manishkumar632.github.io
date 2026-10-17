import type { Metadata } from "next";
import FodiexCaseStudy from "@/components/portfolio/FodiexCaseStudy";

export const metadata: Metadata = {
  title: "FODIEX · Case study · Manish",
  description: "A four-app food delivery platform for Nepal (customer, vendor, rider and admin) on a modular PostgreSQL backend, built in Flutter and live on Google Play.",
};

export default function Page() {
  return <FodiexCaseStudy />;
}
