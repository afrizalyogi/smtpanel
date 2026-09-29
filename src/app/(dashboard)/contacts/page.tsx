"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store";
import { toast } from "sonner";
import { Users, Upload, Download, X, Edit, Plus, MoreHorizontal, Search, ArrowUpDown } from "lucide-react";

export default function ContactsPage() {
  const { contacts, saveContact, updateContact, deleteContact, importContacts } = useAppStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isAdding, setIsAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tagsInput, setTagsInput] = React.useState<string>("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest");

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.menu-trigger') && !target.closest('.menu-dropdown')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = (data: any) => {
    if (editingId) {
      updateContact(editingId, {
        name: data.name,
        email: data.email,
        tags
      });
      toast.success("Contact updated successfully!");
      setEditingId(null);
      setIsAdding(false);
    } else {
      saveContact({
        id: 'contact_' + Date.now(),
        name: data.name,
        email: data.email,
        tags
      });
      toast.success("Contact saved successfully!");
      setIsAdding(false);
    }
    reset();
    setTags([]);
    setTagsInput("");
  };

  const handleEdit = (contact: any) => {
    setIsAdding(true);
    setEditingId(contact.id);
    setValue("name", contact.name);
    setValue("email", contact.email);
    setTags(contact.tags || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    reset();
    setTags([]);
    setTagsInput("");
  };

  const addTag = () => {
    const t = tagsInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagsInput("");
  };

  const handleTagsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
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

  const filteredAndSortedContacts = React.useMemo(() => {
    let result = [...contacts];
    
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(lowerQ) || 
        c.email.toLowerCase().includes(lowerQ) || 
        (c.tags && c.tags.some(t => t.toLowerCase().includes(lowerQ)))
      );
    }

    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
        result.reverse();
        break;
      case "oldest":
        break;
    }

    return result;
  }, [contacts, searchQuery, sortBy]);

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
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsAdding(true)} className="w-full sm:w-auto" disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImport} 
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="secondary" onClick={handleExportAll} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {isAdding && (
      <Card className={editingId ? "border-accent/50 shadow-md transition-all" : ""}>
        <CardHeader>
          <CardTitle>
            {editingId ? <span className="text-accent">Edit Contact</span> : <span>Add New Contact</span>}
          </CardTitle>
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

            <div className="space-y-2">
              <Label>Tags (Optional)</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Work, VIP" 
                  value={tagsInput} 
                  onChange={e => setTagsInput(e.target.value)}
                  onKeyDown={handleTagsKeyDown}
                />
                <Button type="button" variant="secondary" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 bg-surface-warm border border-border-soft px-2.5 py-1 rounded-full text-xs font-medium text-fg-2">
                      {t}
                      <button type="button" onClick={() => removeTag(t)} className="text-muted hover:text-danger rounded-full focus:outline-none"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" className="w-full sm:w-auto">
                {editingId ? "Update Contact" : "Save Contact"}
              </Button>
              <Button type="button" variant="ghost" onClick={cancelEdit} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Search and Sort Controls */}
      {contacts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface border border-border p-3 rounded-lg shadow-sm w-full">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-full"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown className="h-4 w-4 text-muted shrink-0" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 w-full sm:w-40 rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-border-soft rounded-lg">
            <Users className="h-8 w-8 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm">You haven't saved any contacts yet.</p>
          </div>
        ) : filteredAndSortedContacts.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-border-soft rounded-lg">
            <Search className="h-8 w-8 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm">No contacts match your search.</p>
            <Button variant="ghost" onClick={() => setSearchQuery("")} className="mt-4">
              Clear Search
            </Button>
          </div>
        ) : (
          filteredAndSortedContacts.map((contact) => (
            <Card key={contact.id} className="mb-0 flex flex-col relative group overflow-visible">
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-fg text-base truncate max-w-[180px]" title={contact.name}>{contact.name}</h3>
                    <p className="text-sm text-muted mt-1 truncate max-w-[180px]" title={contact.email}>{contact.email}</p>
                  </div>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setOpenMenuId(openMenuId === contact.id ? null : contact.id)}
                      className="menu-trigger text-muted hover:text-fg p-1 rounded-md transition-colors focus:outline-none"
                    >
                      <MoreHorizontal className="h-4 w-4 pointer-events-none" />
                    </button>
                    
                    {openMenuId === contact.id && (
                      <div className="menu-dropdown absolute right-0 top-full mt-1 w-36 bg-surface border border-border rounded-md shadow-lg z-50 py-1 animate-fade-in">
                        <button 
                          onClick={() => { handleEdit(contact); setOpenMenuId(null); }}
                          className="w-full text-left px-3 py-2 text-sm text-fg hover:bg-surface-warm flex items-center gap-2"
                        >
                          <Edit className="h-3.5 w-3.5 text-muted" /> Edit
                        </button>
                        <button 
                          onClick={() => { handleExportSingle(contact); setOpenMenuId(null); }}
                          className="w-full text-left px-3 py-2 text-sm text-fg hover:bg-surface-warm flex items-center gap-2"
                        >
                          <Download className="h-3.5 w-3.5 text-muted" /> Export
                        </button>
                        <div className="h-px bg-border-soft my-1"></div>
                        <button 
                          onClick={() => { deleteContact(contact.id); setOpenMenuId(null); }}
                          className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-2"
                        >
                          <X className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {contact.tags.map(t => (
                      <span key={t} className="bg-surface-warm text-muted px-2 py-0.5 rounded-full text-[10px] font-medium border border-border-soft">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
