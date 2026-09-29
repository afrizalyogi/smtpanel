"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Send, History, Settings, Menu, Mail, FileText, LogOut, Users, PanelLeftClose, PanelLeftOpen, AlertTriangle, X } from "lucide-react";
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
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const { identity, clearData, hasSeenWarning, dismissWarning } = useAppStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleDisconnect = async () => {
    try {
      await fetch('/api/smtp/disconnect', { method: 'POST' });
      clearData();
      toast.success("SMTP Disconnected.");
      router.push("/");
    } catch (e) {
      toast.error("Failed to disconnect.");
    }
  };

  return (
    <div className="flex min-w-[260px] h-screen flex-col md:flex-row bg-bg overflow-hidden">
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
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface transition-all duration-300 md:static md:translate-x-0",
          sidebarCollapsed ? "w-[72px]" : "w-[260px]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        onClick={(e) => {
          if (!sidebarCollapsed) return;
          const target = e.target as HTMLElement;
          if (!target.closest('a') && !target.closest('button')) {
            setSidebarCollapsed(false);
          }
        }}
      >
        <div className={cn("relative flex items-center border-b border-border-soft p-5", sidebarCollapsed ? "justify-center px-0" : "justify-between gap-2")}>
          <div className="flex items-center gap-2 overflow-hidden">
            <Mail className="h-6 w-6 text-fg shrink-0" />
            {!sidebarCollapsed && <span className="font-semibold tracking-wide text-fg whitespace-nowrap">SMTPanel</span>}
          </div>
          {!sidebarCollapsed && (
            <button 
              onClick={() => setSidebarCollapsed(true)} 
              className="text-muted hover:text-fg transition-colors hidden md:block"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
          {sidebarCollapsed && (
            <button 
              onClick={() => setSidebarCollapsed(false)} 
              className="absolute -right-3 top-1/2 -translate-y-1/2 bg-surface border border-border rounded-full p-1 text-muted hover:text-fg shadow-sm hidden md:block z-50"
            >
              <PanelLeftOpen className="h-3 w-3" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                  sidebarCollapsed ? "justify-center mx-2 px-0" : "gap-3 mx-3 px-3",
                  isActive
                    ? "bg-white/10 text-fg"
                    : "text-muted hover:bg-white/5 hover:text-fg"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-fg" : "text-muted")} />
                {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-3 pb-3">
          {/* User Profile Block */}
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between rounded-md p-3 pb-1">
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-fg">
                  {identity.fromName || "No Name"}
                </span>
                <span className="truncate text-xs text-muted">
                  {identity.fromEmail || "No Email"}
                </span>
              </div>
            </div>
          )}

          <div className={cn("mt-3 border-t border-border-soft pt-3 flex items-center overflow-hidden", sidebarCollapsed ? "flex-col gap-3 px-0 justify-center" : "flex-row justify-between px-2")}>
            <div className="flex gap-2">
              <a 
                href="https://github.com/afrizalyogi/smtpanel"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-7 w-7 rounded-md border border-border bg-transparent hover:bg-surface-warm text-muted hover:text-fg transition-colors shrink-0"
                title="View Source on GitHub"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 9 18.13V22"></path></svg>
              </a>
              <ThemeToggle />
            </div>
            
            <button 
              onClick={handleDisconnect}
              title="Disconnect SMTP"
              className="flex items-center justify-center h-7 w-7 rounded-md border border-border bg-transparent hover:bg-danger/10 text-muted hover:text-danger transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
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

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative block">
          {mounted && !hasSeenWarning && (
            <div className="bg-warn/10 border border-warn/20 rounded-md p-4 flex items-start justify-between gap-3 mb-6 shrink-0 animate-slide-down shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warn shrink-0 mt-0.5" />
                <div className="text-sm text-fg">
                  <span className="font-semibold text-warn">Local Storage:</span> Your data is saved only in this browser. Please export regularly. Clearing browser data or disconnecting will erase it.
                </div>
              </div>
              <button onClick={dismissWarning} className="text-muted hover:text-fg shrink-0 p-1 rounded-md transition-colors hover:bg-warn/10">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
