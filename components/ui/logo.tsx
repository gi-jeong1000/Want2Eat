"use client";

import Link from "next/link";
import { Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-8 w-8",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 group transition-all duration-200",
        className
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-sky-500 rounded-xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity" />
        <div className="relative bg-gradient-to-r from-blue-500 to-sky-500 p-1.5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
          <Utensils className={cn(sizeClasses[size], "text-white")} />
        </div>
      </div>
      {showText && (
        <span
          className={cn(
            "font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent",
            textSizes[size],
            "group-hover:from-blue-700 group-hover:to-sky-700 transition-colors"
          )}
        >
          Want2Eat
        </span>
      )}
    </Link>
  );
}

