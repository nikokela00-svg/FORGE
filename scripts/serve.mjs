// Minimal static file server for serving the exported build (scripts only run in Node ESM)
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
const PORT = Number.parseInt(process.argv[3] ?? "4173", 10);

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

function resolvePublicPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  const relative = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return join(OUT_DIR, relative);
}

if (!existsSync(join(OUT_DIR, "index.html"))) {
  console.error(`No build found at ${OUT_DIR}. Run "pnpm build" first.`);
  process.exit(1);
}

const server = createServer((req, res) => {
  const rawPath = resolvePublicPath(req.url ?? "/");
  const filePath =
    existsSync(rawPath) && statSync(rawPath).isFile()
      ? rawPath
      : join(rawPath, "index.html");

  if (!existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const type = CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Static server serving ${OUT_DIR} at http://localhost:${PORT}`);
});
