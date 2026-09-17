// Pure virtual-path utilities for the file system feature — no I/O, no state
export const PATH_SEPARATOR = "/";

export function normalizePath(path: string): string {
  const stack: string[] = [];
  for (const segment of path.split(PATH_SEPARATOR)) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      stack.pop();
      continue;
    }
    stack.push(segment);
  }
  return stack.join(PATH_SEPARATOR);
}

export function isRootPath(path: string): boolean {
  return normalizePath(path) === "";
}

export function joinPaths(...parts: string[]): string {
  return normalizePath(parts.join(PATH_SEPARATOR));
}

export function dirname(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === "") return "";
  const slashIndex = normalized.lastIndexOf(PATH_SEPARATOR);
  if (slashIndex === -1) return "";
  return normalized.slice(0, slashIndex);
}

export function basename(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === "") return "";
  const slashIndex = normalized.lastIndexOf(PATH_SEPARATOR);
  return slashIndex === -1 ? normalized : normalized.slice(slashIndex + 1);
}

export function extname(path: string): string {
  const base = basename(path);
  const dotIndex = base.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  return base.slice(dotIndex);
}

export function pathSegments(path: string): string[] {
  const normalized = normalizePath(path);
  if (normalized === "") return [];
  return normalized.split(PATH_SEPARATOR);
}

export function isAncestorOf(ancestor: string, descendant: string): boolean {
  const normalizedAncestor = normalizePath(ancestor);
  const normalizedDescendant = normalizePath(descendant);
  if (normalizedDescendant === "" || normalizedAncestor === normalizedDescendant) {
    return false;
  }
  if (normalizedAncestor === "") return true;
  return (
    normalizedDescendant === normalizedAncestor ||
    normalizedDescendant.startsWith(`${normalizedAncestor}${PATH_SEPARATOR}`)
  );
}

export function fileNameIsValid(name: string): boolean {
  return (
    name !== "" &&
    name !== "." &&
    name !== ".." &&
    !/[\\/]/.test(name) &&
    !name.includes("\0")
  );
}
