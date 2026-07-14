"use client";

import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Eye, EyeOff } from "lucide-react";

export default function SecurityPage() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => setSessionUser(d?.user || null));
  }, []);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("รหัสผ่านใหม่ไม่ตรงกัน");
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
      // In a real app we'd fetch the internal JWT, but next-auth doesn't expose it to the client by default.
      // However, we can use server action or api route proxy. For now, since API Gateway requires Bearer token,
      // we would need an API route in Next.js to proxy this request, or expose token to client.
      // Wait, how does the frontend talk to the backend in this architecture?
      // Typically via a client-side wrapper or server actions. 
      // Assuming we have an API proxy in web, e.g., POST /api/user/password
      
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      if (res.ok) {
        setStatus("success");
        setMessage("เปลี่ยนรหัสผ่านสำเร็จ!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error?.message || "รหัสผ่านปัจจุบันไม่ถูกต้อง");
      }
    } catch (err) {
      setStatus("error");
      setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-background border rounded-lg shadow-sm mt-10">
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-bold">ความปลอดภัย</h1>
        <p className="text-sm text-muted-foreground">เปลี่ยนรหัสผ่านบัญชีของคุณ</p>
      </div>
      
      {status === "success" && (
        <div className="p-4 bg-green-500/10 text-green-500 rounded-md text-sm mb-4">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input 
            type={showPassword ? "text" : "password"}
            placeholder="รหัสผ่านปัจจุบัน" 
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required 
          />
        </div>
        
        <div className="space-y-2">
          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"}
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
        
        <Button type="submit" className="w-full" disabled={status === "loading"}>
          {status === "loading" ? "กำลังบันทึก..." : "อัปเดตรหัสผ่าน"}
        </Button>
      </form>
    </div>
  );
}
