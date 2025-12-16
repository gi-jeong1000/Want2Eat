import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400 text-white hover:shadow-lg hover:shadow-sky-400/50 hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-red-400 to-rose-500 text-white hover:shadow-lg hover:shadow-red-400/50 hover:-translate-y-0.5",
        outline:
          "border-2 border-sky-200 bg-white/80 backdrop-blur-sm hover:bg-sky-50 hover:border-sky-300 hover:shadow-soft",
        secondary:
          "bg-gradient-to-r from-blue-50 to-sky-50 text-blue-900 hover:from-blue-100 hover:to-sky-100 hover:shadow-soft",
        ghost: "hover:bg-sky-50/80 hover:text-sky-700 rounded-lg",
        link: "text-sky-600 underline-offset-4 hover:underline hover:text-sky-700",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

