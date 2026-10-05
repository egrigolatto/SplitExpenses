import type { HTMLAttributes } from "react";

import { cx } from "../../utils/cx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "light" | "dark";
}

export function Card({ tone = "light", className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border",
        tone === "dark"
          ? "border-brand-500/25 bg-neutral-950 text-neutral-100 shadow-glow"
          : "border-neutral-200 bg-white",
        className,
      )}
      {...rest}
    />
  );
}
