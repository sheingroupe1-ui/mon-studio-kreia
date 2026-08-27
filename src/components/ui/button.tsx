import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,color,opacity,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--fg)] text-[var(--bg)] hover:bg-white",
        secondary:
          "bg-[var(--bg-subtle)] text-[var(--fg)] shadow-[var(--shadow-border)] hover:bg-[var(--accent-fill)]",
        ghost:
          "bg-transparent text-[var(--fg)] hover:bg-[color-mix(in_oklab,var(--fg)_8%,transparent)]",
        outline:
          "bg-transparent text-[var(--fg)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--fg)_16%,transparent)] hover:bg-[color-mix(in_oklab,var(--fg)_6%,transparent)]",
        danger:
          "bg-[color-mix(in_oklab,var(--color-danger)_18%,transparent)] text-[#f3c7bf] hover:bg-[color-mix(in_oklab,var(--color-danger)_28%,transparent)]",
      },
      size: {
        sm: "h-9 rounded-[var(--radius-sm)] px-3 text-sm",
        md: "h-11 rounded-[var(--radius-md)] px-4 text-sm",
        lg: "h-12 rounded-[var(--radius-md)] px-5 text-base",
        icon: "size-11 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
