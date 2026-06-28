import { Hono } from 'hono'
import { createAuthMiddleware } from "@musicgear/auth-middleware";
import ordersRouter from "./routes/orders.js";

const app = new Hono()
const authMiddleware = createAuthMiddleware("https://musicgear.kinde.com");

app.get('/', (c) => c.json({ status: 'ok', service: 'order-svc' }));

// Apply Kinde Auth to all order routes
app.use('/orders/*', authMiddleware);
app.route('/orders', ordersRouter);

export default app
