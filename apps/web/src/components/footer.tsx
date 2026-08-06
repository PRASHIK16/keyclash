export function Footer() {
  return (
    <footer className="border-t border-kc-border bg-kc-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-xs text-kc-ink-muted sm:flex-row sm:text-left">
        <p>© {new Date().getFullYear()} Keyclash. All rights reserved.</p>
        <p>
          Designed &amp; developed by{" "}
          <span className="font-medium text-kc-ink">Prashik Dongre</span>
        </p>
      </div>
    </footer>
  );
}
