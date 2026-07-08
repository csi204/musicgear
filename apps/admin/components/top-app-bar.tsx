"use client";

import { Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function TopAppBar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 border-b bg-background flex items-center justify-end px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        {mounted && (
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-xs border px-2 py-1 rounded"
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        )}
        
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
        
        <div className="h-8 w-8 rounded-full bg-muted border overflow-hidden">
          {/* Avatar Placeholder */}
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-medium text-xs">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
