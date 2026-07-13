"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, isAuthenticated } from "@/lib/auth";

export type AuthUser = {
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  given_name?: string;
  family_name?: string;
  roles?: { key: string }[];
};

type UserContextType = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!isAuthenticated()) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (active) {
          setUser(currentUser);
          setLoading(false);
        }
      } catch {
        if (active) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  const rawRole = user?.role ?? user?.roles?.[0]?.key ?? "customer";
  const role = String(rawRole).toLowerCase();
  
  const isAdmin = role === "admin";
  const isStaff = role === "staff";

  return React.createElement(
    UserContext.Provider,
    { value: { user, loading, isAdmin, isStaff } },
    children
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    // Fallback if not wrapped in UserProvider to prevent crash
    return { user: null, loading: true, isAdmin: false, isStaff: false };
  }
  return context;
}
