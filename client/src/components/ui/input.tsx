import * as React from "react";
import { cn } from "@/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-ink/10 bg-white px-3.5 text-sm outline-none ring-violet-400 placeholder:text-ink/40 focus:ring-2",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-xl border border-ink/10 bg-white px-3.5 py-3 text-sm outline-none ring-violet-400 placeholder:text-ink/40 focus:ring-2",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
