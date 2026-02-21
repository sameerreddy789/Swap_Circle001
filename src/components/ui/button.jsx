
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 transition-all duration-400 ease-springy",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm shadow-black/5 hover:bg-[hsl(var(--gold-3))] hover:text-white hover:scale-105 hover:shadow-lg hover:shadow-[hsl(var(--gold-2)_/_0.4)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm shadow-black/5 hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent shadow-sm shadow-black/5 hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm shadow-black/5 hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

    
