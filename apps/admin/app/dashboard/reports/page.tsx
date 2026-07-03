"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Button } from "@workspace/ui/components/button";
import { Download } from "lucide-react";

import { SalesReportCharts } from "./components/sales-report";
import { FinancialReportCharts } from "./components/financial-report";
import { InventoryReportCharts } from "./components/inventory-report";

import { pdf } from '@react-pdf/renderer';
import { SalesReportDocument } from "../../components/pdf/SalesReportDocument";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from API Gateway (report-svc)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const end = new Date();
      const start = new Date();
      if (dateRange === "7d") start.setDate(end.getDate() - 7);
      else if (dateRange === "30d") start.setDate(end.getDate() - 30);
      else if (dateRange === "90d") start.setDate(end.getDate() - 90);

      try {
        const res = await fetch(`http://localhost:8787/reports/dashboard-summary`, {
          method: 'QUERY',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start: start.toISOString(), end: end.toISOString() })
        });
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);

  const handleDownloadPDF = async () => {
    if (!data) return;
    const end = new Date();
    const start = new Date();
    if (dateRange === "7d") start.setDate(end.getDate() - 7);
    else if (dateRange === "30d") start.setDate(end.getDate() - 30);
    else if (dateRange === "90d") start.setDate(end.getDate() - 90);

    const doc = <SalesReportDocument data={data} startDate={start.toISOString()} endDate={end.toISOString()} />;
    const asPdf = pdf([]); // create instance
    asPdf.updateContainer(doc);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${dateRange}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleDownloadPDF} disabled={!data || isLoading} variant="outline" className="bg-white text-black hover:bg-gray-100 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="sales" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="sales">ยอดขาย</TabsTrigger>
            <TabsTrigger value="financial">การเงิน</TabsTrigger>
            <TabsTrigger value="inventory">คลังสินค้า</TabsTrigger>
          </TabsList>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="เลือกช่วงเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 วันล่าสุด</SelectItem>
              <SelectItem value="30d">30 วันล่าสุด</SelectItem>
              <SelectItem value="90d">90 วันล่าสุด</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Report</CardTitle>
              <CardDescription>
                Area Chart แสดง Revenue และ Top Performing Products
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center border-t border-muted pb-12 overflow-y-auto">
              {isLoading ? <p>Loading...</p> : <SalesReportCharts data={data} />}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Report</CardTitle>
              <CardDescription>
                KPI Cards และ Bar Chart แสดงยอดรับรายวัน
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center border-t border-muted pb-12 overflow-y-auto">
              {isLoading ? <p>Loading...</p> : <FinancialReportCharts data={data} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Report</CardTitle>
              <CardDescription>
                ระดับสต็อก และ สินค้าที่ใกล้หมด/หมดแล้ว
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center border-t border-muted pb-12 overflow-y-auto">
              {isLoading ? <p>Loading...</p> : <InventoryReportCharts data={data} />}
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
    </div>
  );
}
