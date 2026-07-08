"use client";

import { useEffect } from "react";
import { storeSession } from "@/lib/auth";

export function SyncToken({ token }: { token: string }) {
  useEffect(() => {
    storeSession({ access_token: token });
  }, [token]);

  return null;
}
