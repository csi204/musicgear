import { Hono } from "hono";
import { createClient } from "../db/client.js";
import { ReportService } from "../services/ReportService.js";

export class ReportController {
  constructor() {
    this.router = new Hono();
    this.registerRoutes();
  }

  registerRoutes() {
    // GET /sales?start=2024-01-01&end=2024-12-31
    this.router.get("/sales", async (c) => {
      const start = c.req.query("start");
      const end = c.req.query("end");

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
    });

    // GET /audit-logs?type=payment.success&limit=10
    this.router.get("/audit-logs", async (c) => {
      const type = c.req.query("type");
      const limitParam = c.req.query("limit");
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
    });
  }
}
