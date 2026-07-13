import React from "react";
import { Document, Page, Text, View, Font } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";

// Fonts served locally from apps/admin/public/fonts/
// Next.js serves public/ at root, so /fonts/Sarabun-Regular.ttf works
const FONT_BASE = typeof window !== "undefined"
  ? `${window.location.origin}/fonts`
  : "http://localhost:3000/fonts"; // fallback for SSR edge cases

Font.register({
  family: "SarabunLocal",
  fonts: [
    { src: `${FONT_BASE}/Sarabun-Regular.ttf`, fontWeight: 400 },
    { src: `${FONT_BASE}/Sarabun-Bold.ttf`, fontWeight: 700 },
  ],
});

const C = {
  black: "#111111",
  dark: "#333333",
  mid: "#666666",
  light: "#999999",
  border: "#cccccc",
  bg: "#f7f7f7",
  white: "#ffffff",
  navy: "#1a3560",
  navyLight: "#eef2f8",
};

const s = StyleSheet.create({
  page: { fontFamily: "SarabunLocal", backgroundColor: C.white, paddingTop: 40, paddingBottom: 60, paddingHorizontal: 44, fontSize: 9 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 2, borderBottomColor: C.navy, paddingBottom: 10, marginBottom: 20 },
  companyName: { fontSize: 18, fontWeight: 700, color: C.navy },
  companyTag: { fontSize: 8, color: C.mid, marginTop: 2 },
  reportTitle: { fontSize: 13, fontWeight: 700, color: C.navy, textAlign: "right" },
  reportMeta: { fontSize: 8, color: C.mid, textAlign: "right", marginTop: 2 },

  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  kpiBox: { flex: 1, borderWidth: 1, borderColor: C.border, padding: 10, borderRadius: 3 },
  kpiLabel: { fontSize: 7.5, color: C.light, marginBottom: 4 },
  kpiValue: { fontSize: 14, fontWeight: 700, color: C.black },

  sectionTitle: { fontSize: 9, fontWeight: 700, color: C.navy, borderBottomWidth: 1, borderBottomColor: C.navy, paddingBottom: 4, marginBottom: 8, marginTop: 18 },

  tableHeader: { flexDirection: "row", backgroundColor: C.navy, paddingVertical: 6, paddingHorizontal: 8 },
  tableHeaderText: { fontSize: 8, fontWeight: 700, color: C.white },

  tableRowEven: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: C.border },
  tableRowOdd: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.bg },
  tableCell: { fontSize: 8.5, color: C.dark },
  tableCellR: { fontSize: 8.5, color: C.dark, textAlign: "right" },

  tableFooter: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, backgroundColor: C.navyLight, borderTopWidth: 1.5, borderTopColor: C.navy },
  tableFooterText: { fontSize: 8.5, fontWeight: 700, color: C.navy },
  tableFooterTextR: { fontSize: 8.5, fontWeight: 700, color: C.navy, textAlign: "right" },

  footer: { position: "absolute", bottom: 24, left: 44, right: 44, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 6 },
  footerText: { fontSize: 7.5, color: C.light },

  noData: { fontSize: 9, color: C.light, textAlign: "center", paddingVertical: 16 },
});

