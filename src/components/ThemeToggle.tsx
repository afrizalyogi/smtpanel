"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";

const iconButton = "flex items-center justify-center h-7 w-7 rounded-md border border-border bg-transparent hover:bg-surface-warm text-muted hover:text-fg transition-colors";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <button type="button" className={iconButton} aria-label="Toggle Theme">
        <span className="h-[18px] w-[18px]" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={iconButton}
      title="Toggle Theme"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export function GitHubLink({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://github.com/afrizalyogi/smtpanel"
      target="_blank"
      rel="noopener noreferrer"
      className={`${iconButton} ${className}`}
      title="View Source on GitHub"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 9 18.13V22"></path></svg>
    </a>
  );
}
