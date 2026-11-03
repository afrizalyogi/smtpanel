"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardMenu } from "@/components/CardMenu";
import { ImportExportButtons } from "@/components/ImportExportButtons";
import { useAppStore, type ContactRecord } from "@/store";
import { downloadJson, importJsonArray } from "@/lib/utils";
import { toast } from "sonner";
import { Users, X, Edit, Plus, Search, ArrowUpDown, ChevronDown } from "lucide-react";

export default function ContactsPage() {
  const { contacts, saveContact, updateContact, deleteContact, importContacts } = useAppStore();

  const [isAdding, setIsAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [tagsInput, setTagsInput] = React.useState<string>("");
  const [tags, setTags] = React.useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest");

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { name: "", email: "" },
  });

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    reset();
    setTags([]);
    setTagsInput("");
  };

  const onSubmit = (data: { name: string; email: string }) => {
    if (editingId) {
      updateContact(editingId, { ...data, tags });
      toast.success("Contact updated successfully!");
    } else {
      saveContact({ ...data, tags });
      toast.success("Contact saved successfully!");
    }
    cancelEdit();
  };

  const handleEdit = (contact: ContactRecord) => {
    setIsAdding(true);
    setEditingId(contact.id);
    setValue("name", contact.name);
    setValue("email", contact.email);
    setTags(contact.tags || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleExportSingle = (contact: ContactRecord) =>
    downloadJson([contact], `contact_${contact.name.replace(/\s+/g, '_')}.json`);

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
    downloadJson(contacts, "smtpanel_contacts.json");
    toast.success("All contacts exported.");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) =>
    importJsonArray(event, "contacts", (items) => {
      importContacts(items as ContactRecord[]);
      toast.success(`Imported ${items.length} contacts.`);
    });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
          <Button onClick={() => setIsAdding(true)} className="w-full sm:w-auto" disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
          <ImportExportButtons onImport={handleImport} onExport={handleExportAll} />
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={cancelEdit}>
          <div className="bg-surface border border-border w-full max-w-2xl rounded-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-border-soft">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {editingId ? (
                  <><Edit className="h-5 w-5 text-accent" /> Edit Contact</>
                ) : (
                  <><Users className="h-5 w-5 text-accent" /> Add New Contact</>
                )}
              </h3>
              <button type="button" onClick={cancelEdit} className="text-muted hover:text-fg"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <form id="contact-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              </form>
            </div>

            <div className="p-4 border-t border-border-soft flex flex-col sm:flex-row justify-end gap-3 bg-surface-warm/30">
              <Button type="button" variant="secondary" onClick={cancelEdit} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" form="contact-form" className="w-full sm:w-auto">
                {editingId ? "Update Contact" : "Save Contact"}
              </Button>
            </div>
          </div>
        </div>
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
            <div className="relative w-full sm:w-40">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none h-9 w-full rounded-md border border-border bg-transparent pl-3 pr-8 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-dashed border-border-soft rounded-lg">
            <Users className="h-8 w-8 text-muted mx-auto mb-3" />
            <p className="text-muted text-sm">You haven&apos;t saved any contacts yet.</p>
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
            <Card key={contact.id} className="flex flex-col relative group overflow-visible">
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-fg text-base truncate max-w-[180px]" title={contact.name}>{contact.name}</h3>
                    <p className="text-sm text-muted mt-1 truncate max-w-[180px]" title={contact.email}>{contact.email}</p>
                  </div>
                  <CardMenu
                    onEdit={() => handleEdit(contact)}
                    onExport={() => handleExportSingle(contact)}
                    onDelete={() => deleteContact(contact.id)}
                  />
                </div>

                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {contact.tags.map(t => (
                      <span key={t} className="bg-surface-warm text-muted px-2 py-0.5 rounded-full text-xs font-medium border border-border-soft">
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
