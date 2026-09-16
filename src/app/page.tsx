// Home — the one-page workspace surface, composed from the shell feature slice
import type { Metadata } from "next";

import { Shell } from "@/features/shell";
import { siteConfig } from "@/shared/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export default function Home() {
  return <Shell />;
}
