"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    
    try {
      const res = await fetch("http://127.0.0.1:8788/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setStatus("success");
        setMessage("เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว (โปรดตรวจสอบในกล่องข้อความหรือกล่องจดหมายขยะ)");
      } else {
        setStatus("error");
        setMessage("เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง");
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
          <h1 className="text-2xl font-bold">ลืมรหัสผ่าน?</h1>
          <p className="text-sm text-muted-foreground">กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
        </div>
        
        {status === "success" ? (
          <div className="p-4 bg-green-500/10 text-green-500 rounded-md text-sm text-center">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="อีเมลที่ใช้สมัครสมาชิก" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            {status === "error" && <p className="text-sm text-red-500">{message}</p>}
            
            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          <a href="/login" className="underline hover:text-primary">กลับไปหน้าเข้าสู่ระบบ</a>
        </p>
      </div>
    </div>
  );
}
