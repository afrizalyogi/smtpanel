"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Send, History, Settings, Menu, Mail, FileText, LogOut, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { toast } from "sonner";

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
          <div className="relative mb-3">
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
                showUserMenu ? "bg-white/5" : "hover:bg-white/5"
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

          <div className="border-t border-border-soft pt-3">
            <div className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="font-mono text-fg text-xs">SMTP Connected</span>
            </div>
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
            className="rounded p-1 hover:bg-surface-warm"
          >
            <Menu className="h-6 w-6 text-fg" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
