"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { storeSession } from "../../../lib/auth";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("กำลังเข้าสู่ระบบ...");

  useEffect(() => {
    // Errors come via query params
    const error = searchParams.get("error");
    if (error) {
      setMessage(decodeURIComponent(error));
      return;
    }

    // Tokens come via hash fragment
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    if (!accessToken) {
      setMessage("ไม่พบ access token จาก auth callback");
      return;
    }

    storeSession({
      access_token: accessToken,
      refresh_token: params.get("refresh_token") ?? undefined,
      expires_in: params.get("expires_in") ?? undefined,
      token_type: params.get("token_type") ?? undefined,
    });

    // Clear hash before navigating
    history.replaceState(null, "", window.location.pathname + window.location.search);
    router.replace("/");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <p className="text-sm">{message}</p>
    </div>
  );
}
