"use client";

import * as React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore, TemplateRecord } from "@/store";
import { toast } from "sonner";
import { X, FileText, Edit, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { Editor } from "@/components/ui/editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardMenu } from "@/components/CardMenu";
import { ImportExportButtons } from "@/components/ImportExportButtons";
import { downloadJson, importJsonArray } from "@/lib/utils";

export default function TemplatesPage() {
  const { templates, saveTemplate, updateTemplate, deleteTemplate, importTemplates } = useAppStore();
  const router = useRouter();

  const [editingTemplate, setEditingTemplate] = React.useState<TemplateRecord | null>(null);
  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [editForm, setEditForm] = React.useState<{name: string; subject: string; body: string}>({ name: "", subject: "", body: "" });

  const handleAddClick = () => {
    setEditForm({ name: "", subject: "", body: "" });
    setIsAddingNew(true);
  };

  const handleEditClick = (tpl: TemplateRecord) => {
    setEditingTemplate(tpl);
    setEditForm({ name: tpl.name, subject: tpl.subject, body: tpl.body });
  };

  const closeEditor = () => {
    setEditingTemplate(null);
    setIsAddingNew(false);
  };

  const saveEdit = () => {
    if (!editForm.name || !editForm.subject) {
      toast.error("Name and Subject are required.");
      return;
    }
    if (isAddingNew) {
      saveTemplate({ ...editForm, html: true });
      toast.success("Template added successfully.");
    } else if (editingTemplate) {
      updateTemplate(editingTemplate.id, editForm);
      toast.success("Template updated successfully.");
    }
    closeEditor();
  };

  const handleExport = () => {
    if (templates.length === 0) {
      toast.error("No templates to export.");
      return;
    }
    downloadJson(templates, `smtpanel-templates-${new Date().toISOString().split('T')[0]}.json`);
    toast.success("Templates exported successfully.");
  };

  const handleExportSingle = (tpl: TemplateRecord) => {
    downloadJson([tpl], `smtpanel-template-${tpl.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
    toast.success(`Template "${tpl.name}" exported.`);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) =>
    importJsonArray(event, "template", (items) => {
      const validTemplates = (items as TemplateRecord[]).filter(t => t.id && t.name && t.subject);
      importTemplates(validTemplates);
      toast.success(`Imported ${validTemplates.length} templates successfully.`);
    });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto relative">
      {(editingTemplate || isAddingNew) && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={closeEditor}>
          <div className="bg-surface border border-border w-full max-w-3xl rounded-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-down" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-border-soft">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Edit className="h-5 w-5 text-accent" /> {isAddingNew ? "Add New Template" : "Edit Template"}</h3>
              <button onClick={closeEditor} className="text-muted hover:text-fg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="p-4 border-t border-border-soft flex flex-col sm:flex-row justify-end gap-3 bg-surface-warm/30">
              <Button variant="secondary" onClick={closeEditor} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={saveEdit} className="w-full sm:w-auto"><Save className="h-4 w-4 mr-2" /> Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
          <Button onClick={handleAddClick} className="w-full sm:w-auto">
            <Edit className="h-4 w-4 mr-2" />
            Add Template
          </Button>
          <ImportExportButtons onImport={handleImport} onExport={handleExport} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-border-soft rounded-lg">
            <FileText className="h-8 w-8 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm">You haven&apos;t saved any templates yet.</p>
            <Button variant="secondary" className="mt-4" onClick={() => router.push("/send")}>
              Go to Compose
            </Button>
          </div>
        ) : (
          templates.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col relative overflow-visible">
              <CardHeader className="pb-3 border-b border-border-soft flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-base truncate max-w-[180px]" title={tpl.name}>{tpl.name}</CardTitle>
                  <p className="text-sm text-muted mt-1 truncate max-w-[180px]">{tpl.subject}</p>
                </div>
                <CardMenu
                  onEdit={() => handleEditClick(tpl)}
                  onExport={() => handleExportSingle(tpl)}
                  onDelete={() => deleteTemplate(tpl.id)}
                />
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
