"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Paperclip, X, Save, FolderOpen } from "lucide-react";
import { Editor } from "@/components/ui/editor";

type FormData = {
  to: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  priority?: "high" | "normal" | "low";
  readReceipt?: boolean;
  subject: string;
  body: string;
};

export default function SendPage() {
  const { identity, addEmail, templates, saveTemplate, contacts } = useAppStore();
  const [showCcBcc, setShowCcBcc] = React.useState(false);
  const [showMoreOptions, setShowMoreOptions] = React.useState(false);
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [showContacts, setShowContacts] = React.useState(false);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const { register, handleSubmit, reset, setValue, watch, setFocus } = useForm<FormData>({
    defaultValues: {
      priority: "normal",
      readReceipt: false,
      body: ""
    }
  });

  // Explicitly register body so it doesn't unregister when switching tabs
  React.useEffect(() => {
    register("body", { required: true });
  }, [register]);
  const router = useRouter();
  
  const watchBody = watch("body");
  const watchSubject = watch("subject");
  const watchTo = watch("to");

  const filteredContacts = React.useMemo(() => {
    if (!watchTo || watchTo.length < 1) return [];
    const lower = watchTo.toLowerCase();
    return contacts.filter(c => c.name.toLowerCase().includes(lower) || c.email.toLowerCase().includes(lower));
  }, [watchTo, contacts]);

  const fromDisplay = identity.fromName && identity.fromEmail 
    ? `${identity.fromName} <${identity.fromEmail}>`
    : identity.fromEmail || "";

  const sendMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append("to", data.to);
      if (data.cc) formData.append("cc", data.cc);
      if (data.bcc) formData.append("bcc", data.bcc);
      if (data.replyTo) formData.append("replyTo", data.replyTo);
      if (data.priority && data.priority !== "normal") formData.append("priority", data.priority);
      if (data.readReceipt) formData.append("readReceipt", "true");
      formData.append("subject", data.subject);
      if (fromDisplay) formData.append("fromDisplay", fromDisplay);
      
      formData.append("html", data.body);

      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const res = await fetch('/api/emails/send', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send email');
      return { data, msgId: json.messageId || '<unknown>' };
    },
    onSuccess: ({ data, msgId }) => {
      addEmail({
        id: 'msg_' + Date.now(),
        to: data.to,
        subject: data.subject,
        status: 'Sent',
        date: new Date().toLocaleString(),
        msgId,
        body: data.body,
        html: true,
      });
      toast.success("Email sent successfully.");
      reset();
      setAttachments([]);
      setShowCcBcc(false);
      setShowMoreOptions(false);
      router.push("/sent");
    },
    onError: (error: Error, variables) => {
      addEmail({
        id: 'msg_' + Date.now(),
        to: variables.to,
        subject: variables.subject,
        status: 'Failed',
        date: new Date().toLocaleString(),
        msgId: '-',
        body: variables.body,
        html: true,
      });
      toast.error(error.message);
    }
  });

  const onSubmit = (data: FormData) => {
    sendMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      if (attachments.length + newFiles.length > 5) {
        toast.error("Maximum 5 attachments allowed.");
        return;
      }

      for (const file of newFiles) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds 10MB limit.`);
          return;
        }
      }

      setAttachments([...attachments, ...newFiles]);
    }
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = () => {
    if (!watchSubject) {
      toast.error("Please enter a subject to save as a template.");
      return;
    }
    saveTemplate({
      id: 'tpl_' + Date.now(),
      name: watchSubject,
      subject: watchSubject,
      body: watchBody || "",
      html: true,
    });
    toast.success("Saved to templates.");
  };

  const loadTemplate = (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setValue("subject", tpl.subject);
      setValue("body", tpl.body);
      setShowTemplates(false);
      toast.info("Template loaded.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Compose Email</h1>
        <div className="relative">
          <Button variant="secondary" onClick={() => setShowTemplates(!showTemplates)}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Templates ({templates.length})
          </Button>
          {showTemplates && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-md shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-border-soft flex justify-between items-center bg-surface-warm/50">
                <span className="text-sm font-medium text-fg">Select Template</span>
                <button type="button" onClick={() => setShowTemplates(false)} className="text-muted hover:text-fg"><X className="h-4 w-4" /></button>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-2 space-y-2 bg-bg/50">
                {templates.length === 0 ? (
                  <div className="p-4 text-center text-muted text-sm">No templates saved.</div>
                ) : (
                  templates.map((tpl) => (
                    <button 
                      key={tpl.id} 
                      type="button" 
                      onClick={() => loadTemplate(tpl.id)} 
                      className="w-full text-left p-3 rounded-md border border-border-soft bg-surface hover:bg-accent/10 hover:border-accent/30 hover:shadow-sm transition-all block"
                    >
                      <div className="text-sm font-semibold text-fg truncate">
                        {tpl.name}
                      </div>
                      <div className="text-xs text-muted truncate mt-1">
                        {tpl.subject}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col shadow-sm">
        
        {/* From Field (Muted) */}
        <div className="flex items-center px-4 py-3 border-b border-border-soft bg-surface-warm/30">
          <span className="text-muted text-sm w-20 font-medium">From</span>
          <span className="flex-1 text-sm text-fg-2">{fromDisplay || "Not configured (Using SMTP Username)"}</span>
        </div>

        {/* To Field with Cc/Bcc Toggle */}
        <div className="flex items-center px-4 py-2.5 border-b border-border-soft group focus-within:bg-surface-warm/10 transition-colors relative">
          <span className="text-muted text-sm w-20 font-medium">To</span>
          <div className="flex-1 flex items-center relative">
            <input 
              type="email" 
              placeholder="recipient@example.com"
              className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-muted/50 py-1 disabled:opacity-50" 
              required 
              disabled={sendMutation.isPending}
              autoComplete="off"
              {...register("to", {
                onBlur: () => setTimeout(() => setShowContacts(false), 200),
                onChange: () => setShowContacts(true)
              })} 
            />
            
            {showContacts && filteredContacts.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full max-w-md bg-surface border border-border rounded-md shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                {filteredContacts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setValue("to", c.email, { shouldValidate: true });
                      setShowContacts(false);
                    }}
                    className="w-full text-left p-3 border-b border-border-soft bg-surface hover:bg-accent/10 transition-colors flex flex-col last:border-b-0"
                  >
                    <span className="text-sm font-semibold text-fg">{c.name}</span>
                    <span className="text-xs text-muted">{c.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {!showCcBcc && (
            <button 
              type="button" 
              onClick={() => setShowCcBcc(true)}
              className="text-sm font-medium text-muted hover:text-fg px-2 py-1 transition-colors"
            >
              Cc / Bcc
            </button>
          )}
        </div>

        {/* Cc & Bcc Fields */}
        {showCcBcc && (
          <>
            <div className="flex items-center px-4 py-2.5 border-b border-border-soft focus-within:bg-surface-warm/10 transition-colors">
              <span className="text-muted text-sm w-20 font-medium">Cc</span>
              <input 
                type="text" 
                placeholder="cc@example.com"
                className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-muted/50 py-1 disabled:opacity-50" 
                disabled={sendMutation.isPending}
                {...register("cc")} 
              />
            </div>
            <div className="flex items-center px-4 py-2.5 border-b border-border-soft focus-within:bg-surface-warm/10 transition-colors">
              <span className="text-muted text-sm w-20 font-medium">Bcc</span>
              <input 
                type="text" 
                placeholder="bcc@example.com"
                className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-muted/50 py-1 disabled:opacity-50" 
                disabled={sendMutation.isPending}
                {...register("bcc")} 
              />
            </div>
          </>
        )}

        {/* Subject Field */}
        <div className="flex items-center px-4 py-2.5 border-b border-border-soft focus-within:bg-surface-warm/10 transition-colors">
          <span className="text-muted text-sm w-20 font-medium">Subject</span>
          <input 
            type="text" 
            placeholder="Hello from SMTPanel"
            className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-muted/50 py-1 disabled:opacity-50" 
            required 
            disabled={sendMutation.isPending}
            {...register("subject")} 
          />
          {!showMoreOptions && (
            <button 
              type="button" 
              onClick={() => setShowMoreOptions(true)}
              className="text-sm font-medium text-muted hover:text-fg px-2 py-1 transition-colors ml-2"
            >
              More Options
            </button>
          )}
        </div>

        {/* More Options Fields */}
        {showMoreOptions && (
          <>
            <div className="flex items-center px-4 py-2.5 border-b border-border-soft focus-within:bg-surface-warm/10 transition-colors">
              <span className="text-muted text-sm w-20 font-medium">Reply-To</span>
              <input 
                type="email" 
                placeholder="support@example.com (Optional)"
                className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-muted/50 py-1 disabled:opacity-50" 
                disabled={sendMutation.isPending}
                {...register("replyTo")} 
              />
            </div>
            <div className="flex items-center px-4 py-2.5 border-b border-border-soft focus-within:bg-surface-warm/10 transition-colors">
              <span className="text-muted text-sm w-20 font-medium">Priority</span>
              <select 
                className="bg-transparent outline-none text-sm text-fg py-1 disabled:opacity-50 cursor-pointer"
                disabled={sendMutation.isPending}
                {...register("priority")}
              >
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center px-4 py-2.5 border-b border-border-soft focus-within:bg-surface-warm/10 transition-colors">
              <span className="text-muted text-sm w-20 font-medium whitespace-nowrap">Read Receipt</span>
              <div className="flex items-center flex-1">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-border bg-transparent text-accent focus:ring-accent focus:ring-2 cursor-pointer disabled:opacity-50"
                  disabled={sendMutation.isPending}
                  {...register("readReceipt")}
                />
                <span className="ml-2 text-xs text-muted">Request a read receipt from the recipient</span>
              </div>
            </div>
          </>
        )}

        {/* Format Toggle & Body Area */}
        <div className="flex flex-col flex-1">
          <div className="flex px-4 py-2 bg-surface-warm/30 border-b border-border-soft gap-4 text-sm font-medium items-center justify-end">
            <button type="button" onClick={handleSaveTemplate} className="text-muted hover:text-fg flex items-center gap-1 transition-colors">
              <Save className="h-4 w-4" /> Save Template
            </button>
          </div>
          
          <div className="p-4 flex-1">
            <Editor 
              value={watchBody || ""}
              onChange={(val) => setValue("body", val)}
              placeholder="Write your message here..."
              disabled={sendMutation.isPending}
            />
          </div>
        </div>

        {/* Attachments Display */}
        {attachments.length > 0 && (
          <div className="px-4 pb-4 space-y-2">
            {attachments.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-warm border border-border-soft rounded-md px-3 py-2 text-xs">
                <span className="flex items-center gap-2 text-fg">
                  <Paperclip className="h-3 w-3" />
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <button type="button" onClick={() => removeAttachment(i)} className="text-muted hover:text-danger">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-warm/30 border-t border-border-soft">
          <div className="relative">
            <input 
              type="file" 
              multiple 
              disabled={sendMutation.isPending}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
              onChange={handleFileChange}
            />
            <Button type="button" variant="secondary" disabled={sendMutation.isPending}>
              <Paperclip className="h-4 w-4 mr-2" />
              Add Attachments
            </Button>
          </div>
          <Button type="submit" disabled={sendMutation.isPending} className="bg-accent hover:bg-accent-hover text-accent-on">
            {sendMutation.isPending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </form>
    </div>
  );
}
