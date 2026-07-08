import { cookies } from "next/headers";
import { Sidebar } from "./sidebar";
import { SyncToken } from "./sync-token";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("mg_staff_session")?.value || cookieStore.get("__Secure-mg_staff_session")?.value;

  return (
    <div className="flex h-screen print:h-auto bg-zinc-50 dark:bg-zinc-950 font-sans overflow-hidden print:overflow-visible selection:bg-blue-500/30">
      {token && <SyncToken token={token} />}

      {/* Mobile Sidebar Toggle */}
      <input type="checkbox" id="mobile-sidebar-toggle" className="peer hidden" />

      {/* Mobile Overlay */}
      <label htmlFor="mobile-sidebar-toggle" className="print:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto transition-opacity md:hidden cursor-pointer" />

      {/* Sidebar */}
      <div className="print:hidden fixed md:static inset-y-0 left-0 z-50 transform -translate-x-full md:translate-x-0 peer-checked:translate-x-0 transition-transform duration-300 ease-in-out h-full">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible relative w-full md:w-auto">
        {/* Mobile header bar */}
        <div className="md:hidden print:hidden flex items-center px-4 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-10">
          <label htmlFor="mobile-sidebar-toggle" className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <span className="ml-3 font-bold text-zinc-900 dark:text-white text-sm">MusicGear</span>
        </div>

        <main className="flex-1 overflow-y-auto print:overflow-visible p-4 md:p-8 relative z-0">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
