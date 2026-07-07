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
    // 1. Sales Trends (DailySalesReport)
    const salesTrends = await this.db.dailySalesReport.findMany({
      where: {
        reportDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { reportDate: 'asc' },
    });

    // 2. Top Selling Gear & Category Distribution (ProductSalesSnapshot)
    const productSales = await this.db.productSalesSnapshot.findMany({
      where: {
        reportDate: {
          gte: startDate,
          lte: endDate,
        }
      }
    });

    const topSellingMap = new Map();
    const categoryMap = new Map();

    for (const p of productSales) {
      // Top Selling
      topSellingMap.set(p.productId, {
        productName: p.productName,
        sold: (topSellingMap.get(p.productId)?.sold || 0) + p.quantitySold
      });
      // Category
      categoryMap.set(p.category, (categoryMap.get(p.category) || 0) + p.quantitySold);
    }

    const topSellingGear = Array.from(topSellingMap.values())
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const totalCategorySales = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value: totalCategorySales > 0 ? Math.round((value / totalCategorySales) * 100) : 0
    }));

    return {
      salesTrends,
      topSellingGear,
      categoryDistribution
    };
  }

  /**
   * ดึง Low Stock Alerts
   */
  async getLowStockAlerts(limit = 10, page = 1) {
    const skip = (page - 1) * limit;
    const [alerts, total] = await Promise.all([
      this.db.inventorySnapshot.findMany({
        where: { status: { in: ["Low", "Critical"] } },
        orderBy: { stockLevel: 'asc' },
        take: limit,
        skip
      }),
      this.db.inventorySnapshot.count({
        where: { status: { in: ["Low", "Critical"] } }
      })
    ]);

    return {
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * ดึงข้อมูล Inventory ทั้งหมด (ไม่กรองสถานะ) พร้อม pagination
   */
  async getAllInventory(limit = 12, page = 1) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.db.inventorySnapshot.findMany({
        orderBy: [{ status: 'asc' }, { stockLevel: 'asc' }],
        take: limit,
        skip,
      }),
      this.db.inventorySnapshot.count(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  /**
   * ดึงข้อมูลสำหรับ Admin Dashboard Overview
   */
  async getDashboardSummary(startDate, endDate) {
    const [salesTrend, productSales, inventory] = await Promise.all([
      // 1. Sales Trend (Line Chart)
      this.db.dailySalesReport.findMany({
        where: {
          reportDate: { gte: startDate, lte: endDate },
        },
        orderBy: { reportDate: 'asc' },
      }),
      
      // 2. Top Selling Products & 3. Category Distribution
      this.db.productSalesSnapshot.findMany({
        where: {
          reportDate: { gte: startDate, lte: endDate },
        },
      }),

      // 4. Inventory Data
      this.db.inventorySnapshot.findMany()
    ]);

    // Aggregate manually since Prisma SQLite/workerd groupBy can be tricky or have limitations
    const productMap = new Map();
    const categoryMap = new Map();

    for (const p of productSales) {
      // Top Products
      const curr = productMap.get(p.productId) || { productName: p.productName, category: p.category, quantitySold: 0, revenue: 0 };
      curr.quantitySold += p.quantitySold;
      curr.revenue += Number(p.revenue || 0);
      productMap.set(p.productId, curr);

      // Category Dist
      const c = categoryMap.get(p.category) || 0;
      categoryMap.set(p.category, c + p.quantitySold);
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5); // Top 5

    const categoryDistribution = Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value
    }));

    const stockLevelsByCategory = {};
    const stockHealthDistribution = { 'In Stock': 0, 'Low': 0, 'Critical': 0 };
    const lowStockAlerts = [];

    for (const item of inventory) {
      // Stock by category
      stockLevelsByCategory[item.category] = (stockLevelsByCategory[item.category] || 0) + item.stockLevel;
      
      // Stock health
      if (item.status === 'Critical') stockHealthDistribution['Critical']++;
      else if (item.status === 'Low') stockHealthDistribution['Low']++;
      else stockHealthDistribution['In Stock']++;

      // Low stock alerts
      if (item.status === 'Critical' || item.status === 'Low') {
        lowStockAlerts.push(item);
      }
    }

    const formattedStockHealth = [
      { name: 'In Stock', value: stockHealthDistribution['In Stock'], color: '#2BBF7A' },
      { name: 'Low Stock', value: stockHealthDistribution['Low'], color: '#FF8A3D' },
      { name: 'Critical', value: stockHealthDistribution['Critical'], color: '#E54848' },
    ];

    const formattedStockByCategory = Object.entries(stockLevelsByCategory).map(([category, stockLevel]) => ({
      category,
      stockLevel
    }));

    return {
      salesTrend,
      topProducts,
      categoryDistribution,
      inventory: {
        health: formattedStockHealth,
        byCategory: formattedStockByCategory,
        alerts: lowStockAlerts.sort((a, b) => a.stockLevel - b.stockLevel).slice(0, 10) // Top 10 worst
      }
    };
  }
}
