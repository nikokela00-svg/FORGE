// Presentational boot screen: wordmark, blinking caret, version footer
export function BootScreen() {
  return (
    <main className="bg-bg text-fg relative flex min-h-dvh flex-col items-center justify-center">
      <p className="font-mono text-5xl font-semibold tracking-tight select-none sm:text-6xl md:text-7xl">
        FORGE
        <span
          className="animate-boot-blink text-accent motion-reduce:animate-none"
          aria-hidden="true"
        >
          ▍
        </span>
      </p>
      <footer className="text-fg-muted absolute inset-x-0 bottom-6 text-center font-mono text-xs sm:text-sm">
        v0.1.0 — foundation
      </footer>
    </main>
  );
}
