"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Code, Key, Upload, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { encryptWithPin, decryptWithPin } from "@/lib/client-crypto";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected, setConnected, setIdentity } = useAppStore();

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
  const [tokenModal, setTokenModal] = React.useState<{ isOpen: boolean; mode: 'import' | 'export'; token: string; pin: string; loading: boolean }>({ isOpen: false, mode: 'import', token: '', pin: '', loading: false });

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

  const handleOpenExport = async () => {
    setTokenModal({ isOpen: true, mode: 'export', token: '', pin: '', loading: false });
  };

  const handleGenerateExport = async () => {
    if (!tokenModal.pin) {
      toast.error("Please enter a PIN to secure the token.");
      return;
    }
    setTokenModal(prev => ({ ...prev, loading: true }));
    try {
      const data = getValues();
      const token = await encryptWithPin(data, tokenModal.pin);
      setTokenModal(prev => ({ ...prev, token, loading: false }));
      toast.success("Secure token generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate token.");
      setTokenModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleOpenImport = () => {
    setTokenModal({ isOpen: true, mode: 'import', token: '', pin: '', loading: false });
  };

  const handleProcessImport = async () => {
    if (!tokenModal.token || !tokenModal.pin) {
      toast.error("Please enter both the token and the PIN.");
      return;
    }
    setTokenModal(prev => ({ ...prev, loading: true }));
    try {
      const data = await decryptWithPin(tokenModal.token, tokenModal.pin);
      Object.entries(data).forEach(([key, value]) => {
        setValue(key as any, value);
      });
      toast.success("Settings imported successfully!");
      setTokenModal({ isOpen: false, mode: 'import', token: '', pin: '', loading: false });
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
      <a 
        href="https://github.com/afrizalyogi/smtpanel" 
        target="_blank" 
        rel="noopener noreferrer"
        className="absolute top-6 right-6 text-muted hover:text-fg transition-colors flex items-center gap-2 text-sm font-medium bg-surface-warm px-3 py-2 rounded-md border border-border-soft"
      >
        <Code className="h-5 w-5" />
        <span className="hidden sm:inline">View Source</span>
      </a>

      <Card className="w-full max-w-md relative overflow-hidden">
        
        {/* TOKEN MODAL OVERLAY */}
        {tokenModal.isOpen && (
          <div className="absolute inset-0 bg-surface/95 backdrop-blur-sm z-50 flex flex-col p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Key className="h-5 w-5 text-accent" />
                {tokenModal.mode === 'import' ? 'Import Settings' : 'Export Settings'}
              </h3>
              <button onClick={() => setTokenModal(prev => ({ ...prev, isOpen: false }))} className="text-muted hover:text-fg"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto">
              <p className="text-sm text-muted">
                {tokenModal.mode === 'import' 
                  ? "Paste your secure token and enter the PIN used to encrypt it." 
                  : "Enter a PIN to encrypt your current form data. You'll need this PIN to import it elsewhere."}
              </p>
              
              {tokenModal.mode === 'import' && (
                <div className="space-y-2">
                  <Label>Secure Token</Label>
                  <textarea 
                    placeholder="smtpanel://..." 
                    className="flex min-h-[80px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    value={tokenModal.token}
                    onChange={(e) => setTokenModal(prev => ({ ...prev, token: e.target.value }))}
                  />
                </div>
              )}
              
              {tokenModal.mode === 'export' && tokenModal.token && (
                <div className="space-y-2">
                  <Label>Your Encrypted Token</Label>
                  <div className="relative">
                    <textarea 
                      readOnly
                      className="flex min-h-[100px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm font-mono text-xs pr-10"
                      value={tokenModal.token}
                    />
                    <button onClick={copyToken} className="absolute right-2 top-2 p-1.5 bg-surface-warm rounded-md text-muted hover:text-fg border border-border-soft">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {!(tokenModal.mode === 'export' && tokenModal.token) && (
                <div className="space-y-2">
                  <Label>Encryption PIN</Label>
                  <Input 
                    type="password" 
                    placeholder="e.g. 12345" 
                    value={tokenModal.pin}
                    onChange={(e) => setTokenModal(prev => ({ ...prev, pin: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border-soft flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setTokenModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
              {tokenModal.mode === 'import' ? (
                <Button className="flex-1" onClick={handleProcessImport} disabled={tokenModal.loading}>
                  {tokenModal.loading ? "Decrypting..." : "Import"}
                </Button>
              ) : !tokenModal.token ? (
                <Button className="flex-1" onClick={handleGenerateExport} disabled={tokenModal.loading}>
                  {tokenModal.loading ? "Encrypting..." : "Generate Token"}
                </Button>
              ) : (
                <Button className="flex-1" onClick={copyToken}>Copy Token</Button>
              )}
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
            <div className="grid grid-cols-2 gap-4">
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

            <div className="border-t border-border-soft my-6 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

            <div className="flex gap-2 justify-center mt-2">
              <button 
                type="button" 
                onClick={handleOpenImport}
                className="text-xs text-muted hover:text-fg font-medium transition-colors flex items-center gap-1 px-2 py-1"
              >
                <Upload className="h-3 w-3" /> Import Settings
              </button>
              <span className="text-muted/30">|</span>
              <button 
                type="button" 
                onClick={handleOpenExport}
                className="text-xs text-muted hover:text-fg font-medium transition-colors flex items-center gap-1 px-2 py-1"
              >
                <Key className="h-3 w-3" /> Export Settings
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
