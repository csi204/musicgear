"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl, getAccessToken, isAuthenticated } from "../../../lib/auth";
import { Navbar } from "../../../components/navbar";
import { Footer } from "../../../components/footer";
import { 
  Calendar, 
  MapPin, 
  Phone,
  User,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

interface OrderItem {
  orderItemId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  // Metadata for displaying item correctly since product-svc has it
  title?: string;
  imageUrl?: string;
  brand?: string;
  color?: string;
}

interface Order {
  orderId: string;
  orderDate: string;
  shippingAddressSnapshot: any; // address JSON
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
  status: "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";
  remark?: string;
  items: OrderItem[];
}

interface OrderDetailsClientProps {
  orderId: string;
}

export function OrderDetailsClient({ orderId }: OrderDetailsClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cache or map product info locally to render snapshots correctly
  const [productsMetadata, setProductsMetadata] = useState<{ [productId: string]: any }>({});

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login?redirect_uri=" + encodeURIComponent(window.location.pathname));
      return;
    }

    async function loadOrder() {
      const token = getAccessToken();
      if (!token) return;

      try {
        setLoading(true);
        // Fetch order details
        const res = await fetch(`${getApiBaseUrl()}/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setOrder(data);

          // Fetch product metadata to display names/images for each item
          if (data.items && data.items.length > 0) {
            const meta: { [productId: string]: any } = {};
            try {
              // Fetch all products in one request and match by productId
              const listRes = await fetch(`${getApiBaseUrl()}/products?limit=100`);
              if (listRes.ok) {
                const listData = await listRes.json();
                if (listData.products) {
                  data.items.forEach((item: OrderItem) => {
                    const found = listData.products.find((prod: any) => prod.productId === item.productId);
                    if (found) {
                      meta[item.productId] = {
                        title: found.name,
                        brand: found.brand?.name || "GENERIC",
                        imageUrl: found.images && found.images.length > 0 
                          ? `${getApiBaseUrl()}/products/images/${found.images.find((img: any) => img.isPrimary)?.imageUrl || found.images[0].imageUrl}`
                          : "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=600&q=80",
                      };
                    }
                  });
                }
              }
            } catch (e) {
              console.warn("Failed to load product metadata for order items:", e);
            }
            setProductsMetadata(meta);
          }
        } else {
          const errData = await res.json();
          setErrorMsg(errData.error?.message || "โหลดรายละเอียดคำสั่งซื้อล้มเหลว");
        }
      } catch (e) {
        console.error("Failed to load order details:", e);
        setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-electric-blue mb-4" />
          <p className="font-medium text-slate-gray">กำลังโหลดรายละเอียดคำสั่งซื้อ...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-md w-full mx-auto px-6 py-24 text-center">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-neutral-950">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-slate-gray mt-2 mb-8 text-sm">
            {errorMsg || "ไม่พบรายละเอียดคำสั่งซื้อที่คุณต้องการค้นหา"}
          </p>
          <Link
            href="/orders"
            className="w-full inline-flex items-center justify-center rounded-full bg-electric-blue text-white px-6 py-3 font-semibold hover:bg-electric-blue/90 transition-all text-sm"
          >
            กลับสู่หน้ารายการสั่งซื้อ
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Parse Address Snapshot
  let addressObj: any = {};
  try {
    addressObj = typeof order.shippingAddressSnapshot === "string"
      ? JSON.parse(order.shippingAddressSnapshot)
      : order.shippingAddressSnapshot;
  } catch (e) {
    addressObj = order.shippingAddressSnapshot;
  }

  // Stepper Configurations
  const getStepIndex = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return 0; // Payment pending
      case "confirmed":
      case "packed":
        return 1; // Processing/Packing
      case "shipped":
        return 2; // Shipped
      case "delivered":
        return 3; // Delivered
      case "cancelled":
      case "refunded":
        return -1; // Cancelled/Refunded
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(order.status);
  const steps = [
    { title: "ยืนยันออเดอร์", icon: Clock },
    { title: "จัดเตรียมสินค้า", icon: Package },
    { title: "จัดส่งสินค้า", icon: Truck },
    { title: "ส่งของสำเร็จ", icon: CheckCircle2 },
  ];

  const formattedDate = new Date(order.orderDate).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-12">
        {/* Back Link */}
        <Link href="/orders" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-gray hover:text-neutral-900 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าประวัติการสั่งซื้อ
        </Link>

        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-950 uppercase">
              ออเดอร์ #{order.orderId.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-xs text-slate-gray mt-1.5 font-medium">
              สั่งซื้อเมื่อ {formattedDate}
            </p>
          </div>
          
          {/* Status Alert if Cancelled */}
          {currentStepIndex === -1 && (
            <span className="text-xs font-bold bg-red-50 border border-red-200 text-red-700 px-4 py-1.5 rounded-full uppercase tracking-wider">
              {order.status === "cancelled" ? "คำสั่งซื้อถูกยกเลิกแล้ว" : "คืนเงินเรียบร้อยแล้ว"}
            </span>
          )}
        </div>

        {/* Horizontal Stepper Timeline (Only show if not cancelled) */}
        {currentStepIndex !== -1 && (
          <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8 mb-8">
            <div className="relative flex justify-between items-center w-full">
              {/* Connector line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[3px] bg-neutral-100 -z-0">
                <div 
                  className="h-full bg-electric-blue transition-all duration-500" 
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {/* Step items */}
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                const isPending = idx > currentStepIndex;

                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-2 flex-grow text-center">
                    <div 
                      className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center border transition-all duration-300",
                        isCompleted && "bg-electric-blue border-electric-blue text-white",
                        isActive && "bg-white border-electric-blue text-electric-blue ring-4 ring-electric-blue/10 scale-105",
                        isPending && "bg-white border-neutral-200 text-neutral-400"
                      )}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <span 
                      className={cn(
                        "text-[10px] md:text-xs font-bold tracking-tight uppercase mt-1 transition-colors duration-300",
                        (isCompleted || isActive) ? "text-neutral-900" : "text-neutral-400"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Shipment & Items */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Shipping Address Snapshot Card */}
            <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8">
              <h2 className="font-heading text-lg font-bold text-neutral-950 flex items-center gap-2.5 mb-6">
                <MapPin className="h-5 w-5 text-electric-blue" />
                ข้อมูลที่จัดส่งสินค้า (Snapshot)
              </h2>

              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-neutral-50 rounded-xl flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-gray" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-gray font-bold uppercase tracking-wider">ผู้รับสินค้า</p>
                    <p className="font-semibold text-neutral-900 mt-0.5">{addressObj.receiverName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-neutral-50 rounded-xl flex items-center justify-center">
                    <Phone className="h-4 w-4 text-slate-gray" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-gray font-bold uppercase tracking-wider">เบอร์โทรศัพท์</p>
                    <p className="font-semibold text-neutral-900 mt-0.5">{addressObj.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 bg-neutral-50 rounded-xl flex items-center justify-center mt-0.5">
                    <MapPin className="h-4 w-4 text-slate-gray" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-gray font-bold uppercase tracking-wider">ที่อยู่จัดส่ง</p>
                    <p className="text-neutral-800 leading-relaxed mt-1">
                      {addressObj.addressLine1}
                      {addressObj.addressLine2 ? ` ${addressObj.addressLine2}` : ""}
                      <br />
                      {addressObj.city}, {addressObj.province} {addressObj.postalCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Card */}
            <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8">
              <h2 className="font-heading text-lg font-bold text-neutral-950 mb-6">
                รายการสินค้าในคำสั่งซื้อ
              </h2>

              <div className="flex flex-col gap-4 divide-y divide-neutral-100">
                {order.items.map((item) => {
                  const meta = productsMetadata[item.productId] || {};
                  return (
                    <div key={item.orderItemId} className="flex gap-4 pt-4 first:pt-0">
                      <div className="h-16 w-16 rounded-xl border border-neutral-200 bg-neutral-50/50 p-2 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img 
                          src={meta.imageUrl || "https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=600&q=80"} 
                          alt={meta.title || "Product"} 
                          className="h-full w-full object-contain" 
                        />
                      </div>
                      <div className="flex-grow flex flex-col text-left justify-center">
                        <span className="text-[9px] font-bold tracking-widest text-slate-gray uppercase font-heading">
                          {meta.brand || "GENERIC"}
                        </span>
                        <h4 className="font-heading text-xs font-semibold text-neutral-900 mt-0.5 line-clamp-1">
                          {meta.title || "กำลังโหลด..."}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full font-medium">
                            สี: {item.color || "Standard"}
                          </span>
                          <span className="text-[10px] text-slate-gray font-medium">
                            จำนวน: {item.quantity} ชิ้น
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-center min-w-[70px]">
                        <span className="text-xs font-bold text-neutral-900">
                          {Number(item.totalPrice).toLocaleString()} ฿
                        </span>
                        <span className="text-[10px] text-slate-gray">
                          @{Number(item.unitPrice).toLocaleString()} ฿
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing Summary & Payment CTA */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8">
              <h2 className="font-heading text-lg font-bold text-neutral-950 mb-6">
                สรุปยอดเงิน
              </h2>

              <div className="flex flex-col gap-3 pb-6 border-b border-neutral-100 mb-6 text-sm">
                <div className="flex items-center justify-between text-slate-gray">
                  <span>ยอดรวมสินค้า</span>
                  <span className="font-semibold text-neutral-800">{Number(order.totalAmount).toLocaleString()} ฿</span>
                </div>
                <div className="flex items-center justify-between text-slate-gray">
                  <span>ค่าบริการจัดส่ง</span>
                  <span className="font-semibold text-neutral-800">{Number(order.shippingFee) === 0 ? "ฟรี" : `${Number(order.shippingFee)} ฿`}</span>
                </div>
                <div className="flex items-center justify-between text-slate-gray">
                  <span>ส่วนลด</span>
                  <span className="font-semibold text-neutral-800">{Number(order.discountAmount).toLocaleString()} ฿</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-semibold text-neutral-800">ยอดชำระสุทธิ</span>
                <span className="font-heading text-xl font-extrabold text-neutral-950">
                  {Number(order.grandTotal).toLocaleString()} ฿
                </span>
              </div>

              {/* Pay Now Button for Pending Status */}
              {order.status === "pending" && (
                <Link
                  href={`/payment?orderId=${order.orderId}`}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-electric-blue hover:bg-electric-blue/90 text-white font-semibold py-4 transition-all shadow-md shadow-electric-blue/10 cursor-pointer text-sm"
                >
                  <CreditCard className="h-4.5 w-4.5" />
                  ชำระเงินทันที (Pay Now)
                </Link>
              )}
            </div>
            
            {/* Remark Card */}
            {order.remark && (
              <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 text-left">
                <h3 className="text-xs font-bold text-slate-gray uppercase mb-2">หมายเหตุถึงผู้ขาย</h3>
                <p className="text-sm text-neutral-800 leading-relaxed italic">
                  "{order.remark}"
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
