import { Hono } from 'hono'
import { createAuthMiddleware } from "@musicgear/auth-middleware";

const app = new Hono()
const authMiddleware = createAuthMiddleware();

app.get('/', (c) => c.json({ status: 'ok', service: 'payment' }))

export default app
