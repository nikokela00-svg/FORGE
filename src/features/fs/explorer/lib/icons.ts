// File icon mapping — lucide glyphs per extension; folders always accent, files muted
import {
  File,
  FileCode2,
  FileJson,
  FileText,
  FileType,
  Image,
  type LucideIcon,
} from "lucide-react";
import { createElement, type ReactElement } from "react";

import { extname } from "../../lib/paths";

const ICON_BY_EXTENSION: Record<string, LucideIcon> = {
  ".ts": FileCode2,
  ".tsx": FileCode2,
  ".js": FileCode2,
  ".jsx": FileCode2,
  ".mjs": FileCode2,
  ".cjs": FileCode2,
  ".json": FileJson,
  ".md": FileText,
  ".mdx": FileText,
  ".txt": FileText,
  ".css": FileType,
  ".scss": FileType,
  ".html": FileType,
  ".svg": Image,
  ".png": Image,
  ".jpg": Image,
  ".jpeg": Image,
  ".gif": Image,
  ".webp": Image,
  ".ico": Image,
};

export function iconForExtension(name: string): LucideIcon {
  return ICON_BY_EXTENSION[extname(name)] ?? File;
}

// Renders the extension-matched icon without binding a component during render.
export function fileGlyph(name: string, className?: string): ReactElement {
  const icon = iconForExtension(name);
  return createElement(icon, { className, "aria-hidden": true });
}
