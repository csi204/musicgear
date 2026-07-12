import { cookies } from "next/headers";
import { DashboardShell } from "./dashboard-shell";
import { SyncToken } from "./sync-token";
import { UserProvider } from "@/hooks/useUser";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("mg_staff_session")?.value || cookieStore.get("__Secure-mg_staff_session")?.value;

  return (
    <UserProvider>
      {token && <SyncToken token={token} />}
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}
