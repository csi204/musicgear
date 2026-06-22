import { Suspense } from "react";
import AuthCallbackClient from "./callback-client";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm">กำลังเข้าสู่ระบบ...</p>}>
      <AuthCallbackClient />
    </Suspense>
  );
}
