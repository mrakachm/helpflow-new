import { PropsWithChildren } from "react";
import clsx from "clsx";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("rounded-2xl border bg-white shadow-sm", className)}>{children}</div>;
}
export function CardHeader({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx("border-b px-5 py-4 flex items-center justify-between gap-2", className)}>
      {children}
    </div>
  );
}
export function CardBody({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("px-5 py-4", className)}>{children}</div>;
}
export function CardFooter({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={clsx("border-t px-5 py-4", className)}>{children}</div>;
}