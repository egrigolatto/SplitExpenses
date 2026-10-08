import { cx } from "../../utils/cx";

export type ButtonVariant =
  "primary" | "secondary" | "inverse" | "danger" | "dangerOutline" | "ghost" | "link";

export type ButtonSize = "sm" | "md";

const baseClass =
  "inline-flex cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:pointer-events-none disabled:opacity-60";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white shadow-glow hover:bg-brand-700",
  secondary:
    "border border-white/15 bg-white/5 text-brand-100 hover:border-brand-400 hover:bg-white/10 hover:text-white",
  inverse:
    "border border-white/15 bg-white/5 text-brand-100 hover:border-brand-400 hover:bg-white/10 hover:text-white",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  dangerOutline: "border border-rose-500/40 text-rose-300 hover:bg-rose-500/10",
  ghost: "text-neutral-400 hover:bg-white/10 hover:text-neutral-100",
  link: "rounded text-brand-300 underline decoration-brand-500/60 underline-offset-4 hover:text-brand-200 hover:decoration-brand-400",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-4 py-2",
  md: "px-6 py-2.5",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size?: ButtonSize,
  className?: string,
): string {
  return cx(baseClass, variantClass[variant], size !== undefined && sizeClass[size], className);
}
