"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#E5E2DA] bg-warm-offwhite text-neutral-800">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          
          {/* Logo & Description */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <Link href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="MusicGear Logo"
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-slate-gray max-w-sm leading-relaxed">
              Equipping the next generation of performers with stage-ready gear and relentless tone. คัดสรรเครื่องดนตรีที่ดีที่สุดเพื่อคุณ
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Link href="#" className="text-slate-gray hover:text-neutral-900 transition-colors" aria-label="Facebook">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
              <Link href="#" className="text-slate-gray hover:text-neutral-900 transition-colors" aria-label="Instagram">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
              <Link href="#" className="text-slate-gray hover:text-neutral-900 transition-colors" aria-label="YouTube">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Company</h4>
            <nav className="flex flex-col gap-2.5">
              <Link href="#" className="text-sm text-slate-gray hover:text-neutral-900 transition-colors">About Us</Link>
              <Link href="#" className="text-sm text-slate-gray hover:text-neutral-900 transition-colors">Careers</Link>
              <Link href="#" className="text-sm text-slate-gray hover:text-neutral-900 transition-colors">Contact</Link>
              <Link href="#" className="text-sm text-slate-gray hover:text-neutral-900 transition-colors">Store Locator</Link>
            </nav>
          </div>

          {/* Column 3: Support */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">Support</h4>
            <nav className="flex flex-col gap-2.5">
              <Link href="#" className="text-sm text-slate-gray hover:text-neutral-900 transition-colors">Shipping Policy</Link>
              <Link href="#" className="text-sm text-slate-gray hover:text-neutral-900 transition-colors">Returns</Link>
              <Link href="#" className="text-sm text-slate-gray hover:text-neutral-900 transition-colors">Privacy</Link>
              <Link href="#" className="text-sm text-slate-gray hover:text-neutral-900 transition-colors">Terms of Service</Link>
            </nav>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="border-t border-[#E5E2DA] mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-gray">
            © {new Date().getFullYear()} MusicGear. Electric Stage Performance.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-slate-gray hover:text-neutral-900">Privacy Policy</Link>
            <Link href="#" className="text-xs text-slate-gray hover:text-neutral-900">Terms of Use</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
