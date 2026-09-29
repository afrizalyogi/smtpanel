"use client";

import * as React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore, TemplateRecord } from "@/store";
import { toast } from "sonner";
import { Download, Upload, X, AlertTriangle, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TemplatesPage() {
  const { templates, deleteTemplate, importTemplates } = useAppStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleExport = () => {
    if (templates.length === 0) {
      toast.error("No templates to export.");
      return;
    }
    const dataStr = JSON.stringify(templates, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `smtpanel-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Templates exported successfully.");
  };

  const handleExportSingle = (tpl: TemplateRecord) => {
    const dataStr = JSON.stringify([tpl], null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = tpl.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `smtpanel-template-${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Template "${tpl.name}" exported.`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          // Basic validation
          const validTemplates = json.filter(t => t.id && t.name && t.subject);
          importTemplates(validTemplates);
          toast.success(`Imported ${validTemplates.length} templates successfully.`);
        } else {
          toast.error("Invalid template file format.");
        }
      } catch (err) {
        toast.error("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Templates</h1>
          <p className="text-muted">Manage your saved email templates.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImport} 
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="bg-warn/10 border border-warn/20 rounded-md p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-warn shrink-0 mt-0.5" />
        <div className="text-sm text-fg">
          <span className="font-semibold text-warn">Local Storage:</span> Your data is saved only in this browser. Please export regularly. Clearing browser data or disconnecting will erase it.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-border-soft rounded-lg">
            <FileText className="h-8 w-8 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm">You haven't saved any templates yet.</p>
            <Button variant="secondary" className="mt-4" onClick={() => router.push("/send")}>
              Go to Compose
            </Button>
          </div>
        ) : (
          templates.map((tpl) => (
            <Card key={tpl.id} className="mb-0 flex flex-col">
              <CardHeader className="pb-3 border-b border-border-soft flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-base truncate max-w-[180px]" title={tpl.name}>{tpl.name}</CardTitle>
                  <p className="text-xs text-muted mt-1 truncate max-w-[180px]">{tpl.subject}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleExportSingle(tpl)}
                    className="text-muted hover:text-fg p-1.5 rounded-md hover:bg-surface-warm transition-colors"
                    title="Export Template"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deleteTemplate(tpl.id)}
                    className="text-muted hover:text-danger p-1.5 rounded-md hover:bg-surface-warm transition-colors"
                    title="Delete Template"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1">
                <div className="text-xs text-muted line-clamp-3 font-mono bg-surface-warm p-2 rounded-md h-16 opacity-70">
                  {tpl.html ? tpl.body.replace(/<[^>]+>/g, ' ') : tpl.body}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
