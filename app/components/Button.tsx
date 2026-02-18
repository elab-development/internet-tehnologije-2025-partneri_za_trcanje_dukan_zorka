import React from 'react';


interface ButtonProps {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftSlot?: React.ReactNode;
  className?: string;
}

export default function Button({ 
  label,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  leftSlot,
  className = "",
}: ButtonProps) {

  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent active:translate-y-px";

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  const variants = {
    primary:
      "bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-[0_8px_20px_rgba(14,165,233,0.35)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(14,165,233,0.45)] focus:ring-cyan-400",
    secondary:
      "border border-slate-200 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:ring-slate-300 dark:border-white/20 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15",
    danger:
      "border border-red-300/80 bg-red-500 text-white shadow-[0_8px_18px_rgba(239,68,68,0.3)] hover:-translate-y-0.5 hover:bg-red-600 focus:ring-red-400 dark:border-red-400/50 dark:bg-red-500/85",
    ghost:
      "text-slate-700 hover:bg-slate-100 focus:ring-slate-300 dark:text-slate-200 dark:hover:bg-white/10",
    glass:
      "border border-white/70 bg-white/60 text-slate-700 backdrop-blur-md hover:-translate-y-0.5 hover:bg-white/80 focus:ring-blue-300 dark:border-white/20 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        baseStyles,
        sizes[size],
        variants[variant],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-55 cursor-not-allowed hover:translate-y-0 shadow-none" : "",
        className,
      ].join(" ")}
    >
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {!loading && leftSlot}
      <span>{label}</span>
    </button>
  );
}
