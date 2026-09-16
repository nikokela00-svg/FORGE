// Search — honest empty state until the workspace phase ships
import { VIEW_META } from "./view-meta";

function SearchView() {
  const meta = VIEW_META.search;
  return (
    <div
      aria-label={meta.label}
      className="flex min-h-full flex-col justify-center gap-1 px-4 py-6"
    >
      <p className="text-13 text-fg font-medium">{meta.caption}</p>
      <p className="text-12 text-fg-muted">{meta.description}</p>
    </div>
  );
}

export { SearchView };
