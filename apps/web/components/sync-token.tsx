"use client";

import { useEffect } from "react";
import { storeSession, clearSession } from "../lib/auth";

export function SyncToken({ token }: { token?: string }) {
  useEffect(() => {
    if (token) {
      storeSession({ access_token: token });
    } else {
      clearSession();
    }
  }, [token]);

  return null;
}
