"use client";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white shadow-sm border p-4">{children}</div>;
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4">{children}</div>;
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 text-sm text-gray-700 leading-6">{children}</div>;
}