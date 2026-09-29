"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Paperclip, X } from "lucide-react";

type FormData = {
  to: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  priority?: "high" | "normal" | "low";
  subject: string;
  body: string;
};

export default function SendPage() {
  const { identity, addEmail } = useAppStore();
  const [tab, setTab] = React.useState<"HTML" | "Plain Text">("HTML");
  const [showCcBcc, setShowCcBcc] = React.useState(false);
  const [showMoreOptions, setShowMoreOptions] = React.useState(false);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const { register, handleSubmit, reset, setValue } = useForm<FormData>({
    defaultValues: {
      priority: "normal"
    }
  });
  const router = useRouter();

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
      formData.append("subject", data.subject);
      if (fromDisplay) formData.append("fromDisplay", fromDisplay);
      
      if (tab === "HTML") {
        formData.append("html", data.body);
      } else {
        formData.append("text", data.body);
      }

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
        html: tab === "HTML",
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
        html: tab === "HTML",
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

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">Compose Email</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col shadow-sm">
        
        {/* From Field (Muted) */}
        <div className="flex items-center px-4 py-3 border-b border-border-soft bg-surface-warm/30">
          <span className="text-muted text-sm w-20 font-medium">From</span>
          <span className="flex-1 text-sm text-fg-2">{fromDisplay || "Not configured (Using SMTP Username)"}</span>
        </div>

        {/* To Field with Cc/Bcc Toggle */}
        <div className="flex items-center px-4 py-2.5 border-b border-border-soft group focus-within:bg-surface-warm/10 transition-colors">
          <span className="text-muted text-sm w-20 font-medium">To</span>
          <input 
            type="email" 
            placeholder="recipient@example.com"
            className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-muted/50 py-1 disabled:opacity-50" 
            required 
            disabled={sendMutation.isPending}
            {...register("to")} 
          />
          {!showCcBcc && (
            <button 
              type="button" 
              onClick={() => setShowCcBcc(true)}
              className="text-xs font-semibold text-muted hover:text-fg uppercase tracking-wider px-2 py-1 transition-colors"
            >
              Cc Bcc
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
              className="text-xs font-semibold text-muted hover:text-fg px-2 py-1 transition-colors ml-2"
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
          </>
        )}

        {/* Format Toggle & Body Area */}
        <div className="flex flex-col flex-1">
          <div className="flex px-4 py-2 bg-surface-warm/30 border-b border-border-soft gap-4 text-[11px] font-semibold uppercase">
            <span 
              onClick={() => !sendMutation.isPending && setTab("HTML")}
              className={`cursor-pointer transition-colors ${tab === "HTML" ? "text-accent" : "text-muted hover:text-fg"}`}
            >
              HTML
            </span>
            <span 
              onClick={() => !sendMutation.isPending && setTab("Plain Text")}
              className={`cursor-pointer transition-colors ${tab === "Plain Text" ? "text-accent" : "text-muted hover:text-fg"}`}
            >
              Plain Text
            </span>
          </div>
          
          <div className="p-4 flex-1">
            <textarea 
              placeholder={tab === "HTML" ? "<p>Write your message here...</p>" : "Write your message here..."}
              required 
              disabled={sendMutation.isPending}
              className="w-full min-h-[300px] bg-transparent outline-none resize-y text-sm font-mono text-fg placeholder:text-muted/50 disabled:opacity-50"
              {...register("body")}
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
            <Button type="button" variant="secondary" size="sm" disabled={sendMutation.isPending}>
              <Paperclip className="h-4 w-4 mr-2" />
              Add Attachments
            </Button>
          </div>
          <Button type="submit" disabled={sendMutation.isPending}>
            {sendMutation.isPending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </form>
    </div>
  );
}
