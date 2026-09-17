// Read-only file preview — breadcrumb header, line-numbered text, binary notice; editing is a later prompt
"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyEditor } from "@/features/shell";
import { Spinner } from "@/shared/ui";

import type { FileNode } from "../../api/vfs";
import { vfs } from "../../api/vfs";
import { extname } from "../../lib/paths";
import { formatBytes } from "../../lib/report";
import { useFsStore } from "../../model/fs-store";
import { useWorkspaceNodes } from "../lib/use-workspace-nodes";
import { useExplorerStore } from "../model/explorer-store";

function usePreviewFile(workspaceId: string | null): FileNode | null {
  const listingRevision = useFsStore((state) => state.listingRevision);
  const selection = useExplorerStore((state) => state.selectedIds);
  const nodes = useWorkspaceNodes(workspaceId, listingRevision);
  if (nodes === undefined || selection.length !== 1) return null;
  const id = selection[0];
  if (id === undefined) return null;
  return nodes.find((node) => node.id === id && node.type === "file") ?? null;
}

function LineNumbers({ count }: { count: number }) {
  return (
    <div className="text-fg-subtle text-12 flex shrink-0 flex-col items-end pr-3 tabular-nums select-none">
      {Array.from({ length: count }, (_, index) => (
        <span key={index}>{index + 1}</span>
      ))}
    </div>
  );
}

function TokenFileBody({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex">
        <LineNumbers count={lines.length} />
        <div className="min-w-0 flex-1">
          {lines.map((line, index) => (
            <pre
              key={index}
              className="text-fg text-12 pr-4 font-mono leading-normal break-words whitespace-pre-wrap"
            >
              {line === "" ? " " : line}
            </pre>
          ))}
        </div>
      </div>
    </div>
  );
}

function BinaryNotice({ file }: { file: FileNode }) {
  const extension = extname(file.name);
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-1 px-6 text-center">
      <FileText className="text-fg-subtle size-8" aria-hidden="true" />
      <p className="text-fg text-13 font-medium">Binary file — no preview</p>
      <p className="text-fg-muted text-12">
        {extension === "" ? "unknown type" : `${extension} file`} ·{" "}
        {formatBytes(file.size)}
      </p>
    </div>
  );
}

function FilePreview({ file }: { file: FileNode }) {
  const [path, setPath] = useState<string | null>(null);
  const [content, setContent] = useState<string | Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void vfs
      .getPath(file.id)
      .then((resolved) => {
        if (!cancelled) setPath(resolved);
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : "Failed to resolve path");
      });
    void vfs
      .readFile(file.id)
      .then((resolved) => {
        if (!cancelled) setContent(resolved);
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : "Failed to read file");
      });
    return () => {
      cancelled = true;
    };
  }, [file.id]);

  const isBinary = content instanceof Blob;
  const lines = typeof content === "string" ? content.split("\n").length : 0;

  return (
    <section
      role="region"
      aria-label={path === null ? "Loading file preview" : `Preview ${path}`}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <header className="border-border flex h-9 shrink-0 items-center gap-2 border-b px-3">
        <FileText className="text-accent size-3.5 shrink-0" aria-hidden="true" />
        <span className="text-fg-muted text-12 min-w-0 flex-1 truncate font-mono">
          {path ?? "…"}
        </span>
        {content !== null && (
          <span className="text-fg-subtle text-11 shrink-0 tabular-nums">
            {formatBytes(file.size)}
            {isBinary ? " · binary" : ` · ${lines.toString()} lines · UTF-8`}
          </span>
        )}
      </header>
      {error !== null ? (
        <p className="text-danger text-12 px-4 py-6">{error}</p>
      ) : content === null ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="text-fg-muted size-4" aria-hidden="true" />
          <span className="text-fg-muted text-12 sr-only">Loading</span>
        </div>
      ) : isBinary ? (
        <BinaryNotice file={file} />
      ) : (
        <TokenFileBody content={content} />
      )}
    </section>
  );
}

function PreviewPane() {
  const workspaceId = useFsStore((state) => state.currentWorkspaceId);
  const file = usePreviewFile(workspaceId);
  // Read-only by design this phase: editing files is a later prompt that will
  // reuse the same VFS read/write path.
  if (file === null) return <EmptyEditor />;
  return <FilePreview key={file.id} file={file} />;
}

export { PreviewPane };
