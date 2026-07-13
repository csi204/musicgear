"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalEntries: number;
  itemsPerPage: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalEntries,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Calculate entry range shown
  const fromEntry = (currentPage - 1) * itemsPerPage + 1;
  const toEntry = Math.min(currentPage * itemsPerPage, totalEntries);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1; // Number of pages to show before and after the current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (
        i === currentPage - delta - 1 ||
        i === currentPage + delta + 1
      ) {
        pages.push("...");
      }
    }

    // Filter out consecutive duplicate ellipsis
    return pages.filter((page, index, arr) => {
      return page !== "..." || arr[index - 1] !== "...";
    });
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
      {/* Left side: Range Info */}
      <div className="text-xs text-zinc-550 dark:text-zinc-400 font-medium">
        แสดง <span className="font-bold text-zinc-900 dark:text-white">{fromEntry}</span> ถึง{" "}
        <span className="font-bold text-zinc-900 dark:text-white">{toEntry}</span> จากทั้งหมด{" "}
        <span className="font-bold text-zinc-900 dark:text-white">{totalEntries}</span> รายการ
      </div>

      {/* Right side: Navigation buttons */}
      <div className="flex items-center gap-1.5">
        {/* Prev Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition-all cursor-pointer"
          title="หน้าก่อนหน้า"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pages.map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2.5 py-1 text-sm text-zinc-400 dark:text-zinc-550 select-none"
              >
                ...
              </span>
            );
          }

          const isCurrent = page === currentPage;
          return (
            <button
              type="button"
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer min-w-[28px] h-[28px] flex items-center justify-center border",
                isCurrent
                  ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-450 hover:bg-zinc-55 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              {page}
            </button>
          );
        })}

        {/* Next Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent transition-all cursor-pointer"
          title="หน้าถัดไป"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
