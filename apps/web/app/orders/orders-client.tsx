"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl, getAccessToken, fetchCurrentUser, isAuthenticated } from "../../lib/auth";
import { Navbar } from "../../components/navbar";
import { Footer } from "../../components/footer";
import { 
  ShoppingBag, 
  ChevronRight, 
  Calendar, 
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

interface Order {
  orderId: string;
  orderDate: string;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
  status: "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";
  paymentMethod?: "online" | "cod";
  remark?: string;
  items: {
    orderItemId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export function OrdersClient() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login?redirect_uri=" + encodeURIComponent(window.location.pathname));
      return;
    }

    async function loadOrders() {
      const token = getAccessToken();
      if (!token) return;

      try {
        setLoading(true);
        // 1. Fetch Kinde profile to get Kinde customer ID
        const user = await fetchCurrentUser();
        if (!user) {
          setErrorMsg("ไม่พบข้อมูลผู้ใช้งาน");
          return;
        }

        // 2. Fetch orders list from order-svc
        const res = await fetch(`${getApiBaseUrl()}/orders?customerId=${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.orders) {
            setOrders(data.orders);
          }
        } else {
          const errData = await res.json();
          setErrorMsg(errData.error?.message || "โหลดประวัติการสั่งซื้อล้มเหลว");
        }
      } catch (e) {
        console.error("Failed to load orders:", e);
        setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const getStatusBadge = (order: Order) => {
    if (order.status === "pending" && order.paymentMethod === "cod") {
      return (
        <span className="text-xs font-bold border px-3 py-1 rounded-full uppercase tracking-wide bg-blue-50 text-blue-700 border-blue-200">
          รอยืนยันออเดอร์ (COD)
        </span>
      );
    }

    const configs = {
      pending: { text: "รอชำระเงิน", bg: "bg-amber-50 text-amber-700 border-amber-200" },
      confirmed: { text: "ยืนยันออเดอร์แล้ว", bg: "bg-blue-50 text-blue-700 border-blue-200" },
      packed: { text: "กำลังเตรียมจัดส่ง", bg: "bg-sky-50 text-sky-700 border-sky-200" },
      shipped: { text: "จัดส่งแล้ว", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      delivered: { text: "จัดส่งสำเร็จ", bg: "bg-green-50 text-green-700 border-green-200" },
      cancelled: { text: "ยกเลิกแล้ว", bg: "bg-red-50 text-red-700 border-red-200" },
      refunded: { text: "คืนเงินแล้ว", bg: "bg-neutral-100 text-neutral-600 border-neutral-300" },
    };

    const config = configs[order.status] || { text: order.status, bg: "bg-neutral-50 text-neutral-700" };
    return (
      <span className={cn("text-xs font-bold border px-3 py-1 rounded-full uppercase tracking-wide", config.bg)}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-12">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-950 uppercase mb-8">
          ประวัติการสั่งซื้อ
        </h1>

        {loading ? (
          <div className="flex flex-col gap-6 w-full">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-5 w-32 bg-neutral-200 animate-pulse rounded" />
                    <div className="h-5 w-20 bg-neutral-200 animate-pulse rounded-full" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-48 bg-neutral-200 animate-pulse rounded" />
                    <div className="h-4 w-36 bg-neutral-200 animate-pulse rounded" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 min-w-[200px]">
                  <div className="h-10 w-full bg-neutral-200 animate-pulse rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">เกิดข้อผิดพลาด</p>
              <p className="text-sm text-red-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto">
            <div className="h-16 w-16 bg-white rounded-full border border-neutral-200 flex items-center justify-center mb-6 mx-auto">
              <ShoppingBag className="h-8 w-8 text-slate-gray" />
            </div>
            <h2 className="font-heading text-xl font-bold tracking-tight text-neutral-950">
              ยังไม่มีคำสั่งซื้อใดๆ
            </h2>
            <p className="text-slate-gray mt-2 mb-8 text-sm leading-relaxed">
              เมื่อคุณทำการซื้อเครื่องดนตรีชิ้นแรกกับเรา ประวัติคำสั่งซื้อทั้งหมดของคุณจะถูกจัดเก็บแสดงที่หน้านี้
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full bg-electric-blue text-white px-6 py-3 font-semibold hover:bg-electric-blue/90 transition-all text-sm"
            >
              เลือกดูสินค้าเพื่อสั่งซื้อ
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {orders.map((order) => {
              const formattedDate = new Date(order.orderDate).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div 
                  key={order.orderId}
                  className="bg-white rounded-3xl border border-[#E5E2DA] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg hover:shadow-neutral-950/[0.02] transition-all"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-heading text-sm font-bold text-neutral-950">
                        ออเดอร์ #{order.orderId.slice(0, 8).toUpperCase()}
                      </span>
                      {getStatusBadge(order)}
                    </div>
                    
                    <div className="flex flex-col gap-1.5 text-xs text-slate-gray">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-gray" />
                        สั่งซื้อเมื่อ: {formattedDate}
                      </span>
                      <span className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-slate-gray" />
                        จำนวนสินค้า: {order.items.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100">
                    <div className="flex flex-col text-left md:text-right">
                      <span className="text-[10px] text-slate-gray font-bold uppercase tracking-wider">
                        ยอดสุทธิ
                      </span>
                      <span className="font-heading text-lg font-extrabold text-neutral-950 mt-0.5">
                        {Number(order.grandTotal).toLocaleString()} ฿
                      </span>
                    </div>

                    <Link
                      href={`/orders/${order.orderId}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 hover:bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-800 transition-all cursor-pointer"
                    >
                      ดูรายละเอียด
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
