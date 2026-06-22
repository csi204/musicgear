import Link from "next/link";
import { LoginButton } from "../components/login-button";

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">MusicGear Web</h1>
          <p>ดูสินค้าและเพิ่มลงตะกร้าได้โดยไม่ต้อง login</p>
          <p>ชำระเงินและคำสั่งซื้อต้อง login ก่อน</p>
          <div className="mt-4">
            <LoginButton />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link className="text-primary underline" href="/products">
            ดูสินค้า (guest)
          </Link>
          <Link className="text-primary underline" href="/cart">
            ตะกร้าสินค้า (guest)
          </Link>
          <Link className="text-primary underline" href="/checkout">
            ชำระเงิน (ต้อง login)
          </Link>
        </div>
        <div className="text-muted-foreground font-mono text-xs">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  );
}
