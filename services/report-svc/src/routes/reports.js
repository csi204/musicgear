import { Hono } from "hono";
import { createClient } from "../db/client.js";
import { ReportService } from "../services/ReportService.js";

export class ReportController {
  constructor() {
    this.router = new Hono();
    this.registerRoutes();
  }

  registerRoutes() {
    const salesHandler = async (c) => {
      let start, end;
      if (c.req.method === "QUERY") {
        const body = await c.req.json().catch(() => ({}));
        start = body.start;
        end = body.end;
      } else {
        start = c.req.query("start");
        end = c.req.query("end");
      }

      if (!start || !end) {
        return c.json({ error: { code: "VALIDATION_ERROR", message: "Missing start or end date query params" } }, 400);
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return c.json({ error: { code: "VALIDATION_ERROR", message: "Invalid date format" } }, 400);
      }

      const db = createClient(c.env.DATABASE_URL);
      const reportService = new ReportService(db);

      try {
        const data = await reportService.getSalesReports(startDate, endDate);
        return c.json(data, 200);
      } catch (err) {
        console.error("[GET /reports/sales]", err);
        return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
      }
    };
    this.router.get("/sales", salesHandler);
    this.router.on("QUERY", "/sales", salesHandler);

    // GET /audit-logs?type=payment.success&limit=10
    const auditLogsHandler = async (c) => {
      let type, limitParam;
      if (c.req.method === "QUERY") {
        const body = await c.req.json().catch(() => ({}));
        type = body.type;
        limitParam = body.limit;
      } else {
        type = c.req.query("type");
        limitParam = c.req.query("limit");
      }
      const limit = parseInt(limitParam || "50", 10);

      if (isNaN(limit)) {
        return c.json({ error: { code: "VALIDATION_ERROR", message: "Invalid limit format" } }, 400);
      }

      const db = createClient(c.env.DATABASE_URL);
      const reportService = new ReportService(db);

      try {
        const data = await reportService.getAuditLogs(type, limit);
        return c.json(data, 200);
      } catch (err) {
        console.error("[GET /reports/audit-logs]", err);
        return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
      }
    };
    this.router.get("/audit-logs", auditLogsHandler);
    this.router.on("QUERY", "/audit-logs", auditLogsHandler);

    // GET & QUERY /dashboard-summary
    const dashboardSummaryHandler = async (c) => {
      let start, end;
      if (c.req.method === "QUERY") {
        const body = await c.req.json().catch(() => ({}));
        start = body.start;
        end = body.end;
      } else {
        start = c.req.query("start");
        end = c.req.query("end");
      }

      if (!start || !end) {
        return c.json({ error: { code: "VALIDATION_ERROR", message: "Missing start or end date query params" } }, 400);
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return c.json({ error: { code: "VALIDATION_ERROR", message: "Invalid date format" } }, 400);
      }

      const db = createClient(c.env.DATABASE_URL);
      const reportService = new ReportService(db);

      try {
        const data = await reportService.getDashboardSummary(startDate, endDate);
        return c.json(data, 200);
      } catch (err) {
        console.error("[GET /reports/dashboard-summary]", err);
        return c.json({ error: { code: "INTERNAL_ERROR", message: err.message, stack: err.stack } }, 500);
      }
    };
    
    this.router.get("/dashboard-summary", dashboardSummaryHandler);
    this.router.on("QUERY", "/dashboard-summary", dashboardSummaryHandler);

    // GET /inventory-alerts?page=1&limit=10
    const inventoryAlertsHandler = async (c) => {
      let pageParam, limitParam;
      if (c.req.method === "QUERY") {
        const body = await c.req.json().catch(() => ({}));
        pageParam = body.page;
        limitParam = body.limit;
      } else {
        pageParam = c.req.query("page");
        limitParam = c.req.query("limit");
      }
      const page = parseInt(pageParam || "1", 10);
      const limit = parseInt(limitParam || "10", 10);

      const db = createClient(c.env.DATABASE_URL);
      const reportService = new ReportService(db);

      try {
        const data = await reportService.getLowStockAlerts(limit, page);
        return c.json(data, 200);
      } catch (err) {
        console.error("[GET /reports/inventory-alerts]", err);
        return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
      }
    };
    this.router.get("/inventory-alerts", inventoryAlertsHandler);
    this.router.on("QUERY", "/inventory-alerts", inventoryAlertsHandler);

    // GET /inventory?page=1&limit=12  — ดึงสินค้าทั้งหมดในคลัง (ไม่กรองสถานะ)
    const allInventoryHandler = async (c) => {
      const pageParam = c.req.query("page");
      const limitParam = c.req.query("limit");
      const page = parseInt(pageParam || "1", 10);
      const limit = parseInt(limitParam || "12", 10);

      const db = createClient(c.env.DATABASE_URL);
      const reportService = new ReportService(db);

      try {
        const data = await reportService.getAllInventory(limit, page);
        return c.json(data, 200);
      } catch (err) {
        console.error("[GET /reports/inventory]", err);
        return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
      }
    };
    this.router.get("/inventory", allInventoryHandler);

    // GET /stock-movement — ดึงสรุปการเข้า-ออกของสต็อกรายเดือนย้อนหลัง 12 เดือน
    const stockMovementHandler = async (c) => {
      const db = createClient(c.env.DATABASE_URL);
      try {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const logs = await db.systemAuditLog.findMany({
          where: {
            eventType: "stock.updated",
            createdAt: { gte: oneYearAgo },
          },
          orderBy: { createdAt: "asc" },
        });

        const monthlyData = {};
        const monthsTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        
        for (let i = 11; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthlyData[key] = { label: monthsTH[d.getMonth()], stockIn: 0, stockOut: 0 };
        }

        for (const log of logs) {
          const date = new Date(log.createdAt);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData[key]) continue;

          let payload = log.payload;
          if (typeof payload === "string") {
            try {
              payload = JSON.parse(payload);
            } catch {
              continue;
            }
          }

          const beforeVal = parseInt(payload.beforeQty) || 0;
          const afterVal = parseInt(payload.afterQty) || 0;
          const diff = afterVal - beforeVal;

          if (diff > 0) {
            monthlyData[key].stockIn += diff;
          } else if (diff < 0) {
            monthlyData[key].stockOut += Math.abs(diff);
          }
        }

        const movement = Object.values(monthlyData);
        return c.json({ status: "ok", movement }, 200);
      } catch (err) {
        console.error("[GET /reports/stock-movement]", err);
        return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
      }
    };
    this.router.get("/stock-movement", stockMovementHandler);
  }
}

