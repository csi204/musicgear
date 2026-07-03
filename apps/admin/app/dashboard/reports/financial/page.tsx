"use client";

import { useState } from "react";
import { DateRangePicker } from "../../../components/date-range-picker";
import { DollarSign, WalletCards, CreditCard, Banknote } from "lucide-react";

export default function FinancialReportPage() {
  const [dateRange, setDateRange] = useState({ start: "2024-01-01", end: "2024-12-31" });

  // Mock financial data (Revenue only as per requirement)
  const revenueData = {
    totalRevenue: 2450000,
    creditCard: 1500000,
    promptPay: 850000,
    cashOnDelivery: 100000
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">รายงานรายรับ (Financial)</h2>
          <p className="text-muted-foreground mt-1">สรุปข้อมูลรายรับแยกตามช่องทางการชำระเงิน</p>
        </div>
        
        <div className="flex items-center gap-3">
          <DateRangePicker onChange={setDateRange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background rounded-xl p-6 border shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-muted-foreground">รายรับรวมทั้งหมด</span>
            <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-foreground">
              ฿{revenueData.totalRevenue.toLocaleString()}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              ตั้งแต่ {dateRange.start} ถึง {dateRange.end}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-background rounded-xl p-6 border shadow-sm">
        <h3 className="text-lg font-semibold mb-6">รายรับแยกตามช่องทางการชำระเงิน</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">บัตรเครดิต/เดบิต</p>
              <p className="text-xl font-bold">฿{revenueData.creditCard.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="p-3 bg-purple-500/10 rounded-full text-purple-500">
              <WalletCards className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PromptPay (QR Code)</p>
              <p className="text-xl font-bold">฿{revenueData.promptPay.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="p-3 bg-orange-500/10 rounded-full text-orange-500">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">เก็บเงินปลายทาง (COD)</p>
              <p className="text-xl font-bold">฿{revenueData.cashOnDelivery.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
