// View metadata for the activity bar and sidebar: icon, label, and honest empty-state copy
import { Blocks, FileText, GitBranch, type LucideIcon, Search } from "lucide-react";

import type { ActiveView } from "../../model/shell-store";

export interface ViewMeta {
  icon: LucideIcon;
  label: string;
  caption: string;
  description: string;
}

export const VIEW_META: Record<ActiveView, ViewMeta> = {
  files: {
    icon: FileText,
    label: "Explorer",
    caption: "No workspace opened yet.",
    description: "Opening a local folder lands here in a later phase.",
  },
  search: {
    icon: Search,
    label: "Search",
    caption: "Nothing to search yet.",
    description: "Cross-file search arrives with the workspace phase.",
  },
  "source-control": {
    icon: GitBranch,
    label: "Source Control",
    caption: "No repository opened yet.",
    description: "Git operations appear once a workspace is opened.",
  },
  extensions: {
    icon: Blocks,
    label: "Extensions",
    caption: "No extensions installed",
    description: "The marketplace opens in a later phase.",
  },
};
