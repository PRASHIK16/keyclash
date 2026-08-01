import * as React from "react";
import { cn } from "./cn";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "rank";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-kc-surface-2 text-kc-ink-muted",
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  danger: "bg-rose-500/15 text-rose-400",
  rank: "bg-kc-accent/15 text-kc-accent",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
