"use client";

import * as React from "react";
import { Download, Edit, MoreHorizontal, X } from "lucide-react";

/** The "…" menu on contact and template cards: Edit, Export, Delete. */
export function CardMenu({ onEdit, onExport, onDelete }: { onEdit: () => void; onExport: () => void; onDelete: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const item = (label: string, icon: React.ReactNode, action: () => void, danger = false) => (
    <button
      onClick={() => { action(); setOpen(false); }}
      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${danger ? "text-danger hover:bg-danger/10" : "text-fg hover:bg-surface-warm"}`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-muted hover:text-fg p-1 rounded-md transition-colors focus:outline-none"
      >
        <MoreHorizontal className="h-4 w-4 pointer-events-none" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-border rounded-md shadow-lg z-50 py-1 animate-fade-in">
          {item("Edit", <Edit className="h-3.5 w-3.5 text-muted" />, onEdit)}
          {item("Export", <Download className="h-3.5 w-3.5 text-muted" />, onExport)}
          <div className="h-px bg-border-soft my-1"></div>
          {item("Delete", <X className="h-3.5 w-3.5" />, onDelete, true)}
        </div>
      )}
    </div>
  );
}
