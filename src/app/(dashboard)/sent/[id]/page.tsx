"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/store";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { emails, identity, addEmail } = useAppStore();
  
  const emailId = params.id as string;
  const email = emails.find((e) => e.id === emailId);

  const fromDisplay = identity.fromName && identity.fromEmail 
    ? `${identity.fromName} <${identity.fromEmail}>`
    : identity.fromEmail || "";

  const resendMutation = useMutation({
    mutationFn: async () => {
      if (!email) throw new Error("Email not found");
      
      const formData = new FormData();
      formData.append("to", email.to);
      formData.append("subject", email.subject);
      if (fromDisplay) formData.append("fromDisplay", fromDisplay);
      
      if (email.html) {
        formData.append("html", email.body || "");
      } else {
        formData.append("text", email.body || "");
      }

      const res = await fetch('/api/emails/send', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to resend email');
      return { msgId: json.messageId || '<unknown>' };
    },
    onSuccess: ({ msgId }) => {
      if (!email) return;
      addEmail({
        id: 'msg_' + Date.now(),
        to: email.to,
        subject: email.subject,
        status: 'Sent',
        date: new Date().toLocaleString(),
        msgId,
        body: email.body,
        html: email.html,
      });
      toast.success("Email resent successfully.");
      router.push("/sent");
    },
    onError: (error: Error) => {
      if (!email) return;
      addEmail({
        id: 'msg_' + Date.now(),
        to: email.to,
        subject: email.subject,
        status: 'Failed',
        date: new Date().toLocaleString(),
        msgId: '-',
        body: email.body,
        html: email.html,
      });
      toast.error(error.message);
    }
  });

  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted">Email not found.</p>
        <Button variant="secondary" onClick={() => router.push("/sent")}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="icon" onClick={() => router.push("/sent")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight m-0">Email Details</h1>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between border-b border-border-soft pb-4">
          <Badge variant={email.status === "Sent" ? "success" : "danger"}>
            {email.status}
          </Badge>
          <Button 
            variant="secondary" 
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
          >
            {resendMutation.isPending ? "Resending..." : "Resend"}
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2 mb-6 text-sm">
            <div className="font-medium text-muted">From</div>
            <div className="font-mono">{fromDisplay || "Not configured"}</div>
            
            <div className="font-medium text-muted">To</div>
            <div className="font-mono">{email.to}</div>
            
            <div className="font-medium text-muted">Subject</div>
            <div className="font-medium">{email.subject}</div>
            
            <div className="font-medium text-muted">Sent at</div>
            <div className="text-muted">{email.date}</div>
            
            <div className="font-medium text-muted">Message ID</div>
            <div className="font-mono text-muted">{email.msgId}</div>
          </div>
          
          <hr className="border-border-soft my-6" />
          
          <div className="bg-surface-warm p-4 rounded-md font-mono text-sm whitespace-pre-wrap">
            {email.body || <span className="italic text-muted">Empty message body</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
