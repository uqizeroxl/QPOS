import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "../../utils/cn";

type CardProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export default function Card<T extends ElementType = "div">({
  as,
  children,
  className,
  ...props
}: CardProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
