"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const InteractiveHoverButton = React.forwardRef((({ text = "Button", className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative w-32 cursor-pointer overflow-hidden rounded-full border bg-background p-2 text-center font-semibold transition-all duration-300",
        "border-zinc-200 dark:border-zinc-800",
        className,
      )}
      {...props}
    >
      {/* Initial State */}
      <span className="inline-block translate-x-1 transition-all duration-300 group-hover:-translate-x-12 group-hover:opacity-0">
        {text}
      </span>
      
      {/* Hover State Content (Arrows Left for "Back") */}
      <div className="absolute top-0 z-10 flex h-full w-full -translate-x-12 items-center justify-center gap-2 text-primary-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <ArrowLeft className="w-4 h-4" />
        <span>{text}</span>
      </div>

      {/* Background Expansion Effect */}
      <div className="absolute right-[20%] top-[40%] h-2 w-2 scale-[1] rounded-lg bg-primary transition-all duration-300 group-hover:right-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8]"></div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
