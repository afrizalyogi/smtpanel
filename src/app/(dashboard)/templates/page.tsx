"use client";

import * as React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore, TemplateRecord } from "@/store";
import { toast } from "sonner";
import { Download, Upload, X, AlertTriangle, FileText, Edit, Save, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { Editor } from "@/components/ui/editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TemplatesPage() {
  const { templates, updateTemplate, deleteTemplate, importTemplates } = useAppStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [editingTemplate, setEditingTemplate] = React.useState<TemplateRecord | null>(null);
  const [editForm, setEditForm] = React.useState<{name: string; subject: string; body: string}>({ name: "", subject: "", body: "" });
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleEditClick = (tpl: TemplateRecord) => {
    setEditingTemplate(tpl);
    setEditForm({ name: tpl.name, subject: tpl.subject, body: tpl.body });
  };

  const saveEdit = () => {
    if (!editingTemplate) return;
    if (!editForm.name || !editForm.subject) {
      toast.error("Name and Subject are required.");
      return;
    }
    updateTemplate(editingTemplate.id, {
      name: editForm.name,
      subject: editForm.subject,
      body: editForm.body
    });
    toast.success("Template updated successfully.");
    setEditingTemplate(null);
  };

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
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto relative">
      {editingTemplate && (
        <div className="fixed inset-0 bg-bg/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border w-full max-w-3xl rounded-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border-soft">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Edit className="h-5 w-5 text-accent" /> Edit Template</h3>
              <button onClick={() => setEditingTemplate(null)} className="text-muted hover:text-fg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Default Subject</Label>
                  <Input value={editForm.subject} onChange={e => setEditForm({...editForm, subject: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2 h-64">
                <Label>Template Body</Label>
                <div className="h-52">
                  <Editor value={editForm.body} onChange={val => setEditForm({...editForm, body: val})} />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border-soft flex justify-end gap-3 bg-surface-warm/30">
              <Button variant="secondary" onClick={() => setEditingTemplate(null)}>Cancel</Button>
              <Button onClick={saveEdit}><Save className="h-4 w-4 mr-2" /> Save Changes</Button>
            </div>
          </div>
        </div>
      )}

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
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => setOpenMenuId(openMenuId === tpl.id ? null : tpl.id)}
                    className="text-muted hover:text-fg p-1.5 rounded-md hover:bg-surface-warm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  
                  {openMenuId === tpl.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-border rounded-md shadow-lg z-10 overflow-hidden py-1 animate-fade-in">
                      <button 
                        onClick={() => { handleEditClick(tpl); setOpenMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-fg hover:bg-surface-warm flex items-center gap-2"
                      >
                        <Edit className="h-3.5 w-3.5 text-muted" /> Edit
                      </button>
                      <button 
                        onClick={() => { handleExportSingle(tpl); setOpenMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-fg hover:bg-surface-warm flex items-center gap-2"
                      >
                        <Download className="h-3.5 w-3.5 text-muted" /> Export
                      </button>
                      <div className="h-px bg-border-soft my-1"></div>
                      <button 
                        onClick={() => { deleteTemplate(tpl.id); setOpenMenuId(null); }}
                        className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-2"
                      >
                        <X className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
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
