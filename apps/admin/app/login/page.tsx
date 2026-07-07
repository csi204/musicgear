"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    if (res?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือคุณไม่มีสิทธิ์เข้าถึง");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-svh p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">MusicGear</h1>
          <h2 className="text-2xl font-bold">Admin Portal</h2>
          <p className="text-sm text-muted-foreground">เข้าสู่ระบบเพื่อจัดการระบบ</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Input 
              type="password" 
              placeholder="รหัสผ่าน" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <Button type="submit" className="w-full">
            เข้าสู่ระบบ
          </Button>
        </form>
      </div>
    </div>
  );
}
