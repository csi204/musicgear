import { Hono } from 'hono'
import { createAuthMiddleware } from "@musicgear/auth-middleware";
import cartsRouter from "./routes/carts.js";

const app = new Hono()
const authMiddleware = createAuthMiddleware();

app.get('/health', (c) => c.json({ status: 'ok', service: 'cart-svc' }));
app.route('/carts', cartsRouter);

export default app
