"use client";

import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

// Variantes disponibles
type Variants = "primary" | "secondary" | "ghost" | "danger";

// Props communes
type BaseProps = {
  variant?: Variants;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
};

// Deux formes de props (discriminated union)
type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: "button"; // défaut
  };

type ButtonAsLink = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: "a";
  };

type Props = ButtonAsButton | ButtonAsLink;

const base =
  "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60";

const variants: Record<Variants, string> = {
  primary: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-600",
  secondary:
    "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-200",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
};

export default function Button(props: Props) {
  const {
    as = "button",
    variant = "primary",
    loading = false,
    className,
    children,
    ...rest
  } = props as Props;

  const classes = clsx(base, variants[variant], className);

  if (as === "a") {
    const linkProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a {...linkProps} className={classes}>
        {loading ? "…" : children}
      </a>
    );
    // (On peut ajouter rel="noopener noreferrer" si target="_blank")
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      {...buttonProps}
      className={classes}
      disabled={loading || buttonProps.disabled}
    >
      {loading ? "…" : children}
    </button>
  );
}