import Link from "next/link";

export default function CartPage() {
  return (
    <div className="flex min-h-svh flex-col gap-4 p-6 text-sm">
      <h1 className="font-medium">ตะกร้าสินค้า</h1>
      <p>guest สามารถ add to cart ได้โดยไม่ต้อง login</p>
      <Link className="text-primary underline" href="/checkout">
        ไปชำระเงิน
      </Link>
    </div>
  );
}
