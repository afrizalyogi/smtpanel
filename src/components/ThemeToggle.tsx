"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button 
        type="button"
        className="flex items-center justify-center h-7 w-7 rounded-md border border-border bg-transparent hover:bg-surface-warm text-muted hover:text-fg transition-colors"
        aria-label="Toggle Theme"
      >
        <span className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button 
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center h-7 w-7 rounded-md border border-border bg-transparent hover:bg-surface-warm text-muted hover:text-fg transition-colors"
      title="Toggle Theme"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
