"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface NavLinkItem {
  href: string;
  label: string;
}

export function MobileNavMenu({ links }: { links: NavLinkItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-2 text-kc-ink-muted hover:bg-kc-surface-2 hover:text-kc-ink"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <nav className="absolute left-0 right-0 top-16 z-50 flex flex-col border-b border-kc-border bg-kc-surface px-4 py-2 shadow-lg">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-sm font-medium text-kc-ink-muted transition-colors hover:bg-kc-surface-2 hover:text-kc-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
