import type { Metadata } from "next";
import { InteractiveTutorialExperience } from "./InteractiveTutorialExperience";

export const metadata: Metadata = {
  title: "Tutorial & Panduan Arsitektur Sistem | Personal Progress OS",
  description:
    "Panduan komprehensif cara kerja, relasi antar fitur, dan alur eksekusi di Personal Progress OS.",
};

export const dynamic = "force-dynamic";

export default function TutorialPage() {
  return <InteractiveTutorialExperience />;
}
