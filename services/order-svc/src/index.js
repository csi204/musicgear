import { Hono } from 'hono'
import { createAuthMiddleware } from "@musicgear/auth-middleware";

const app = new Hono()
const authMiddleware = createAuthMiddleware("https://musicgear.kinde.com");

app.get('/', (c) => c.json({ status: 'ok', service: 'order-svc' }));

export default app
