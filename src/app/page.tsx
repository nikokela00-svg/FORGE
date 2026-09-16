// FORGE home page — composes the boot feature slice
import type { Metadata } from "next";

import { BootScreen } from "@/features/boot";
import { siteConfig } from "@/shared/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export default function Home() {
  return <BootScreen />;
}
