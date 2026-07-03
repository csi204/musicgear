"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

export function DateRangePicker({ onChange }: { onChange: (range: { start: string, end: string }) => void }) {
  // A simple mock for Date Range Picker component
  // In a real app, you'd use a library like react-day-picker + date-fns
  const [start, setStart] = useState("2024-01-01");
  const [end, setEnd] = useState("2024-12-31");

  const handleApply = () => {
    onChange({ start, end });
  };

  return (
    <div className="flex items-center gap-2 bg-background border p-1 rounded-md shadow-sm">
      <div className="flex items-center gap-2 px-3">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <input 
          type="date" 
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="text-sm bg-transparent border-none outline-none cursor-pointer"
        />
        <span className="text-muted-foreground">-</span>
        <input 
          type="date" 
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="text-sm bg-transparent border-none outline-none cursor-pointer"
        />
      </div>
      <button 
        onClick={handleApply}
        className="px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded hover:bg-primary/90 transition-colors"
      >
        นำไปใช้
      </button>
    </div>
  );
}
