"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, ChevronRight, Home, ArrowLeft } from "lucide-react";
import { Navbar } from "../../../components/navbar";
import { Footer } from "../../../components/footer";
import Link from "next/link";
import { isAuthenticated } from "../../../lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Authenticate check
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login?redirect_uri=" + encodeURIComponent(window.location.pathname));
      return;
    }
    setIsCheckingAuth(false);
  }, [router]);

  if (isCheckingAuth) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setStatus("loading");
    setMessage("");
    
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus("success");
        setMessage("เปลี่ยนรหัสผ่านของคุณเรียบร้อยแล้ว!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setStatus("error");
        setMessage(data.error?.message || "รหัสผ่านปัจจุบันไม่ถูกต้อง");
      }
    } catch (err) {
      setStatus("error");
      setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
        <Navbar />
        <main className="flex-grow max-w-xl w-full mx-auto px-6 py-12">
          <div className="h-6 w-32 bg-neutral-200 animate-pulse rounded mb-8" />
          <div className="h-8 w-64 bg-neutral-200 animate-pulse rounded mb-8" />
          <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8 flex flex-col gap-6">
            <div className="h-10 w-full bg-neutral-200 animate-pulse rounded-2xl" />
            <div className="h-10 w-full bg-neutral-200 animate-pulse rounded-2xl" />
            <div className="h-10 w-full bg-neutral-200 animate-pulse rounded-2xl" />
            <div className="h-12 w-full bg-neutral-200 animate-pulse rounded-full mt-4" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE]/30 text-neutral-900 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-xl w-full mx-auto px-6 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-neutral-400 uppercase font-heading mb-6">
          <Link href="/" className="hover:text-neutral-900 transition-colors flex items-center gap-1">
            <Home className="h-3 w-3" />
          </Link>
          <ChevronRight className="h-3 w-3 text-neutral-300" />
          <Link href="/account" className="hover:text-neutral-900 transition-colors">
            บัญชีผู้ใช้
          </Link>
          <ChevronRight className="h-3 w-3 text-neutral-300" />
          <span className="text-neutral-800">ตั้งค่าบัญชี</span>
        </div>

        {/* Heading */}
        <div className="mb-8 text-left">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-950 uppercase">
            ตั้งค่าบัญชี
          </h1>
          <p className="text-xs text-slate-gray mt-1.5 font-medium">
            จัดการรหัสผ่านและความปลอดภัยบัญชีของคุณ
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-[#E5E2DA] p-6 md:p-8 text-left shadow-sm">
          <h2 className="font-heading text-lg font-bold text-neutral-950 flex items-center gap-2.5 mb-6">
            <Lock className="h-5 w-5 text-electric-blue" />
            เปลี่ยนรหัสผ่าน
          </h2>

          {/* Success / Error Alerts */}
          {status === "success" && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl mb-6 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">เปลี่ยนรหัสผ่านสำเร็จ</p>
                <p className="text-xs text-emerald-700 mt-0.5">{message}</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">เปลี่ยนรหัสผ่านไม่สำเร็จ</p>
                <p className="text-xs text-red-750 mt-0.5">{message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-gray uppercase tracking-wider">รหัสผ่านเดิม</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="rounded-xl border border-neutral-200 bg-neutral-50/30 py-6 pr-10 focus:border-electric-blue transition-all"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-gray uppercase tracking-wider">รหัสผ่านใหม่</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="rounded-xl border border-neutral-200 bg-neutral-50/30 py-6 pr-10 focus:border-electric-blue transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-gray hover:text-neutral-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-gray uppercase tracking-wider">ยืนยันรหัสผ่านใหม่</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="rounded-xl border border-neutral-200 bg-neutral-50/30 py-6 focus:border-electric-blue transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-full bg-electric-blue hover:bg-electric-blue/90 text-white font-semibold py-6 mt-4 transition-all shadow-md shadow-electric-blue/10 cursor-pointer text-sm"
            >
              {status === "loading" ? "กำลังบันทึกข้อมูล..." : "อัปเดตรหัสผ่านใหม่"}
            </Button>
          </form>
        </div>

        {/* Back to Account Link */}
        <div className="mt-8 text-center">
          <Link href="/account" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-gray hover:text-neutral-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            ย้อนกลับไปหน้าโปรไฟล์
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
