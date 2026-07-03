import { Hono } from 'hono'
import { createAuthMiddleware, createRoleMiddleware } from "@musicgear/auth-middleware";
import { WebhookController } from './routes/webhooks.js';
import { ReportController } from './routes/reports.js';

const app = new Hono()
const authMiddleware = createAuthMiddleware("https://musicgear.kinde.com");

app.get('/', (c) => c.json({ status: 'ok', service: 'report' }))

// QStash Webhooks (No User Auth)
const webhookController = new WebhookController();
app.route('/webhooks', webhookController.router);

// Report APIs (Protected: Admin only)
const reportController = new ReportController();
app.use('/reports/*', authMiddleware);
app.use('/reports/*', createRoleMiddleware(["admin", "staff"])); // Included staff just in case, but can be admin only
app.route('/reports', reportController.router);

export default app

// Trigger rebuild