const THB = (n: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 2 }).format(n);
const NUM = (n: number) => new Intl.NumberFormat("th-TH").format(n);
const thDate = (s: string) => new Date(s).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
const nowStr = () => new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ─────────────────────────────────────────────
// SALES REPORT
// ─────────────────────────────────────────────
export function SalesReportPDF({ data, startDate, endDate }: { data: any; startDate: string; endDate: string }) {
  const trend: any[] = data?.salesTrend ?? [];
  const products: any[] = data?.topProducts ?? [];
  const categories: any[] = data?.categoryDistribution ?? [];

  const totalRevenue = trend.reduce((a, r) => a + Number(r.totalRevenue ?? 0), 0);
  const totalOrders = trend.reduce((a, r) => a + Number(r.totalOrders ?? 0), 0);
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <Document title="รายงานยอดขาย - MusicGear">
      <Page size="A4" style={s.page} wrap>
        <View style={s.headerRow} fixed>
          <View><Text style={s.companyName}>MUSICGEAR</Text><Text style={s.companyTag}>ระบบจัดการคลังสินค้า</Text></View>
          <View>
            <Text style={s.reportTitle}>รายงานยอดขายและประสิทธิภาพ</Text>
            <Text style={s.reportMeta}>ช่วงเวลา: {thDate(startDate)} — {thDate(endDate)}</Text>
            <Text style={s.reportMeta}>สร้างเมื่อ: {nowStr()}</Text>
          </View>
        </View>

        <View style={s.kpiRow}>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>รายรับรวม</Text><Text style={s.kpiValue}>{THB(totalRevenue)}</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>คำสั่งซื้อรวม</Text><Text style={s.kpiValue}>{NUM(totalOrders)} รายการ</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>มูลค่าเฉลี่ย/รายการ</Text><Text style={s.kpiValue}>{THB(aov)}</Text></View>
        </View>

        <View>
          <Text style={s.sectionTitle}>ยอดขายรายวัน</Text>
          <View style={s.tableHeader} fixed>
            <Text style={[s.tableHeaderText, { flex: 2 }]}>วันที่</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: "right" }]}>จำนวนรายการ</Text>
            <Text style={[s.tableHeaderText, { flex: 2, textAlign: "right" }]}>รายรับ (บาท)</Text>
          </View>
          {trend.length === 0 && <Text style={s.noData}>ไม่มีข้อมูลในช่วงเวลานี้</Text>}
          {trend.map((r, i) => (
            <View key={i} style={i % 2 === 0 ? s.tableRowEven : s.tableRowOdd} wrap={false}>
              <Text style={[s.tableCell, { flex: 2 }]}>{new Date(r.reportDate).toLocaleDateString("th-TH")}</Text>
              <Text style={[s.tableCellR, { flex: 1 }]}>{NUM(Number(r.totalOrders))}</Text>
              <Text style={[s.tableCellR, { flex: 2 }]}>{THB(Number(r.totalRevenue))}</Text>
            </View>
          ))}
          {trend.length > 0 && (
            <View style={s.tableFooter}>
              <Text style={[s.tableFooterText, { flex: 2 }]}>รวมทั้งสิ้น</Text>
              <Text style={[s.tableFooterTextR, { flex: 1 }]}>{NUM(totalOrders)}</Text>
              <Text style={[s.tableFooterTextR, { flex: 2 }]}>{THB(totalRevenue)}</Text>
            </View>
          )}
        </View>

        {products.length > 0 && (
          <View wrap={false}>
            <Text style={s.sectionTitle}>สินค้าขายดี</Text>
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderText, { width: 20 }]}>ที่</Text>
              <Text style={[s.tableHeaderText, { flex: 3 }]}>ชื่อสินค้า</Text>
              <Text style={[s.tableHeaderText, { flex: 2 }]}>หมวดหมู่</Text>
              <Text style={[s.tableHeaderText, { flex: 2, textAlign: "right" }]}>จำนวนขาย</Text>
              <Text style={[s.tableHeaderText, { flex: 2, textAlign: "right" }]}>รายรับ (บาท)</Text>
            </View>
            {products.map((p, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRowEven : s.tableRowOdd}>
                <Text style={[s.tableCell, { width: 20 }]}>{i + 1}</Text>
                <Text style={[s.tableCell, { flex: 3 }]}>{p.productName}</Text>
                <Text style={[s.tableCell, { flex: 2 }]}>{p.category ?? "-"}</Text>
                <Text style={[s.tableCellR, { flex: 2 }]}>{NUM(Number(p.quantitySold))}</Text>
                <Text style={[s.tableCellR, { flex: 2 }]}>{THB(Number(p.revenue ?? 0))}</Text>
              </View>
            ))}
          </View>
        )}

        {categories.length > 0 && (
          <View wrap={false}>
            <Text style={s.sectionTitle}>สัดส่วนยอดขายตามหมวดหมู่</Text>
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderText, { flex: 3 }]}>หมวดหมู่</Text>
              <Text style={[s.tableHeaderText, { flex: 2, textAlign: "right" }]}>จำนวน</Text>
            </View>
            {categories.map((c, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRowEven : s.tableRowOdd}>
                <Text style={[s.tableCell, { flex: 3 }]}>{c.category}</Text>
                <Text style={[s.tableCellR, { flex: 2 }]}>{NUM(Number(c.value))}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>MusicGear — เอกสารสร้างโดยระบบอัตโนมัติ</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} จาก ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────
// FINANCIAL REPORT
// ─────────────────────────────────────────────
export function FinancialReportPDF({ data, startDate, endDate }: { data: any; startDate: string; endDate: string }) {
  const trend: any[] = data?.salesTrend ?? [];
  const totalRevenue = trend.reduce((a, r) => a + Number(r.totalRevenue ?? 0), 0);
  const totalOrders = trend.reduce((a, r) => a + Number(r.totalOrders ?? 0), 0);
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <Document title="รายงานการเงิน - MusicGear">
      <Page size="A4" style={s.page} wrap>
        <View style={s.headerRow} fixed>
          <View><Text style={s.companyName}>MUSICGEAR</Text><Text style={s.companyTag}>ระบบจัดการคลังสินค้า</Text></View>
          <View>
            <Text style={s.reportTitle}>รายงานการเงิน</Text>
            <Text style={s.reportMeta}>ช่วงเวลา: {thDate(startDate)} — {thDate(endDate)}</Text>
            <Text style={s.reportMeta}>สร้างเมื่อ: {nowStr()}</Text>
          </View>
        </View>

        <View style={s.kpiRow}>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>รายรับรวม</Text><Text style={s.kpiValue}>{THB(totalRevenue)}</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>คำสั่งซื้อรวม</Text><Text style={s.kpiValue}>{NUM(totalOrders)} รายการ</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>มูลค่าเฉลี่ย/รายการ</Text><Text style={s.kpiValue}>{THB(aov)}</Text></View>
        </View>

        <View>
          <Text style={s.sectionTitle}>สรุปรายรับรายวัน</Text>
          <View style={s.tableHeader} fixed>
            <Text style={[s.tableHeaderText, { flex: 2 }]}>วันที่</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: "right" }]}>จำนวนรายการ</Text>
            <Text style={[s.tableHeaderText, { flex: 2, textAlign: "right" }]}>รายรับ (บาท)</Text>
            <Text style={[s.tableHeaderText, { flex: 2, textAlign: "right" }]}>เฉลี่ย/รายการ</Text>
          </View>
          {trend.length === 0 && <Text style={s.noData}>ไม่มีข้อมูลในช่วงเวลานี้</Text>}
          {trend.map((r, i) => {
            const orders = Number(r.totalOrders ?? 0);
            const rev = Number(r.totalRevenue ?? 0);
            return (
              <View key={i} style={i % 2 === 0 ? s.tableRowEven : s.tableRowOdd} wrap={false}>
                <Text style={[s.tableCell, { flex: 2 }]}>{new Date(r.reportDate).toLocaleDateString("th-TH")}</Text>
                <Text style={[s.tableCellR, { flex: 1 }]}>{NUM(orders)}</Text>
                <Text style={[s.tableCellR, { flex: 2 }]}>{THB(rev)}</Text>
                <Text style={[s.tableCellR, { flex: 2 }]}>{THB(orders > 0 ? rev / orders : 0)}</Text>
              </View>
            );
          })}
          {trend.length > 0 && (
            <View style={s.tableFooter}>
              <Text style={[s.tableFooterText, { flex: 2 }]}>รวม</Text>
              <Text style={[s.tableFooterTextR, { flex: 1 }]}>{NUM(totalOrders)}</Text>
              <Text style={[s.tableFooterTextR, { flex: 2 }]}>{THB(totalRevenue)}</Text>
              <Text style={[s.tableFooterTextR, { flex: 2 }]}>{THB(aov)}</Text>
            </View>
          )}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>MusicGear — เอกสารสร้างโดยระบบอัตโนมัติ</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} จาก ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────
