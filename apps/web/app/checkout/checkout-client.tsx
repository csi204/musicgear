"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartContext } from "../../components/cart-provider";
import { getApiBaseUrl, getAccessToken, isAuthenticated } from "../../lib/auth";
import { Navbar } from "../../components/navbar";
import { Footer } from "../../components/footer";
import { 
  MapPin, 
  Phone, 
  User, 
  Plus, 
  Check, 
  Loader2, 
  ArrowLeft, 
  ShoppingBag,
  AlertCircle,
  CreditCard,
  Truck,
  Banknote
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";

interface Address {
  addressId: string;
  receiverName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  province: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

export function CheckoutClient() {
  const router = useRouter();
  const { items, totalPrice, cartId, clearCart } = useCartContext();
  
  // States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");

  // Address Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  // Load Addresses
  const loadAddresses = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      setLoadingAddresses(true);
      const res = await fetch(`${getApiBaseUrl()}/users/me/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "ok" && data.addresses) {
          setAddresses(data.addresses);
          
          // Auto select default address
          const defaultAddr = data.addresses.find((addr: Address) => addr.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.addressId);
          } else if (data.addresses.length > 0) {
            setSelectedAddressId(data.addresses[0].addressId);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load addresses:", e);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      // Redirect to login if not authenticated
      router.push("/auth/login?redirect_uri=" + encodeURIComponent(window.location.pathname));
      return;
    }
    loadAddresses();
  }, []);

  // Handle Save Address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    if (!receiverName || !phone || !addressLine1 || !province || !city || !postalCode) {
      alert("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }

    try {
      setSavingAddress(true);
      const res = await fetch(`${getApiBaseUrl()}/users/me/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverName,
          phone,
          addressLine1,
          addressLine2: addressLine2 || null,
          province,
          city,
          postalCode,
          isDefault: addresses.length === 0, // default if first address
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "ok" && data.address) {
          // Clear inputs
          setReceiverName("");
          setPhone("");
          setAddressLine1("");
          setAddressLine2("");
          setProvince("");
          setCity("");
          setPostalCode("");
          setShowAddForm(false);
          
          // Reload
          await loadAddresses();
          // Auto select new address
          setSelectedAddressId(data.address.addressId);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`บันทึกที่อยู่ล้มเหลว กรุณาลองใหม่อีกครั้ง (Error: ${errData?.error?.message || res.status})`);
      }
    } catch (err) {
      console.error("Save address error:", err);
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle Checkout
  const handleCheckout = async () => {
    if (!selectedAddressId) {
      setErrorMsg("กรุณาเลือกที่อยู่สำหรับจัดส่ง");
      return;
    }
    if (!cartId || items.length === 0) {
      setErrorMsg("ไม่มีสินค้าในตะกร้าสินค้า");
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    // Find the selected address details
    const selectedAddr = addresses.find(addr => addr.addressId === selectedAddressId);
    if (!selectedAddr) {
      setErrorMsg("ไม่พบข้อมูลที่อยู่จัดส่งที่เลือก");
      return;
    }

    try {
      setSubmittingOrder(true);
      setErrorMsg(null);

      const res = await fetch(`${getApiBaseUrl()}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartId,
          addressId: selectedAddressId,
          remark: remark || null,
          paymentMethod,
          shippingAddressSnapshot: {
            receiverName: selectedAddr.receiverName,
            phone: selectedAddr.phone,
            addressLine1: selectedAddr.addressLine1,
            addressLine2: selectedAddr.addressLine2 || null,
            province: selectedAddr.province,
            city: selectedAddr.city,
            postalCode: selectedAddr.postalCode,
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Order successfully created — clear cart
        await clearCart();

        if (paymentMethod === "online") {
          // ชำระออนไลน์: ไปหน้า payment
          router.push(`/payment?orderId=${data.orderId}`);
        } else {
          // COD: ไปหน้า order detail ทันที
          router.push(`/orders/${data.orderId}`);
        }
      } else {
        const error = data.error;
        if (error?.code === "CONFLICT" || error?.code === "OUT_OF_STOCK") {
          setErrorMsg("สินค้าในสต็อกไม่เพียงพอ หรือการจองสต็อกล้มเหลว กรุณาตรวจสอบตะกร้าของคุณอีกครั้ง");
        } else {
          setErrorMsg(error?.message || "การทำรายการเช็คเอาท์ล้มเหลว");
        }
      }
    } catch (e) {
      console.error("Checkout order error:", e);
      setErrorMsg("เกิดข้อผิดพลาดในการเชื่อมต่อระบบสั่งซื้อ");
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-8 w-8 text-slate-gray" />
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-neutral-950">
            ไม่มีสินค้าในตะกร้า
          </h2>
          <p className="text-slate-gray mt-2 mb-8">
            กรุณาเลือกซื้อสินค้าชิ้นโปรดของคุณใส่ตะกร้าก่อนเข้าสู่ขั้นตอนการชำระเงิน
          </p>
          <Link
            href="/products"
            className="w-full inline-flex items-center justify-center rounded-full bg-electric-blue text-white px-6 py-3 font-semibold hover:bg-electric-blue/90 transition-all"
          >
            ไปหน้าสินค้าทั้งหมด
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12">
        {/* Back Link */}
        <Link href="/products" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-gray hover:text-neutral-900 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าสินค้า
        </Link>

        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-950 uppercase mb-8">
          ชำระเงิน (Checkout)
        </h1>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl mb-8 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">เกิดข้อผิดพลาด</p>
              <p className="text-sm text-red-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Address & Details */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Section 1: Shipping Address */}
            <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-lg font-bold text-neutral-950 flex items-center gap-2.5">
                  <MapPin className="h-5 w-5 text-electric-blue" />
                  ที่อยู่จัดส่งสินค้า
                </h2>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1 text-xs font-bold text-electric-blue hover:text-electric-blue/80 transition-colors cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่มที่อยู่ใหม่
                  </button>
                )}
              </div>

              {showAddForm ? (
                <form onSubmit={handleSaveAddress} className="flex flex-col gap-4 bg-neutral-50/50 p-5 rounded-2xl border border-dashed border-neutral-300">
                  <h3 className="font-heading text-sm font-semibold text-neutral-900 mb-2">
                    ข้อมูลผู้รับและที่อยู่จัดส่ง
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-gray uppercase">ชื่อผู้รับ *</label>
                      <input
                        type="text"
                        placeholder="เช่น นายอับดุล รอนีย์"
                        required
                        value={receiverName}
                        onChange={e => setReceiverName(e.target.value)}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-gray uppercase">เบอร์โทรศัพท์ *</label>
                      <input
                        type="tel"
                        placeholder="เช่น 0891234567"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-gray uppercase">ที่อยู่บรรทัด 1 *</label>
                    <input
                      type="text"
                      placeholder="บ้านเลขที่, ถนน, ซอย"
                      required
                      value={addressLine1}
                      onChange={e => setAddressLine1(e.target.value)}
                      className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-gray uppercase">ที่อยู่บรรทัด 2 (ถ้ามี)</label>
                    <input
                      type="text"
                      placeholder="คอนโด, ชั้น, หมู่บ้าน"
                      value={addressLine2}
                      onChange={e => setAddressLine2(e.target.value)}
                      className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-gray uppercase">จังหวัด *</label>
                      <input
                        type="text"
                        placeholder="เช่น กรุงเทพฯ"
                        required
                        value={province}
                        onChange={e => setProvince(e.target.value)}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-gray uppercase">เขต/อำเภอ *</label>
                      <input
                        type="text"
                        placeholder="เช่น เขตปทุมวัน"
                        required
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-gray uppercase">รหัสไปรษณีย์ *</label>
                      <input
                        type="text"
                        placeholder="เช่น 10330"
                        required
                        value={postalCode}
                        onChange={e => setPostalCode(e.target.value)}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-200">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="inline-flex items-center justify-center rounded-full bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {savingAddress ? "กำลังบันทึก..." : "บันทึกที่อยู่"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="inline-flex items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-50 text-neutral-800 px-5 py-2.5 text-xs font-bold transition-all cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              ) : loadingAddresses ? (
                <div className="py-12 flex justify-center items-center text-slate-gray">
                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-electric-blue" />
                  กำลังโหลดข้อมูลที่อยู่...
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-12 text-center bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-300 px-6">
                  <p className="text-sm text-slate-gray mb-4">ยังไม่มีประวัติที่อยู่จัดส่งในบัญชีของคุณ</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-electric-blue text-white px-5 py-2.5 text-xs font-bold hover:bg-electric-blue/90 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่มที่อยู่จัดส่งใบแรก
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.addressId;
                    return (
                      <div
                        key={addr.addressId}
                        onClick={() => setSelectedAddressId(addr.addressId)}
                        className={cn(
                          "relative rounded-2xl border p-5 flex flex-col gap-3 transition-all cursor-pointer text-left",
                          isSelected
                            ? "border-electric-blue bg-electric-blue/[0.02] ring-1 ring-electric-blue"
                            : "border-neutral-200 hover:border-neutral-300 bg-white"
                        )}
                      >
                        {isSelected && (
                          <span className="absolute top-4 right-4 bg-electric-blue text-white rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </span>
                        )}

                        <div className="flex flex-col gap-1 pr-6">
                          <span className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-gray" />
                            {addr.receiverName}
                          </span>
                          <span className="text-xs text-slate-gray flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3.5 w-3.5 text-slate-gray" />
                            {addr.phone}
                          </span>
                        </div>

                        <div className="text-xs text-neutral-600 leading-relaxed pt-2 border-t border-neutral-100">
                          {addr.addressLine1}
                          {addr.addressLine2 ? ` ${addr.addressLine2}` : ""}
                          <br />
                          {addr.city}, {addr.province} {addr.postalCode}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Payment Method */}
            <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8">
              <h2 className="font-heading text-lg font-bold text-neutral-950 flex items-center gap-2.5 mb-5">
                <CreditCard className="h-5 w-5 text-electric-blue" />
                วิธีชำระเงิน
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Online Payment */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("online")}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all cursor-pointer",
                    paymentMethod === "online"
                      ? "border-electric-blue bg-electric-blue/[0.02] ring-1 ring-electric-blue"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  )}
                >
                  {paymentMethod === "online" && (
                    <span className="absolute top-4 right-4 bg-electric-blue text-white rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                      paymentMethod === "online" ? "bg-electric-blue/10 text-electric-blue" : "bg-neutral-100 text-neutral-500"
                    )}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">ชำระออนไลน์</p>
                      <p className="text-xs text-slate-gray mt-0.5">บัตรเครดิต / PromptPay</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    ชำระเงินทันทีผ่าน Omise Payment Gateway ปลอดภัยและรวดเร็ว
                  </p>
                </button>

                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all cursor-pointer",
                    paymentMethod === "cod"
                      ? "border-amber-400 bg-amber-50/40 ring-1 ring-amber-400"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  )}
                >
                  {paymentMethod === "cod" && (
                    <span className="absolute top-4 right-4 bg-amber-400 text-white rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                      paymentMethod === "cod" ? "bg-amber-100 text-amber-600" : "bg-neutral-100 text-neutral-500"
                    )}>
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900">เก็บเงินปลายทาง</p>
                      <p className="text-xs text-slate-gray mt-0.5">Cash on Delivery (COD)</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    ชำระเงินสดเมื่อได้รับสินค้า เหมาะสำหรับผู้ที่ยังไม่พร้อมชำระออนไลน์
                  </p>
                </button>
              </div>
            </div>

            {/* Section 3: Remark / Notes */}
            <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8">
              <h2 className="font-heading text-lg font-bold text-neutral-950 mb-4">
                หมายเหตุถึงผู้ขาย (Remark)
              </h2>
              <textarea
                placeholder="กรอกข้อความที่ท่านต้องการฝากถึงผู้ขาย เช่น ระบุเบอร์โทรฉุกเฉิน หรือฝากไว้กับนิติบุคคล"
                rows={3}
                value={remark}
                onChange={e => setRemark(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 bg-white p-4 text-sm focus:outline-none focus:border-electric-blue resize-none"
              />
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8 sticky top-28">
              <h2 className="font-heading text-lg font-bold text-neutral-950 mb-6">
                สรุปคำสั่งซื้อ
              </h2>

              {/* Items List */}
              <div className="flex flex-col gap-4 divide-y divide-neutral-100 max-h-[280px] overflow-y-auto pr-2 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 pt-4 first:pt-0">
                    <div className="h-16 w-16 rounded-xl border border-neutral-200 bg-neutral-50/50 p-2 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-contain" />
                    </div>
                    <div className="flex-grow flex flex-col text-left">
                      <span className="text-[9px] font-bold tracking-widest text-slate-gray uppercase font-heading">
                        {item.brand}
                      </span>
                      <h4 className="font-heading text-xs font-semibold text-neutral-900 mt-0.5 line-clamp-1">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full font-medium">
                          สี: {item.color}
                        </span>
                        <span className="text-[10px] text-slate-gray font-medium">
                          จำนวน: {item.quantity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <span className="text-xs font-bold text-neutral-900">
                        {(item.price * item.quantity).toLocaleString()} ฿
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="flex flex-col gap-3 py-6 border-t border-b border-neutral-100 mb-6 text-sm">
                <div className="flex items-center justify-between text-slate-gray">
                  <span>ยอดรวมสินค้า</span>
                  <span className="font-semibold text-neutral-800">{totalPrice.toLocaleString()} ฿</span>
                </div>
                <div className="flex items-center justify-between text-slate-gray">
                  <span>ค่าบริการจัดส่ง</span>
                  <span className="text-green-600 font-bold uppercase tracking-wider text-xs bg-green-50 px-2.5 py-0.5 rounded-full">ฟรี</span>
                </div>
                <div className="flex items-center justify-between text-slate-gray">
                  <span>ส่วนลด</span>
                  <span className="font-semibold text-neutral-800">0 ฿</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-semibold text-neutral-800">ยอดชำระสุทธิ</span>
                <span className="font-heading text-xl font-extrabold text-neutral-950">
                  {totalPrice.toLocaleString()} ฿
                </span>
              </div>

              {/* Payment Method Summary Badge */}
              <div className={cn(
                "flex items-center gap-2.5 rounded-2xl px-4 py-3 mb-5 text-xs font-semibold",
                paymentMethod === "online"
                  ? "bg-electric-blue/8 text-electric-blue border border-electric-blue/20"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              )}>
                {paymentMethod === "online" ? (
                  <><CreditCard className="h-4 w-4 flex-shrink-0" /> ชำระออนไลน์ผ่าน Omise<span className="ml-auto text-[10px] opacity-70">จะไปหน้าชำระเงิน</span></>
                ) : (
                  <><Banknote className="h-4 w-4 flex-shrink-0" /> เก็บเงินปลายทาง (COD)<span className="ml-auto text-[10px] opacity-70">จ่ายตอนรับสินค้า</span></>
                )}
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckout}
                disabled={submittingOrder || !selectedAddressId}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-full disabled:opacity-50 text-white font-semibold py-4 transition-all shadow-md cursor-pointer",
                  paymentMethod === "online"
                    ? "bg-electric-blue hover:bg-electric-blue/90 shadow-electric-blue/10"
                    : "bg-amber-500 hover:bg-amber-600 shadow-amber-200"
                )}
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    กำลังดำเนินการ...
                  </>
                ) : paymentMethod === "online" ? (
                  <>
                    <CreditCard className="h-5 w-5" />
                    ไปหน้าชำระเงิน
                  </>
                ) : (
                  <>
                    <Truck className="h-5 w-5" />
                    สั่งซื้อ (เก็บเงินปลายทาง)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
