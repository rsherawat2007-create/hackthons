import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className={cn("relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl", className)}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl">{title}</h3>
          <button onClick={onClose} className="text-ink/50 hover:text-ink">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
