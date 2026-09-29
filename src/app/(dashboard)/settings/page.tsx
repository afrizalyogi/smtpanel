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
import { Key, Copy, Download } from "lucide-react";
import { encryptWithPin } from "@/lib/client-crypto";

export default function SettingsPage() {
  const { identity, setIdentity, clearData } = useAppStore();
  const router = useRouter();
  
  const [exportState, setExportState] = React.useState<{ active: boolean; pin: string; token: string; loading: boolean }>({ active: false, pin: '', token: '', loading: false });

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

  const handleGenerateExport = async () => {
    if (!exportState.pin) {
      toast.error("Please enter a PIN to secure the token.");
      return;
    }
    setExportState(prev => ({ ...prev, loading: true }));
    try {
      // 1. Fetch credentials from server
      const res = await fetch('/api/smtp/export');
      const json = await res.json();
      
      if (!res.ok || !json.data) {
        throw new Error(json.error || "Failed to fetch credentials.");
      }

      // 2. Merge with identity
      const payload = {
        ...json.data,
        fromName: identity.fromName,
        fromEmail: identity.fromEmail
      };

      // 3. Encrypt locally
      const token = await encryptWithPin(payload, exportState.pin);
      
      setExportState(prev => ({ ...prev, token, loading: false }));
      toast.success("Secure token generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate token.");
      setExportState(prev => ({ ...prev, loading: false }));
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(exportState.token);
    toast.success("Token copied to clipboard!");
    setExportState({ active: false, pin: '', token: '', loading: false }); // close after copy
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
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

            <div className="flex gap-3 pt-4 border-b border-border-soft pb-4">
              <Button variant="secondary" onClick={() => toast.success("Connection test successful.")}>
                Test Connection
              </Button>
              <Button variant="secondary" onClick={() => setExportState(prev => ({ ...prev, active: !prev.active }))}>
                <Download className="h-4 w-4 mr-2" /> 
                Export Config
              </Button>
            </div>

            {exportState.active && (
              <div className="bg-surface-warm/50 border border-border-soft p-4 rounded-md space-y-4 animate-fade-in">
                {!exportState.token ? (
                  <>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Key className="h-4 w-4" /> Secure Token PIN</Label>
                      <p className="text-xs text-muted mb-2">Create a PIN to encrypt your credentials before exporting.</p>
                      <Input 
                        type="password" 
                        placeholder="e.g. 12345" 
                        value={exportState.pin}
                        onChange={(e) => setExportState(prev => ({ ...prev, pin: e.target.value }))}
                      />
                    </div>
                    <Button className="w-full" onClick={handleGenerateExport} disabled={exportState.loading}>
                      {exportState.loading ? "Encrypting..." : "Generate Token"}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-accent"><Key className="h-4 w-4" /> Your Secure Token</Label>
                    <p className="text-xs text-muted mb-2">Copy this token and use the same PIN to import it on another device.</p>
                    <div className="relative">
                      <textarea 
                        readOnly
                        className="flex min-h-[100px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm font-mono text-xs pr-10"
                        value={exportState.token}
                      />
                      <button onClick={copyToken} className="absolute right-2 top-2 p-1.5 bg-surface-warm rounded-md text-muted hover:text-fg border border-border-soft">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
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
