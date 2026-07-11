"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("ไม่พบ Token สำหรับการรีเซ็ตรหัสผ่าน กรุณากดลิงก์จากในอีเมลอีกครั้ง");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    if (password.length < 6) {
      setStatus("error");
      setMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setStatus("loading");
    setMessage("");
    
    try {
      const res = await fetch("http://127.0.0.1:8788/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      
      if (res.ok) {
        setStatus("success");
        setMessage("รีเซ็ตรหัสผ่านสำเร็จ! คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error?.message || "ลิงก์นี้หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์รีเซ็ตใหม่");
      }
    } catch (err) {
      setStatus("error");
      setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-svh p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-sm text-muted-foreground">กรุณากรอกรหัสผ่านใหม่ที่ต้องการใช้งาน</p>
        </div>
        
        {status === "success" ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 text-green-500 rounded-md text-sm text-center">
              {message}
            </div>
            <Button onClick={() => router.push("/login")} className="w-full">
              ไปหน้าเข้าสู่ระบบ
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Input 
                type={showPassword ? "text" : "password"}
                placeholder="ยืนยันรหัสผ่านใหม่" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            {status === "error" && <p className="text-sm text-red-500">{message}</p>}
            
            <Button type="submit" className="w-full" disabled={status === "loading" || !token}>
              {status === "loading" ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-svh text-sm text-muted-foreground">กำลังโหลด...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
