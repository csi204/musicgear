"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { orderApi, paymentApi } from "../../lib/api";
import { getAccessToken, isAuthenticated } from "../../lib/auth";
import { Navbar } from "../../components/navbar";
import { Footer } from "../../components/footer";
import {
  CreditCard,
  QrCode,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

interface PaymentClientProps {
  orderId: string;
}

export function PaymentClient({ orderId }: PaymentClientProps) {
  const router = useRouter();
  
  // States
  const [order, setOrder] = useState<any>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "promptpay">("credit_card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Authenticate & Load Order Details
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login?redirect_uri=" + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    if (!orderId) {
      setErrorMsg("ไม่พบรหัสใบสั่งซื้อ (Missing orderId)");
      setLoadingOrder(false);
      return;
    }

    async function loadOrderDetails() {
      try {
        setLoadingOrder(true);
        const data = await orderApi.get(orderId);
        if (data) {
          setOrder(data);
          
          // If already confirmed or paid, redirect back to order page
          if (data.status !== "pending") {
            router.push(`/orders/${orderId}`);
          }
        }
      } catch (err: any) {
        console.error("Failed to load order:", err);
        setErrorMsg(err.message || "ไม่สามารถดึงข้อมูลคำสั่งซื้อได้");
      } finally {
        setLoadingOrder(false);
      }
    }

    loadOrderDetails();
  }, [orderId]);

  // Handle Payment Submit
  const handlePayment = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Send payment request (using token: "mock-payment" for sandbox sandbox mode)
      const res = await paymentApi.pay({
        orderId,
        paymentMethod: paymentMethod === "credit_card" ? "credit_card" : "promptpay" as any,
        token: "mock-payment",
      });

      if (res && res.status === "paid") {
        setIsSuccess(true);
        // Wait 2.5 seconds to show success state, then redirect to order details
        setTimeout(() => {
          router.push(`/orders/${orderId}`);
        }, 2500);
      } else {
        setErrorMsg("การชำระเงินล้มเหลว กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setErrorMsg(err.message || "เกิดข้อผิดพลาดระหว่างทำรายการชำระเงิน");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-electric-blue mb-4" />
          <p className="font-semibold text-neutral-800">กำลังโหลดรายละเอียดคำสั่งซื้อ...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="font-heading text-xl font-bold text-neutral-950">เกิดข้อผิดพลาด</h2>
          <p className="text-slate-gray mt-2 mb-8">{errorMsg}</p>
          <Link
            href="/orders"
            className="w-full inline-flex items-center justify-center rounded-full bg-neutral-950 text-white px-6 py-3 font-semibold hover:bg-neutral-800 transition-all"
          >
            ไปที่ประวัติการสั่งซื้อ
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-500 border border-emerald-200 shadow-sm animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-neutral-950 uppercase tracking-tight">
            ชำระเงินสำเร็จ!
          </h2>
          <p className="text-slate-gray mt-2 mb-8 text-sm">
            ระบบได้รับยอดชำระของคุณเรียบร้อยแล้ว กำลังนำท่านไปยังหน้ารายละเอียดออเดอร์...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-electric-blue mx-auto" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-6 py-12">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-950 uppercase mb-8 text-left">
          ชำระเงิน (Payment)
        </h1>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl mb-8 flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">เกิดข้อผิดพลาดในการชำระเงิน</p>
              <p className="text-sm text-red-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Payment Methods */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8 flex flex-col gap-6 text-left">
            <h2 className="font-heading text-lg font-bold text-neutral-950 flex items-center gap-2">
              <Lock className="h-5 w-5 text-electric-blue" />
              เลือกช่องทางชำระเงิน
            </h2>

            {/* Payment Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Credit Card Card */}
              <div
                onClick={() => setPaymentMethod("credit_card")}
                className={cn(
                  "border rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all",
                  paymentMethod === "credit_card"
                    ? "border-electric-blue bg-electric-blue/[0.02] ring-1 ring-electric-blue"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                )}
              >
                <div className={cn("p-3 rounded-xl", paymentMethod === "credit_card" ? "bg-electric-blue/10 text-electric-blue" : "bg-neutral-100 text-slate-gray")}>
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">บัตรเครดิต / เดบิต</h3>
                  <p className="text-[11px] text-slate-gray mt-0.5">Omise Gateway (Mock)</p>
                </div>
              </div>

              {/* PromptPay Card */}
              <div
                onClick={() => setPaymentMethod("promptpay")}
                className={cn(
                  "border rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all",
                  paymentMethod === "promptpay"
                    ? "border-electric-blue bg-electric-blue/[0.02] ring-1 ring-electric-blue"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                )}
              >
                <div className={cn("p-3 rounded-xl", paymentMethod === "promptpay" ? "bg-electric-blue/10 text-electric-blue" : "bg-neutral-100 text-slate-gray")}>
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">พร้อมเพย์ (PromptPay)</h3>
                  <p className="text-[11px] text-slate-gray mt-0.5">สแกน QR Code (Mock)</p>
                </div>
              </div>
            </div>

            {/* Context Details */}
            <div className="mt-4 p-5 rounded-2xl bg-[#F5F3EE]/30 border border-[#E5E2DA]/50">
              {paymentMethod === "credit_card" ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">ชำระผ่านระบบบัตรเครดิตจำลอง</h4>
                  <p className="text-xs text-slate-gray leading-relaxed">
                    ระบบจะใช้โทเค็นชำระเงินของ Omise Sandbox ในการตัดเงินจำลอง (Mock Charge) โดยที่ผู้ซื้อไม่จำเป็นต้องป้อนข้อมูลบัตรจริง เหมาะสมสำหรับการทดสอบระบบอย่างสมบูรณ์
                  </p>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center sm:items-start">
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">สแกนเพื่อชำระเงินด้วยพร้อมเพย์</h4>
                  <p className="text-xs text-slate-gray leading-relaxed self-stretch">
                    ระบบจะจำลองรหัส QR Code พร้อมเพย์สำหรับยอดชำระสุทธิของคุณ หลังกดปุ่มทำรายการ ระบบจะทำการส่ง webhook สำเร็จจำลองไปยังเซิร์ฟเวอร์
                  </p>
                  
                  {/* Mock QR Code representation */}
                  <div className="h-32 w-32 border border-[#E5E2DA] bg-white p-2 rounded-xl mt-2 flex items-center justify-center">
                    <QrCode className="h-24 w-24 text-neutral-900" />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <button
              onClick={handlePayment}
              disabled={isSubmitting}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-full bg-electric-blue hover:bg-electric-blue/90 disabled:opacity-50 text-white font-semibold py-4 transition-all shadow-md shadow-electric-blue/10 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  กำลังตรวจสอบการชำระเงิน...
                </>
              ) : (
                <>
                  ยืนยันชำระเงิน {Number(order?.grandTotal || 0).toLocaleString()} ฿
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Right Column: Order Summary Panel */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8 flex flex-col gap-6 text-left">
            <h2 className="font-heading text-lg font-bold text-neutral-950 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-electric-blue" />
              สรุปรายการสั่งซื้อ
            </h2>

            {/* Order Meta info */}
            <div className="text-xs text-slate-gray space-y-1.5 pb-4 border-b border-neutral-100">
              <p>ออเดอร์: <span className="font-bold text-neutral-900">#{orderId.slice(0, 8).toUpperCase()}</span></p>
              <p>วันที่สั่งซื้อ: <span className="font-medium text-neutral-800">{new Date(order?.orderDate || Date.now()).toLocaleDateString("th-TH")}</span></p>
            </div>

            {/* Simple price breakdown */}
            <div className="text-sm space-y-3 pb-4 border-b border-neutral-100">
              <div className="flex justify-between text-slate-gray">
                <span>ยอดรวมสินค้า</span>
                <span className="font-semibold text-neutral-800">{Number(order?.totalAmount || 0).toLocaleString()} ฿</span>
              </div>
              <div className="flex justify-between text-slate-gray">
                <span>ค่าจัดส่ง</span>
                <span className="text-green-600 font-bold uppercase tracking-wider text-xs">ฟรี</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline mt-2">
              <span className="text-sm font-semibold text-neutral-800">ยอดชำระสุทธิ</span>
              <span className="font-heading text-xl font-extrabold text-neutral-950">
                {Number(order?.grandTotal || 0).toLocaleString()} ฿
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
