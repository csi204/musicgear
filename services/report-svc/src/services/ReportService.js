export class ReportService {
  /**
   * @param {import("../../generated/prisma/client.js").PrismaClient} db
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * บันทึก Audit Log จากเหตุการณ์ในระบบ
   */
  async logAuditEvent(eventType, refId, payload) {
    return await this.db.systemAuditLog.create({
      data: {
        eventType,
        referenceId: refId,
        payload,
      },
    });
  }

  /**
   * อัปเดตยอดขายรายวัน (DailySalesReport)
   * หากไม่มีของวันนี้ ให้สร้างใหม่, ถ้ามีแล้วให้อัปเดตเพิ่ม
   */
  async updateDailySales(amount) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Normalize to start of day in UTC

    // Prisma doesn't have an easy "upsert by increment" that works atomically in one query without raw SQL or a specific unique key setup.
    // However, since reportDate is @unique, we can use upsert.
    return await this.db.dailySalesReport.upsert({
      where: { reportDate: today },
      update: {
        totalOrders: { increment: 1 },
        totalRevenue: { increment: amount },
      },
      create: {
        reportDate: today,
        totalOrders: 1,
        totalRevenue: amount,
      },
    });
  }

  /**
   * ดึงรายงานยอดขายตามช่วงเวลา
   */
  async getSalesReports(startDate, endDate) {
    return await this.db.dailySalesReport.findMany({
      where: {
        reportDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        reportDate: 'asc',
      },
    });
  }

  /**
   * ดึงประวัติ Audit Log 
   */
  async getAuditLogs(eventType, limit = 50) {
    const whereClause = eventType ? { eventType } : {};
    return await this.db.systemAuditLog.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}
