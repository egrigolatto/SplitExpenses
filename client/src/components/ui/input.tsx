import type { InputHTMLAttributes } from "react";

import { cx } from "../../utils/cx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid = false, className, ...rest }: InputProps) {
  return (
    <input
      className={cx(
        "rounded-lg border bg-neutral-950 px-3 py-2 text-sm text-neutral-100 transition-colors placeholder:text-neutral-400",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-400",
        invalid ? "border-rose-500" : "border-neutral-700 hover:border-neutral-600",
        className,
      )}
      {...rest}
    />
  );
}
