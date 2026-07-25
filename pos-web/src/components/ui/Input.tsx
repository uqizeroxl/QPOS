import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const inputStyles =
  "w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  inputSize?: "default" | "compact";
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, inputSize = "default", ...props },
  ref,
) {
  if (props.type === "checkbox") {
    return (
      <input
        ref={ref}
        className={cn(
          "h-4 w-4 shrink-0 rounded border-gray-300 p-0 text-blue-600 outline-none focus:ring-2 focus:ring-blue-100",
          "dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-cyan-500/20",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <input
      ref={ref}
      className={cn(
        inputStyles,
        inputSize === "default" ? "h-11" : "h-8",
        className,
      )}
      {...props}
    />
  );
});

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputStyles, "h-11", className)} {...props} />;
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
        "bg-white text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20",
        className,
      )}
      {...props}
    />
  );
});
