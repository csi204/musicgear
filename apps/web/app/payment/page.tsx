import { PaymentClient } from "./payment-client";

interface PageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function PaymentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const orderId = params.orderId || "";

  return <PaymentClient orderId={orderId} />;
}
