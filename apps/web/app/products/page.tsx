import Link from "next/link";

export default function ProductsPage() {
  return (
    <div className="flex min-h-svh flex-col gap-4 p-6 text-sm">
      <h1 className="font-medium">สินค้า</h1>
      <p>หน้านี้เปิดให้ guest ดูได้โดยไม่ต้อง login</p>
      <Link className="text-primary underline" href="/">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
