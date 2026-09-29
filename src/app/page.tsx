"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Key, Upload, X, Sun, Moon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { decryptWithPin } from "@/lib/client-crypto";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected, setConnected, setIdentity, importTemplates, importContacts, importHistory } = useAppStore();

  const { register, handleSubmit, control, setValue, getValues } = useForm({
    defaultValues: {
      host: "smtp.gmail.com",
      port: "587",
      encryption: "STARTTLS",
      username: "",
      password: "",
      fromName: "",
      fromEmail: "",
    }
  });

  const [mounted, setMounted] = React.useState(false);
  const [tokenModal, setTokenModal] = React.useState<{ isOpen: boolean; token: string; pin: string; loading: boolean }>({ isOpen: false, token: '', pin: '', loading: false });

  const portValue = useWatch({ control, name: "port" });
  const encryptionValue = useWatch({ control, name: "encryption" });

  React.useEffect(() => {
    if (portValue === "465" && encryptionValue !== "TLS") {
      setValue("encryption", "TLS");
    } else if (portValue === "587" && encryptionValue !== "STARTTLS") {
      setValue("encryption", "STARTTLS");
    }
  }, [portValue, setValue, encryptionValue]);

  React.useEffect(() => {
    setMounted(true);
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  const connectMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/smtp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to connect');
      return json;
    },
    onSuccess: (_, variables) => {
      if (variables.fromName || variables.fromEmail) {
        setIdentity(variables.fromName || "", variables.fromEmail || "");
      }
      toast.success("SMTP connection verified and secured.");
      setConnected(true);
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const onSubmit = (data: any) => {
    connectMutation.mutate(data);
  };

  const handleOpenImport = () => {
    setTokenModal({ isOpen: true, token: '', pin: '', loading: false });
  };

  const handleProcessImport = async () => {
    if (!tokenModal.token || !tokenModal.pin) {
      toast.error("Please enter both the token and the PIN.");
      return;
    }
    setTokenModal(prev => ({ ...prev, loading: true }));
    try {
      const data = await decryptWithPin(tokenModal.token, tokenModal.pin);
      
      // Handle App Data if present
      if (data._appData) {
        if (data._appData.templates) importTemplates(data._appData.templates);
        if (data._appData.contacts) importContacts(data._appData.contacts);
        if (data._appData.emails) importHistory(data._appData.emails);
        delete data._appData; // Remove before setting form values
      }

      Object.entries(data).forEach(([key, value]) => {
        setValue(key as any, value);
      });
      toast.success("Settings and data imported successfully!");
      setTokenModal({ isOpen: false, token: '', pin: '', loading: false });
    } catch (err: any) {
      toast.error("Invalid token or incorrect PIN.");
      setTokenModal(prev => ({ ...prev, loading: false }));
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(tokenModal.token);
    toast.success("Token copied to clipboard!");
  };

  if (!mounted || isConnected) return null;

  const isPending = connectMutation.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <Card className="w-full max-w-md relative overflow-hidden">
        
        {/* TOKEN MODAL OVERLAY */}
        {tokenModal.isOpen && (
          <div className="absolute inset-0 bg-surface/95 backdrop-blur-sm z-50 flex flex-col p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-accent" />
                Import Settings
              </h3>
              <button onClick={() => setTokenModal(prev => ({ ...prev, isOpen: false }))} className="text-muted hover:text-fg"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto">
              <p className="text-sm text-muted">
                Paste your secure token and enter the PIN.
              </p>
              
              <div className="space-y-2">
                <Label>Secure Token</Label>
                <textarea 
                  placeholder="smtpanel://..." 
                  className="flex min-h-[120px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent font-mono text-xs break-all"
                  value={tokenModal.token}
                  onChange={(e) => setTokenModal(prev => ({ ...prev, token: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Encryption PIN</Label>
                <Input 
                  type="password" 
                  placeholder="e.g. 12345" 
                  value={tokenModal.pin}
                  onChange={(e) => setTokenModal(prev => ({ ...prev, pin: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border-soft flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setTokenModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
              <Button className="flex-1" onClick={handleProcessImport} disabled={tokenModal.loading}>
                {tokenModal.loading ? "Decrypting..." : "Import"}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center text-center px-6 pt-8 pb-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 border border-accent/20">
            <Mail className="h-7 w-7 text-accent" />
          </div>
          <CardTitle className="text-2xl mb-2">SMTP Connect</CardTitle>
          <p className="text-muted text-sm max-w-sm mx-auto">
            Connect your SMTP server and manage email sending from a simple, secure dashboard.
          </p>
        </div>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">SMTP Host</Label>
                <Input id="host" placeholder="smtp.example.com" required disabled={isPending} {...register("host")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input id="port" type="number" placeholder="587" required disabled={isPending} {...register("port")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="encryption">Encryption</Label>
              <select
                id="encryption"
                disabled={isPending}
                className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                {...register("encryption")}
              >
                <option value="STARTTLS">STARTTLS</option>
                <option value="TLS">TLS/SSL</option>
                <option value="None">None</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="user@example.com" required disabled={isPending} {...register("username")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••••••" required disabled={isPending} {...register("password")} />
            </div>

            <div className="border-t border-border-soft pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input id="fromName" placeholder="My Company" disabled={isPending} {...register("fromName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input id="fromEmail" type="email" placeholder="user@example.com" disabled={isPending} {...register("fromEmail")} />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Testing Connection..." : "Test Connection & Connect"}
            </Button>

            <div className="flex flex-wrap gap-2 justify-center items-center mt-2">
              <button 
                type="button" 
                onClick={handleOpenImport}
                className="flex items-center gap-1.5 px-3 h-7 rounded-md border border-border bg-transparent hover:bg-surface-warm text-xs font-medium text-muted hover:text-fg transition-colors"
              >
                <Upload className="h-3.5 w-3.5" /> Import Settings
              </button>
              
              <ThemeToggle />

              <a 
                href="https://github.com/afrizalyogi/smtpanel"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-7 w-7 rounded-md border border-border bg-transparent hover:bg-surface-warm text-muted hover:text-fg transition-colors"
                title="View Source on GitHub"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 9 18.13V22"></path></svg>
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <footer className="absolute bottom-6 left-0 w-full text-center px-4">
        <p className="text-xs text-muted/60 max-w-lg mx-auto leading-relaxed">
          <strong>SMTPanel</strong> is an open-source, stateless SMTP web client. Connect to any SMTP server securely without a database. Privacy-first, lightweight, and perfect for self-hosting on serverless edges or low-memory VPS.
        </p>
      </footer>
    </div>
  );
}
