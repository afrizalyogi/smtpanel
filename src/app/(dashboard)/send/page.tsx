"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Paperclip, X, Save, FolderOpen, ChevronDown } from "lucide-react";
import { Editor } from "@/components/ui/editor";
import { formatFrom, sendEmail } from "@/lib/utils";

type ContactField = "to" | "cc" | "bcc" | "replyTo";

const rowClass = "flex flex-col sm:flex-row sm:items-center px-4 py-2.5 border-b border-border-soft focus-within:bg-surface-warm/10 transition-colors gap-1 sm:gap-0";
const labelClass = "text-muted text-sm w-full sm:w-20 font-medium";
const inputClass = "w-full bg-transparent outline-none text-sm text-fg placeholder:text-muted/50 py-1 disabled:opacity-50";

type FormData = {
  to: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  inReplyTo?: string;
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
  const [activeContactField, setActiveContactField] = React.useState<ContactField | null>(null);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
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
  const watchValues = watch();

  const contactSuggestions = (field: ContactField) => {
    if (activeContactField !== field) return null;
    const query = (watchValues[field] || "").toLowerCase();
    const list = [...contacts]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(c => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query));
    if (list.length === 0) return null;

    return (
      <div className="absolute top-full left-0 mt-1 w-full max-w-md bg-surface border border-border rounded-md shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
        {list.map(c => (
          <button
            key={c.id}
            type="button"
            onMouseDown={(e) => {
              // Prevent input blur before click is handled
              e.preventDefault();
              setValue(field, c.email, { shouldValidate: true });
              setActiveContactField(null);
            }}
            className="w-full text-left p-3 border-b border-border-soft bg-surface hover:bg-surface-warm transition-colors flex flex-col last:border-b-0"
          >
            <span className="text-sm font-semibold text-fg">{c.name}</span>
            <span className="text-xs text-muted">{c.email}</span>
          </button>
        ))}
      </div>
    );
  };

  const contactInput = (field: ContactField, type: string, placeholder: string) => (
    <>
      <input
        type={type}
        placeholder={placeholder}
        className={inputClass}
        disabled={sendMutation.isPending}
        autoComplete="off"
        onFocus={() => setActiveContactField(field)}
        {...register(field, { onBlur: () => setActiveContactField(null) })}
      />
      {contactSuggestions(field)}
    </>
  );

  const contactRow = (field: ContactField, label: string, type: string, placeholder: string) => (
    <div className={rowClass}>
      <span className={labelClass}>{label}</span>
      <div className="flex-1 relative w-full">{contactInput(field, type, placeholder)}</div>
    </div>
  );

  const fromDisplay = formatFrom(identity);

  const sendMutation = useMutation({
    mutationFn: (data: FormData) =>
      sendEmail({
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        replyTo: data.replyTo,
        inReplyTo: data.inReplyTo,
        priority: data.priority !== "normal" ? data.priority : undefined,
        readReceipt: data.readReceipt ? "true" : undefined,
        subject: data.subject,
        fromDisplay,
        html: data.body,
      }, attachments),
    onSuccess: (msgId, data) => {
      addEmail({ to: data.to, subject: data.subject, status: 'Sent', msgId, body: data.body, html: true });
      toast.success("Email sent successfully.");
      reset();
      setAttachments([]);
      setShowCcBcc(false);
      setShowMoreOptions(false);
      router.push("/sent");
    },
    onError: (error: Error, data) => {
      addEmail({ to: data.to, subject: data.subject, status: 'Failed', msgId: '-', body: data.body, html: true });
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

      const currentSize = attachments.reduce((acc, f) => acc + f.size, 0);
      const newSize = newFiles.reduce((acc, f) => acc + f.size, 0);

      if (currentSize + newSize > 4 * 1024 * 1024) {
        toast.error("Total attachment size exceeds 4MB limit to prevent server payload errors.");
        return;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Compose Email</h1>
        <div className="relative w-full sm:w-auto">
          <Button variant="secondary" onClick={() => setShowTemplates(!showTemplates)} className="w-full sm:w-auto">
            <FolderOpen className="h-4 w-4 mr-2" />
            Templates ({templates.length})
          </Button>
          {showTemplates && (
            <>
              <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setShowTemplates(false)} />
              <div className="absolute right-0 left-0 sm:left-auto top-full mt-2 w-full sm:w-80 bg-surface border border-border rounded-md shadow-lg z-50 overflow-hidden animate-slide-down">
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
                      className="w-full text-left p-3 rounded-md border border-border-soft bg-surface hover:bg-surface-warm hover:border-border hover:shadow-sm transition-all block"
                    >
                      <div className="text-sm font-semibold text-fg truncate">
                        {tpl.name}
                      </div>
                      <div className="text-sm text-muted truncate mt-1">
                        {tpl.subject}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col shadow-sm">
        
        {/* From Field (Muted) */}
        <div className="flex flex-col sm:flex-row sm:items-center px-4 py-3 border-b border-border-soft bg-surface-warm/30 gap-1 sm:gap-0">
          <span className={labelClass}>From</span>
          <span className="flex-1 text-sm text-fg-2 break-all">{fromDisplay || "Not configured (Using SMTP Username)"}</span>
        </div>

        {/* To Field with Cc/Bcc Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center px-4 py-2.5 border-b border-border-soft group focus-within:bg-surface-warm/10 transition-colors relative gap-1 sm:gap-0">
          <span className={labelClass}>To</span>
          <div className="flex-1 flex items-center relative w-full">
            {contactInput("to", "email", "recipient@example.com")}
          </div>
          
          {!showCcBcc && (
            <button 
              type="button" 
              onClick={() => setShowCcBcc(true)}
              className="whitespace-nowrap shrink-0 text-sm font-medium text-muted hover:text-fg px-2 py-1 transition-colors w-full sm:w-auto text-left sm:text-center mt-1 sm:mt-0 -ml-2 sm:ml-0"
            >
              Cc / Bcc
            </button>
          )}
        </div>

        {/* Cc & Bcc Fields */}
        {showCcBcc && (
          <>
            {contactRow("cc", "Cc", "text", "cc@example.com")}
            {contactRow("bcc", "Bcc", "text", "bcc@example.com")}
          </>
        )}

        {/* Subject Field */}
        <div className={rowClass}>
          <span className={labelClass}>Subject</span>
          <div className="flex-1 w-full flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
            <input 
              type="text" 
              placeholder="Hello from SMTPanel"
              className={inputClass}
              required 
              disabled={sendMutation.isPending}
              {...register("subject")} 
            />
            {!showMoreOptions && (
              <button 
                type="button" 
                onClick={() => setShowMoreOptions(true)}
                className="whitespace-nowrap shrink-0 text-sm font-medium text-muted hover:text-fg px-2 py-1 transition-colors sm:ml-2 w-full sm:w-auto text-left sm:text-center mt-1 sm:mt-0 -ml-2 sm:ml-0"
              >
                More Options
              </button>
            )}
          </div>
        </div>

        {/* More Options Fields */}
        {showMoreOptions && (
          <>
            {contactRow("replyTo", "Reply-To", "email", "reply@example.com")}
            <div className="flex flex-col sm:flex-row sm:items-start px-4 py-2.5 border-b border-border-soft focus-within:bg-surface-warm/10 transition-colors gap-1 sm:gap-0">
              <div className="w-full sm:w-20 pt-1">
                <span className="text-muted text-sm font-medium">In-Reply-To</span>
              </div>
              <div className="flex-1 relative w-full flex flex-col">
                <input 
                  type="text" 
                  placeholder="<message-id@domain.com>"
                  className={inputClass}
                  disabled={sendMutation.isPending}
                  autoComplete="off"
                  {...register("inReplyTo")} 
                />
                <span className="text-xs text-muted/60 mt-0.5">Message-ID to thread this reply</span>
              </div>
            </div>
            <div className={rowClass}>
              <span className={labelClass}>Priority</span>
              <div className="relative flex-1 w-full">
                <select 
                  className="appearance-none w-full bg-transparent outline-none text-sm text-fg py-1 pr-8 disabled:opacity-50 cursor-pointer"
                  disabled={sendMutation.isPending}
                  {...register("priority")}
                >
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              </div>
            </div>
            <div className="px-4 py-3 border-b border-border-soft focus-within:bg-surface-warm/10 transition-colors">
              <Checkbox 
                label="Read Receipt"
                description="Request a read receipt from the recipient"
                disabled={sendMutation.isPending}
                {...register("readReceipt")}
              />
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
              <div key={i} className="flex items-center justify-between bg-surface-warm border border-border-soft rounded-md px-3 py-2 text-sm">
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
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-4 py-3 bg-surface-warm/30 border-t border-border-soft">
          <div className="relative w-full sm:w-auto">
            <input 
              type="file" 
              multiple 
              disabled={sendMutation.isPending}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
              onChange={handleFileChange}
            />
            <Button type="button" variant="secondary" disabled={sendMutation.isPending} className="w-full sm:w-auto">
              <Paperclip className="h-4 w-4 mr-2" />
              Add Attachments
            </Button>
          </div>
          <Button type="submit" disabled={sendMutation.isPending} className="w-full sm:w-auto">
            {sendMutation.isPending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </form>
    </div>
  );
}
