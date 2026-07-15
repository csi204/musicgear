"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Eye, EyeOff } from "lucide-react";
import { getApiBaseUrl } from "@/lib/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "การสมัครสมาชิกขัดข้อง");
        return;
      }
      
      router.push("/login?registered=true");
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-svh p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">สมัครสมาชิก</h1>
          <p className="text-sm text-muted-foreground">เข้าร่วมเป็นส่วนหนึ่งกับ MusicGear</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input 
                placeholder="ชื่อ" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Input 
                placeholder="นามสกุล" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Input 
              type="email" 
              placeholder="อีเมล" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"}
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" 
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
          
          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <Button type="submit" className="w-full">
            ยืนยันการสมัคร
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว? <a href="/login" className="underline hover:text-primary">เข้าสู่ระบบ</a>
        </p>
      </div>
    </div>
  );
}
