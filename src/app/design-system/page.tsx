// Dev-only design-system reference page; static production builds 404 it
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DesignSystemShowcase } from "@/features/design-system";

export const metadata: Metadata = {
  title: "Design system",
};

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return <DesignSystemShowcase />;
}
