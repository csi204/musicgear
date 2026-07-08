export class PaymentService {
  static async publishPaymentSuccess(env, payload) {
    const qstashUrl = env.QSTASH_URL;
    const qstashToken = env.QSTASH_TOKEN;

    const subscribers = [
      `${env.NOTIFICATION_SVC_URL || "http://localhost:8791"}/webhooks/qstash`,
      `${env.REPORT_SVC_URL || "http://localhost:8795"}/webhooks/qstash`,
      `${env.ORDER_SVC_URL || "http://localhost:8792"}/webhooks/qstash`,
    ];

    if (!qstashUrl || !qstashToken) {
      console.warn("[payment-svc] QStash not configured — falling back to direct HTTP requests");
      for (const url of subscribers) {
        try {
          console.info(`[payment-svc] Direct webhook dispatching success event to: ${url}`);
          await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (err) {
          console.error(`[payment-svc] Failed to dispatch webhook to ${url}:`, err.message);
        }
      }
      return;
    }

    // Publish to QStash subscribers
    for (const url of subscribers) {
      try {
        console.info(`[payment-svc] Publishing success event to QStash for subscriber: ${url}`);
        const res = await fetch(`${qstashUrl}/v2/publish/${url}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${qstashToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error(`[payment-svc] QStash failed to publish to ${url}: ${res.status} ${text}`);
        }
      } catch (err) {
        console.error(`[payment-svc] QStash publish error to ${url}:`, err.message);
      }
    }
  }

  static async processPayment(prisma, env, { orderId, paymentMethod, token }, authHeader, executionCtx) {
    // 1. Fetch Order Details from ORDER_SVC
    let order;
    const orderRes = await env.ORDER_SVC.fetch(`http://order-svc/orders/${orderId}`, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!orderRes.ok) {
      if (orderRes.status === 404) {
        throw new Error("ORDER_NOT_FOUND");
      }
      throw new Error("ORDER_SVC_ERROR");
    }

    order = await orderRes.json();

    // 2. Validate Order Status
    if (order.status !== "pending") {
      throw new Error("INVALID_ORDER_STATUS");
    }

    const amountInThb = Number(order.grandTotal);
    const amountInSatang = Math.round(amountInThb * 100);

    // 3. Call Omise API to charge
    const omiseSecretKey = env.OMISE_SECRET_KEY || "mock";
    let charge;

    if (omiseSecretKey === "mock" || token === "mock-payment") {
      // Mock successful transaction
      charge = {
        id: `chg_mock_${crypto.randomUUID().substring(0, 8)}`,
        status: "successful",
        amount: amountInSatang,
        currency: "thb",
      };
    } else {
      const auth = "Basic " + btoa(omiseSecretKey + ":");
      const omiseRes = await fetch("https://api.omise.co/charges", {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInSatang,
          currency: "thb",
          card: token,
        }),
      });

      if (!omiseRes.ok) {
        const errorText = await omiseRes.text();
        console.error("[payment-svc] Omise charge error:", errorText);
        
        // Save failed payment record
        await prisma.payment.create({
          data: {
            orderId,
            paymentMethod,
            amount: amountInThb,
            status: "failed",
          },
        });

        throw new Error("PAYMENT_FAILED");
      }

      charge = await omiseRes.json();
    }

    const isSuccess = charge.status === "successful";

    // 4. Save Payment Record to Neon DB
    const payment = await prisma.payment.create({
      data: {
        orderId,
        paymentMethod,
        amount: amountInThb,
        status: isSuccess ? "paid" : "failed",
        transactionRef: charge.id,
        paidAt: isSuccess ? new Date() : null,
      },
    });

    if (!isSuccess) {
      throw new Error("PAYMENT_FAILED");
    }

    // 5. Build items details for payment.success event (fetching name/category from PRODUCT_SVC)
    const successItems = [];
    for (const item of order.items) {
      let productName = "Unknown Product";
      let category = "Unknown Category";
      try {
        const prodRes = await env.PRODUCT_SVC.fetch(`http://product-svc/products/${item.productId}`);
        if (prodRes.ok) {
          const product = await prodRes.json();
          productName = product.name || productName;
          category = product.category?.name || category;
        }
      } catch (err) {
        console.warn(`[payment-svc] Failed to fetch product details for ${item.productId}:`, err.message);
      }

      successItems.push({
        productId: item.productId,
        productName,
        category,
        quantitySold: item.quantity,
        revenue: Number(item.unitPrice) * item.quantity,
      });
    }

    // 6. Publish payment.success event to QStash
    const payload = {
      event: "payment.success",
      orderId: order.orderId,
      customerId: order.customerId,
      amount: amountInThb,
      items: successItems,
    };

    // Run async without blocking response
    executionCtx.waitUntil(this.publishPaymentSuccess(env, payload));

    return payment;
  }

  static async refundPayment(prisma, env, paymentId) {
    // 1. Find payment record
    const payment = await prisma.payment.findUnique({
      where: { paymentId },
    });

    if (!payment) {
      throw new Error("PAYMENT_NOT_FOUND");
    }

    if (payment.status !== "paid") {
      throw new Error("INVALID_PAYMENT_STATUS");
    }

    const omiseSecretKey = env.OMISE_SECRET_KEY || "mock";
    
    if (omiseSecretKey !== "mock" && payment.transactionRef && !payment.transactionRef.startsWith("chg_mock_")) {
      // Call Omise API to refund
      const auth = "Basic " + btoa(omiseSecretKey + ":");
      const refundRes = await fetch(`https://api.omise.co/charges/${payment.transactionRef}/refunds`, {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(Number(payment.amount) * 100),
        }),
      });

      if (!refundRes.ok) {
        const errorText = await refundRes.text();
        console.error("[payment-svc] Omise refund error:", errorText);
        throw new Error("REFUND_API_FAILED");
      }
    }

    // 2. Update status in Postgres
    return prisma.payment.update({
      where: { paymentId },
      data: {
        status: "refunded",
      },
    });
  }
}
