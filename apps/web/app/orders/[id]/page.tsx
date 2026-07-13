import { OrderDetailsClient } from "./order-details-client";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;

  return <OrderDetailsClient orderId={orderId} />;
}
