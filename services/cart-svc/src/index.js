import { Hono } from 'hono'
import { createAuthMiddleware } from "@musicgear/auth-middleware";
const app = new Hono()
const authMiddleware = createAuthMiddleware("https://musicgear.kinde.com");

app.get('/health', (c) => c.json({ status: 'ok' }));

export default app
