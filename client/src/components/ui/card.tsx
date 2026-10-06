import type { HTMLAttributes } from "react";

import { cx } from "../../utils/cx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "plain" | "accent";
}

export function Card({ tone = "plain", className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border",
        tone === "accent"
          ? "border-brand-500/30 bg-neutral-900 shadow-glow"
          : "border-white/10 bg-neutral-900",
        className,
      )}
      {...rest}
    />
  );
}
