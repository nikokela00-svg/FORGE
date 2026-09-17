// User-facing summaries for import results — byte formatting and skip-report copy
import type { ImportReport } from "../api/fs-access";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes.toString()} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb).toString()} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function describeReport(report: ImportReport): string {
  const base = `${report.importedFiles.toString()} files · ${formatBytes(report.totalBytes)}`;
  if (report.skipped.length === 0) return base;
  const sample = report.skipped
    .slice(0, 3)
    .map((skip) => skip.path)
    .join(", ");
  const tail =
    report.skipped.length > 3 ? ` +${(report.skipped.length - 3).toString()} more` : "";
  return `${report.skipped.length.toString()} skipped: ${sample}${tail}`;
}
