import { Hono } from 'hono'
import { createAuthMiddleware, createRoleMiddleware } from "@musicgear/auth-middleware";
import { WebhookController } from './routes/webhooks.js';
import { ReportController } from './routes/reports.js';

const app = new Hono()
const authMiddleware = createAuthMiddleware();

app.get('/', (c) => c.json({ status: 'ok', service: 'report' }))

// QStash Webhooks (No User Auth)
const webhookController = new WebhookController();
app.route('/webhooks', webhookController.router);

// Report APIs (Protected)
const reportController = new ReportController();
app.use('/reports/*', authMiddleware);

// Restrict financial and audit reports to Admin only
const adminOnlyMiddleware = createRoleMiddleware(["admin"]);
app.use('/reports/sales', adminOnlyMiddleware);
app.use('/reports/audit-logs', adminOnlyMiddleware);
app.use('/reports/dashboard-summary', adminOnlyMiddleware);

// Allow staff & admin for inventory-related reports
const staffOrAdminMiddleware = createRoleMiddleware(["admin", "staff"]);
app.use('/reports/inventory-alerts', staffOrAdminMiddleware);
app.use('/reports/inventory', staffOrAdminMiddleware);
app.use('/reports/stock-movement', staffOrAdminMiddleware);

app.route('/reports', reportController.router);

export default app

// Trigger rebuild
// trigger 
