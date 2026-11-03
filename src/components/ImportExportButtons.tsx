"use client";

import * as React from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImportExportButtons({ onImport, onExport }: { onImport: React.ChangeEventHandler<HTMLInputElement>; onExport: () => void }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={onImport} />
      <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none">
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>
      <Button variant="secondary" onClick={onExport} className="flex-1 sm:flex-none">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </div>
  );
}
