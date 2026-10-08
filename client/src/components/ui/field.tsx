import type { ReactNode } from "react";

import { cx } from "../../utils/cx";

interface FieldProps {
  htmlFor: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  className?: string;
  children: ReactNode;
}

export function Field({ htmlFor, label, hint, error, className, children }: FieldProps) {
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {hint !== undefined && <span className="font-normal text-neutral-400"> {hint}</span>}
      </label>
      {children}
      {error !== undefined && (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
