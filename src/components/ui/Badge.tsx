"use client";

import React from "react";
import clsx from "clsx";

type Color = "gray" | "blue" | "amber" | "green" | "red";

type Props = {
  children: React.ReactNode;
  color?: Color;         // optionnel (par défaut "gray")
  className?: string;    // classes tailwind supplémentaires si besoin
};

const COLORS: Record<Color, string> = {
  gray:  "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200",
  blue:  "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200",
  amber: "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200",
  green: "bg-green-100 text-green-700 ring-1 ring-inset ring-green-200",
  red:   "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200",
};

export default function Badge({ children, color = "gray", className }: Props) {
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1",
        COLORS[color],
        className
      )}
    >
      {children}
    </span>
  );
}