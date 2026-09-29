"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store";
import { toast } from "sonner";
import { Users, Upload, Download, X } from "lucide-react";

export default function ContactsPage() {
  const { contacts, saveContact, deleteContact, importContacts } = useAppStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = (data: any) => {
    saveContact({
      id: 'contact_' + Date.now(),
      name: data.name,
      email: data.email,
    });
    toast.success("Contact saved successfully!");
    reset();
  };

  const handleExportSingle = (contact: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify([contact], null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `contact_${contact.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportAll = () => {
    if (contacts.length === 0) {
      toast.error("No contacts to export.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contacts, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "smtpanel_contacts.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("All contacts exported.");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          importContacts(parsed);
          toast.success(`Imported ${parsed.length} contacts.`);
        } else {
          toast.error("Invalid contacts file format.");
        }
      } catch (err) {
        toast.error("Failed to parse contacts file.");
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleImport} 
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required placeholder="John Doe" {...register("name")} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input required type="email" placeholder="john@example.com" {...register("email")} />
              </div>
            </div>
            <Button type="submit">Save Contact</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {contacts.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-border-soft rounded-lg">
            <Users className="h-8 w-8 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm">You haven't saved any contacts yet.</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} className="mb-0 flex flex-col relative group">
              <CardContent className="p-5 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-fg text-base truncate max-w-[180px]" title={contact.name}>{contact.name}</h3>
                    <p className="text-sm text-muted mt-1 truncate max-w-[180px]" title={contact.email}>{contact.email}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleExportSingle(contact)}
                      className="text-muted hover:text-fg p-1.5 rounded-md hover:bg-surface-warm transition-colors"
                      title="Export Contact"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => deleteContact(contact.id)}
                      className="text-muted hover:text-danger p-1.5 rounded-md hover:bg-surface-warm transition-colors"
                      title="Delete Contact"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
