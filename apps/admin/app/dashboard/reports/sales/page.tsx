"use client";

import { useState, useEffect } from "react";
import { DateRangePicker } from "../../../components/date-range-picker";
import { FileDown, X, Eye } from "lucide-react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { SalesReportPDF } from "../../../components/pdf/sales-report-pdf";

export default function SalesReportPage() {
  const [dateRange, setDateRange] = useState({ start: "2024-01-01", end: "2024-12-31" });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Mock fetch based on the date range
    setData({
      salesTrends: [
        { name: "Mon", totalRevenue: 12000 },
        { name: "Tue", totalRevenue: 15000 },
        { name: "Wed", totalRevenue: 8000 },
        { name: "Thu", totalRevenue: 22000 },
        { name: "Fri", totalRevenue: 18000 },
        { name: "Sat", totalRevenue: 25000 },
        { name: "Sun", totalRevenue: 20000 },
      ],
      topSellingGear: [
        { productName: "Fender Stratocaster", sold: 124 },
        { productName: "Roland Jupiter-X", sold: 98 },
        { productName: "Shure SM7B", sold: 82 },
      ]
    });
  }, [dateRange]);

  const handleExportClick = () => {
    setIsExportModalOpen(true);
    setShowPreview(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">รายงานยอดขาย</h2>
          <p className="text-muted-foreground mt-1">ข้อมูลยอดขาย และการส่งออกรายงาน (PDF)</p>
        </div>
        
        <div className="flex items-center gap-3">
          <DateRangePicker onChange={setDateRange} />
          <button 
            onClick={handleExportClick}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-sm font-medium h-full"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Basic Dashboard UI for Sales Report */}
      <div className="bg-background rounded-xl p-6 border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">ข้อมูลยอดขายเบื้องต้น (พรีวิว)</h3>
        {data && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ข้อมูลตั้งแต่วันที่ {dateRange.start} ถึง {dateRange.end}
            </p>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">สินค้า</th>
                    <th className="px-4 py-3 text-right">ยอดขาย (ชิ้น)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.topSellingGear.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-3">{item.productName}</td>
                      <td className="px-4 py-3 text-right font-medium">{item.sold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Export Confirmation Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-background border shadow-lg rounded-xl w-full max-w-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">ส่งออกรายงานเป็น PDF</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 flex-1 overflow-auto">
              {!showPreview ? (
                <div className="py-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
                    <FileDown className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-medium text-foreground">คุณแน่ใจหรือไม่ที่จะส่งออกรายงานเป็น PDF?</h4>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    ข้อมูลรายงานตั้งแต่วันที่ {dateRange.start} ถึง {dateRange.end} จะถูกสร้างเป็นไฟล์ PDF เพื่อให้คุณดาวน์โหลด
                  </p>
                </div>
              ) : (
                <div className="h-[500px] border rounded-md overflow-hidden bg-muted/30">
                  <PDFViewer width="100%" height="100%">
                    <SalesReportPDF data={data} dateRange={dateRange} />
                  </PDFViewer>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-muted/20 flex justify-between items-center">
              {!showPreview ? (
                <button 
                  onClick={() => setShowPreview(true)} 
                  className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors text-primary"
                >
                  <Eye className="w-4 h-4" />
                  พรีวิวเอกสารก่อนโหลด
                </button>
              ) : (
                <button 
                  onClick={() => setShowPreview(false)} 
                  className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
                >
                  กลับไปหน้ายืนยัน
                </button>
              )}
              
              <div className="flex gap-3">
                <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors">
                  ยกเลิก
                </button>
                <PDFDownloadLink
                  document={<SalesReportPDF data={data} dateRange={dateRange} />}
                  fileName={`sales_report_${dateRange.start}_${dateRange.end}.pdf`}
                >
                  {/* @ts-ignore */}
                  {({ loading }) => (
                    <button 
                      disabled={loading}
                      onClick={() => !loading && setIsExportModalOpen(false)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด PDF'}
                    </button>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
