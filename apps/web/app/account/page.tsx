"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { Navbar } from "../../components/navbar";
import { Footer } from "../../components/footer";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Settings, 
  ChevronRight, 
  Home, 
  AlertCircle,
  Plus,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";
import { getAccessToken, getApiBaseUrl, isAuthenticated } from "../../lib/auth";

interface Address {
  addressId: string;
  receiverName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  province: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

interface UserProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
}

export default function AccountProfilePage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  
  // Auth Guard & Data Loading
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect_uri=" + encodeURIComponent(window.location.pathname));
      return;
    }
    
    setIsCheckingAuth(false);

    async function loadAccountData() {
      const token = getAccessToken();
      if (!token) return;

      setLoading(true);
      setErrorMsg(null);

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const apiBase = getApiBaseUrl();

        // 1. Fetch current profile
        const profileRes = await fetch(`${apiBase}/users/me`, { headers });
        if (!profileRes.ok) throw new Error("ไม่สามารถดึงข้อมูลโปรไฟล์ได้");
        const profileData = await profileRes.json();
        setProfile(profileData.user);

        // 2. Fetch addresses
        const addressRes = await fetch(`${apiBase}/users/me/addresses`, { headers });
        if (addressRes.ok) {
          const addressData = await addressRes.json();
          setAddresses(addressData.addresses || []);
        }
      } catch (err: any) {
        console.error("Failed to load profile data:", err);
        setErrorMsg(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, [router]);

  if (isCheckingAuth || loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-5xl w-full mx-auto px-6 py-12">
          {/* Breadcrumb Skeleton */}
          <div className="h-4 w-40 bg-neutral-200 animate-pulse rounded mb-8" />

          {/* Heading Skeleton */}
          <div className="h-8 w-48 bg-neutral-200 animate-pulse rounded mb-8" />

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8 flex flex-col gap-6">
              <div className="h-6 w-32 bg-neutral-200 animate-pulse rounded" />
              <div className="flex flex-col gap-4">
                <div className="h-10 w-full bg-neutral-200 animate-pulse rounded-2xl" />
                <div className="h-10 w-full bg-neutral-200 animate-pulse rounded-2xl" />
                <div className="h-10 w-full bg-neutral-200 animate-pulse rounded-2xl" />
              </div>
            </div>
            <div className="md:col-span-7 bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8 flex flex-col gap-6">
              <div className="h-6 w-32 bg-neutral-200 animate-pulse rounded" />
              <div className="h-24 w-full bg-neutral-200 animate-pulse rounded-2xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-6 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-neutral-400 uppercase font-heading mb-6">
          <Link href="/" className="hover:text-neutral-900 transition-colors flex items-center gap-1">
            <Home className="h-3 w-3" />
          </Link>
          <ChevronRight className="h-3 w-3 text-neutral-300" />
          <span className="text-neutral-800">บัญชีผู้ใช้</span>
        </div>

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-left">
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-950 uppercase">
              โปรไฟล์ผู้ใช้
            </h1>
            <p className="text-xs text-slate-gray mt-1.5 font-medium">
              ข้อมูลบัญชีผู้ใช้และการจัดส่งของคุณ
            </p>
          </div>
          <Link
            href="/account/settings"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50 transition-all shadow-sm"
          >
            <Settings className="h-4 w-4 text-neutral-600" />
            ตั้งค่าบัญชี
          </Link>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-8 flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              <p className="text-xs text-red-750 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Personal Info */}
          <div className="md:col-span-5 bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8 flex flex-col gap-6 text-left shadow-sm">
            <h2 className="font-heading text-lg font-bold text-neutral-950 flex items-center gap-2.5">
              <User className="h-5 w-5 text-electric-blue" />
              ข้อมูลส่วนตัว
            </h2>

            <div className="flex flex-col gap-5 text-sm">
              {/* Name */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-gray uppercase tracking-wider">ชื่อ - นามสกุล</span>
                <span className="font-semibold text-neutral-900 text-base">
                  {profile ? `${profile.firstName} ${profile.lastName}` : "-"}
                </span>
              </div>

              {/* Login Email */}
              <div className="flex flex-col gap-1 border-t border-neutral-100 pt-4">
                <span className="text-[10px] font-bold text-slate-gray uppercase tracking-wider flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-gray" />
                  อีเมลที่เข้าสู่ระบบ
                </span>
                <span className="font-medium text-neutral-800">
                  {profile?.email || "-"}
                </span>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1 border-t border-neutral-100 pt-4">
                <span className="text-[10px] font-bold text-slate-gray uppercase tracking-wider flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-gray" />
                  เบอร์โทรศัพท์
                </span>
                <span className="font-medium text-neutral-800">
                  {profile?.phone || "ยังไม่มีข้อมูลเบอร์โทรศัพท์"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Addresses */}
          <div className="md:col-span-7 bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8 flex flex-col gap-6 text-left shadow-sm">
            <h2 className="font-heading text-lg font-bold text-neutral-950 flex items-center gap-2.5">
              <MapPin className="h-5 w-5 text-electric-blue" />
              ที่อยู่สำหรับจัดส่ง
            </h2>

            {addresses.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-neutral-200 rounded-2xl p-6">
                <MapPin className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-neutral-800">ยังไม่มีการบันทึกที่อยู่จัดส่ง</p>
                <p className="text-xs text-slate-gray mt-1 leading-relaxed">
                  คุณสามารถเพิ่มข้อมูลที่อยู่จัดส่งของคุณได้ในขั้นตอนเช็คเอาท์สินค้า
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {addresses.map((address) => (
                  <div 
                    key={address.addressId}
                    className={cn(
                      "border rounded-2xl p-5 relative flex items-start gap-4 transition-all duration-300 hover:border-neutral-300",
                      address.isDefault ? "border-electric-blue bg-electric-blue/[0.01]" : "border-neutral-200 bg-white"
                    )}
                  >
                    <div className="h-9 w-9 bg-neutral-50 rounded-xl flex items-center justify-center text-slate-gray mt-0.5">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-grow min-w-0 text-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-neutral-900">{address.receiverName}</span>
                        {address.isDefault && (
                          <span className="text-[9px] font-bold bg-electric-blue/10 text-electric-blue px-2 py-0.5 rounded-full uppercase tracking-wider">
                            ค่าเริ่มต้น
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-600 leading-relaxed">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                        <br />
                        {address.city}, {address.province} {address.postalCode}
                      </p>
                      <p className="text-xs text-slate-gray mt-2 font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        เบอร์ติดต่อ: {address.phone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
