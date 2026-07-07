"use client";

import { useState, useRef, useEffect } from "react";

type Preset = { label: string; getValue: () => { start: string; end: string } };

const presets: Preset[] = [
  { label: "วันนี้", getValue: () => { const t = today(); return { start: t, end: t }; } },
  { label: "สัปดาห์นี้", getValue: () => { const d = new Date(); const mon = new Date(d); mon.setDate(d.getDate() - d.getDay() + 1); return { start: fmt(mon), end: today() }; } },
  { label: "เดือนนี้", getValue: () => { const d = new Date(); return { start: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`, end: today() }; } },
  { label: "เดือนที่แล้ว", getValue: () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-1); const e = new Date(d.getFullYear(), d.getMonth()+1, 0); return { start: fmt(d), end: fmt(e) }; } },
  { label: "ปีนี้", getValue: () => ({ start: `${new Date().getFullYear()}-01-01`, end: today() }) },
];

function today() { return fmt(new Date()); }
function fmt(d: Date) { return d.toISOString().slice(0, 10); }
function thDate(s: string) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  onChange: (range: { start: string; end: string }) => void;
  initialStart?: string;
  initialEnd?: string;
}

export function DateRangePicker({ onChange, initialStart = "2024-01-01", initialEnd = today() }: Props) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [applied, setApplied] = useState({ start: initialStart, end: initialEnd });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const apply = () => {
    setApplied({ start, end });
    onChange({ start, end });
    setOpen(false);
  };

  const applyPreset = (p: Preset) => {
    const v = p.getValue();
    setStart(v.start);
    setEnd(v.end);
    setApplied(v);
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
        </svg>
        <span className="hidden sm:block">{thDate(applied.start)} — {thDate(applied.end)}</span>
        <span className="sm:hidden">ช่วงวันที่</span>
        <svg className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl w-80 animate-in fade-in zoom-in-95 duration-150">
          {/* Presets */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Manual inputs */}
          <div className="p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ตั้งแต่วันที่</label>
              <input
                type="date"
                value={start}
                max={end}
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ถึงวันที่</label>
              <input
                type="date"
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2 text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={apply}
              className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm"
            >
              นำไปใช้
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