// INVENTORY REPORT
// ─────────────────────────────────────────────
export function InventoryReportPDF({ data }: { data: any }) {
  const items: any[] = data?.items ?? data?.alerts ?? data?.inventory?.alerts ?? [];
  const health: any[] = data?.inventory?.health ?? [];
  const critical = health.find(h => h.name === "Critical")?.value ?? 0;
  const low = health.find(h => h.name === "Low Stock")?.value ?? 0;
  const ok = health.find(h => h.name === "In Stock")?.value ?? 0;

  return (
    <Document title="รายงานสินค้าคงคลัง - MusicGear">
      <Page size="A4" style={s.page} wrap>
        <View style={s.headerRow} fixed>
          <View><Text style={s.companyName}>MUSICGEAR</Text><Text style={s.companyTag}>ระบบจัดการคลังสินค้า</Text></View>
          <View>
            <Text style={s.reportTitle}>รายงานสินค้าคงคลัง</Text>
            <Text style={s.reportMeta}>สร้างเมื่อ: {nowStr()}</Text>
          </View>
        </View>

        <View style={s.kpiRow}>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>สินค้าปกติ</Text><Text style={s.kpiValue}>{NUM(ok)} รายการ</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>สต็อกต่ำ</Text><Text style={s.kpiValue}>{NUM(low)} รายการ</Text></View>
          <View style={s.kpiBox}><Text style={s.kpiLabel}>วิกฤต / หมดสต็อก</Text><Text style={s.kpiValue}>{NUM(critical)} รายการ</Text></View>
        </View>

        <View>
          <Text style={s.sectionTitle}>รายการสินค้าคงคลัง</Text>
          <View style={s.tableHeader} fixed>
            <Text style={[s.tableHeaderText, { flex: 3 }]}>ชื่อสินค้า</Text>
            <Text style={[s.tableHeaderText, { flex: 2 }]}>รหัส (SKU)</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: "right" }]}>คงเหลือ</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: "right" }]}>จุดสั่งซื้อ</Text>
            <Text style={[s.tableHeaderText, { flex: 1, textAlign: "center" }]}>สถานะ</Text>
          </View>
          {items.length === 0 && <Text style={s.noData}>ไม่มีข้อมูลสินค้า</Text>}
          {items.map((item, i) => (
            <View key={i} style={i % 2 === 0 ? s.tableRowEven : s.tableRowOdd} wrap={false}>
              <Text style={[s.tableCell, { flex: 3 }]}>{item.productName ?? item.name}</Text>
              <Text style={[s.tableCell, { flex: 2 }]}>{item.sku}</Text>
              <Text style={[s.tableCellR, { flex: 1 }]}>{NUM(item.stockLevel ?? item.stock ?? 0)}</Text>
              <Text style={[s.tableCellR, { flex: 1 }]}>{NUM(item.reorderPoint ?? item.threshold ?? 0)}</Text>
              <Text style={[s.tableCellR, { flex: 1 }]}>{item.status === "Critical" ? "วิกฤต" : item.status === "Low" ? "ต่ำ" : "ปกติ"}</Text>
            </View>
          ))}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>MusicGear — เอกสารสร้างโดยระบบอัตโนมัติ</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `หน้า ${pageNumber} จาก ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
