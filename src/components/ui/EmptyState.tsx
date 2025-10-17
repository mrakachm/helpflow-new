"use client";

export default function EmptyState({
  title,
  hint,
}: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-8 text-center text-gray-600">
      <p className="font-medium">{title}</p>
      {hint ? <p className="mt-1 text-sm text-gray-500">{hint}</p> : null}
    </div>
  );
}