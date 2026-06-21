import { Hono } from "hono";


const app = new Hono();

app.all("/auth/*", (c) => c.env.AUTH_SVC.fetch(c.req.raw));
app.all("/users/*", (c) => c.env.USER_SVC.fetch(c.req.raw));
app.all("/products/*", (c) => c.env.PRODUCT_SVC.fetch(c.req.raw));
app.all("/payments/*", (c) => c.env.PAYMENT_SVC.fetch(c.req.raw));
app.all("/orders/*", (c) => c.env.ORDER_SVC.fetch(c.req.raw));
app.all("/carts/*", (c) => c.env.CART_SVC.fetch(c.req.raw));
app.all("/notifications/*", (c) => c.env.NOTIFICATION_SVC.fetch(c.req.raw));
app.all("/reports/*", authMiddleware, (c) => c.env.REPORT_SVC.fetch(c.req.raw));

app.get("/health", (c) => c.json({ status: "ok", service: "api-gateway" }));

export default app;