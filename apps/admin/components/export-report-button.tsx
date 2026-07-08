"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { DateRangePicker } from "@/components/date-range-picker";
import { SalesReportPDF, FinancialReportPDF, InventoryReportPDF } from "@/components/pdf/ReportDocuments";

// react-pdf components — client-side only
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => null }
);

const BlobProvider = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.BlobProvider),
  { ssr: false, loading: () => null }
);

type ReportType = "sales" | "financial" | "inventory";

interface Props {
  reportType: ReportType;
  data: any;
  onRangeChange?: (range: { start: string; end: string }) => void;
}

function today() { return new Date().toISOString().slice(0, 10); }
function thDate(s: string) {
  return new Date(s).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function exportCSV(reportType: ReportType, data: any, start: string, end: string) {
  const rows: string[] = [];
  const period = `"ช่วงเวลา: ${thDate(start)} ถึง ${thDate(end)}"`;

  if (reportType === "sales") {
    rows.push("รายงานยอดขาย - MusicGear", period, "");
    rows.push("วันที่,จำนวนรายการ,รายรับ (บาท)");
    (data?.salesTrend ?? []).forEach((r: any) => {
      rows.push(`${new Date(r.reportDate).toLocaleDateString("th-TH")},${r.totalOrders},${Number(r.totalRevenue).toFixed(2)}`);
    });
    rows.push("", "สินค้าขายดี", "อันดับ,ชื่อสินค้า,หมวดหมู่,จำนวนขาย,รายรับ (บาท)");
    (data?.topProducts ?? []).forEach((p: any, i: number) => {
      rows.push(`${i + 1},"${p.productName}","${p.category ?? ""}",${p.quantitySold},${Number(p.revenue ?? 0).toFixed(2)}`);
    });
  } else if (reportType === "financial") {
    rows.push("รายงานการเงิน - MusicGear", period, "");
    rows.push("วันที่,จำนวนรายการ,รายรับ (บาท),เฉลี่ย/รายการ (บาท)");
    (data?.salesTrend ?? []).forEach((r: any) => {
      const orders = Number(r.totalOrders ?? 0);
      const rev = Number(r.totalRevenue ?? 0);
      rows.push(`${new Date(r.reportDate).toLocaleDateString("th-TH")},${orders},${rev.toFixed(2)},${orders > 0 ? (rev / orders).toFixed(2) : "0.00"}`);
    });
  } else if (reportType === "inventory") {
    rows.push("รายงานสินค้าคงคลัง - MusicGear", `"สร้างเมื่อ: ${new Date().toLocaleDateString("th-TH")}"`, "");
    rows.push("ชื่อสินค้า,รหัสสินค้า,จำนวนคงเหลือ,จุดสั่งซื้อ,สถานะ");
    const items = data?.items ?? data?.alerts ?? data?.inventory?.alerts ?? [];
    items.forEach((item: any) => {
      rows.push(`"${item.productName ?? item.name}","${item.sku}",${item.stockLevel ?? 0},${item.reorderPoint ?? 0},"${item.status === "Critical" ? "วิกฤต" : item.status === "Low" ? "ต่ำ" : "ปกติ"}"`);
    });
  }

  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `musicgear-${reportType}-${start}-${end}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getPDFDocument(reportType: ReportType, data: any, start: string, end: string) {
  if (reportType === "sales")
    return <SalesReportPDF data={data} startDate={start} endDate={end} />;
  if (reportType === "financial")
    return <FinancialReportPDF data={data} startDate={start} endDate={end} />;
  return <InventoryReportPDF data={data} />;
}

const reportLabels: Record<ReportType, string> = {
  sales: "รายงานยอดขาย",
  financial: "รายงานการเงิน",
  inventory: "รายงานสินค้าคงคลัง",
};

export function ExportReportButton({ reportType, data, onRangeChange }: Props) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState({ start: "2024-01-01", end: today() });

  const handleRangeChange = (r: { start: string; end: string }) => {
    setRange(r);
    onRangeChange?.(r);
  };

  const hasData = !!data;
  const pdfDoc = hasData ? getPDFDocument(reportType, data, range.start, range.end) : null;
  const fileName = `musicgear-${reportType}-${range.start}-${range.end}.pdf`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
      >
        ออกรายงาน
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 border border-zinc-200 dark:border-zinc-700">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">ออกรายงาน</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{reportLabels[reportType]}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Date Range */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">เลือกช่วงเวลา</p>
              <DateRangePicker onChange={handleRangeChange} />
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 space-y-2">
              {/* CSV */}
              <button
                onClick={() => { exportCSV(reportType, data, range.start, range.end); setOpen(false); }}
                disabled={!hasData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
              >
                ดาวน์โหลด CSV
              </button>

              {/* Preview in browser + Download PDF — using BlobProvider */}
              {pdfDoc && (
                <BlobProvider document={pdfDoc}>
                  {({ blob, url, loading, error }) => (
                    <div className="flex gap-2">
                      {/* Preview */}
                      <button
                        disabled={loading || !!error || !url}
                        onClick={() => { window.open(url!, "_blank"); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                      >
                        {loading ? "กำลังสร้าง..." : error ? "ผิดพลาด" : "ดูตัวอย่าง"}
                      </button>

                      {/* Download */}
                      <a
                        href={url ?? "#"}
                        download={fileName}
                        onClick={(e) => { if (!url) e.preventDefault(); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          loading || !url
                            ? "bg-zinc-900/40 dark:bg-white/40 text-white dark:text-zinc-900 cursor-not-allowed"
                            : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
                        }`}
                      >
                        {loading ? "..." : "ดาวน์โหลด PDF"}
                      </a>
                    </div>
                  )}
                </BlobProvider>
              )}

              {!hasData && (
                <div className="w-full flex items-center justify-center px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-xl text-sm">
                  รอข้อมูลโหลดก่อน
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
