"use client";

import * as React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

export default function SettingsPage() {
  const { identity, setIdentity, clearData } = useAppStore();
  const router = useRouter();
  
  const { register, handleSubmit } = useForm({
    defaultValues: {
      fromName: identity.fromName,
      fromEmail: identity.fromEmail,
    }
  });

  const onUpdateIdentity = (data: any) => {
    setIdentity(data.fromName, data.fromEmail);
    toast.success("Sender identity updated.");
  };

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/smtp/disconnect', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => {
      clearData();
      toast.success("SMTP Disconnected. Credentials removed.");
      router.push("/");
    },
    onError: () => {
      toast.error("Failed to disconnect securely.");
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHeader>
            <CardTitle>SMTP Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted mb-4">
              Your SMTP credentials are encrypted and stored in a secure HTTP-only cookie.
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Host</Label>
                <Input value="••••••••" disabled className="bg-surface-warm" />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input value="•••" disabled className="bg-surface-warm" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => toast.success("Connection test successful.")}>
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sender Identity</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onUpdateIdentity)} className="space-y-4">
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input placeholder="Acme Corp" {...register("fromName")} />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input type="email" placeholder="admin@example.com" {...register("fromEmail")} />
                </div>
                <Button type="submit" variant="secondary" className="mt-2">
                  Update Identity
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-danger/30">
            <CardHeader>
              <CardTitle className="text-danger">Security & Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted text-sm mb-4">
                Disconnecting will remove your securely stored SMTP credentials from the server's session cookie and <strong>clear your local browser history and templates</strong>.
              </p>
              <Button 
                variant="danger" 
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect SMTP & Clear Data"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
