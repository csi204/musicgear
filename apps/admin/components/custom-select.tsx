"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "เลือกรายการ...",
  className,
  triggerClassName,
  dropdownClassName,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full pl-4 pr-2 py-3 text-sm rounded-lg border border-zinc-700 bg-[#2a2a2d] text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-left flex items-center cursor-pointer gap-2",
          triggerClassName
        )}
      >
        <span className="truncate flex-1 min-w-0">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown panel — always mounted, animated via CSS */}
      <div
        className={cn(
          "absolute left-0 right-0 mt-1.5 z-50 max-h-56 overflow-y-auto rounded-lg border shadow-xl",
          "bg-[#2a2a2d] border-zinc-700",
          "origin-top transition-all duration-150 ease-out",
          isOpen
            ? "opacity-100 scale-y-100 pointer-events-auto"
            : "opacity-0 scale-y-95 pointer-events-none",
          dropdownClassName
        )}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onChange(opt.value);
              setIsOpen(false);
            }}
            className={cn(
              "w-full px-4 py-2.5 text-left text-xs transition-colors block truncate border-b border-zinc-700/60 last:border-b-0",
              opt.value === value
                ? "bg-blue-500/15 text-blue-400 dark:text-blue-300 font-semibold"
                : "text-zinc-800 dark:text-zinc-200 hover:bg-blue-500/10 hover:text-blue-300"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
