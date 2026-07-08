import { Hono } from 'hono'
import paymentsRouter from "./routes/payments.js";

const app = new Hono()

app.get('/', (c) => c.json({ status: 'ok', service: 'payment' }))
app.route('/payments', paymentsRouter);

export default app
