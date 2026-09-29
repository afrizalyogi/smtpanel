"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Send, History, Settings, Menu, Mail, FileText, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/send", label: "Send Email", icon: Send },
  { href: "/sent", label: "Sent History", icon: History },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const { identity, clearData } = useAppStore();

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleDisconnect = async () => {
    try {
      setShowUserMenu(false);
      await fetch('/api/smtp/disconnect', { method: 'POST' });
      clearData();
      toast.success("SMTP Disconnected.");
      router.push("/");
    } catch (e) {
      toast.error("Failed to disconnect.");
    }
  };

  return (
    <div className="flex h-screen flex-col md:flex-row bg-bg overflow-hidden">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-surface transition-transform duration-300 md:static md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 border-b border-border-soft p-5">
          <Mail className="h-6 w-6 text-fg" />
          <span className="font-semibold tracking-wide text-fg">SMTPanel</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md mx-3 px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-fg"
                    : "text-muted hover:bg-white/5 hover:text-fg"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-fg" : "text-muted")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pb-3">
          {/* User Profile Block & Menu */}
          <div className="relative">
            {showUserMenu && (
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
            )}
            
            {showUserMenu && (
              <div className="absolute bottom-full left-0 mb-1 w-full bg-surface border border-border-soft rounded-md shadow-lg z-50 overflow-hidden animate-fade-in">
                <button 
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect SMTP
                </button>
              </div>
            )}

            <div 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "flex items-center justify-between rounded-md transition-colors p-3 cursor-pointer",
                showUserMenu ? "bg-surface-warm/50" : "hover:bg-surface-warm/50"
              )}
            >
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-fg">
                  {identity.fromName || "No Name"}
                </span>
                <span className="truncate text-xs text-muted">
                  {identity.fromEmail || "No Email"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-border-soft pt-3 flex justify-start items-center px-2 gap-2">
            <a 
              href="https://github.com/afrizalyogi/smtpanel"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-7 w-7 rounded-md border border-border bg-transparent hover:bg-surface-warm text-muted hover:text-fg transition-colors"
              title="View Source on GitHub"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 9 18.13V22"></path></svg>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Topbar */}
        <header className="flex items-center justify-between border-b border-border bg-surface p-3 md:hidden">
          <div className="flex items-center gap-2 font-semibold">
            <Mail className="h-5 w-5 text-fg" />
            SMTPanel
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded p-1 hover:bg-surface-warm flex items-center justify-center h-7 w-7"
          >
            <Menu className="h-5 w-5 text-fg" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
