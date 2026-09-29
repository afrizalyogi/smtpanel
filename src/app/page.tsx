"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected, setConnected, setIdentity } = useAppStore();

  const { register, handleSubmit, control, setValue } = useForm({
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

  if (!mounted || isConnected) return null; // prevent flicker and hydration mismatch

  const isPending = connectMutation.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Mail className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl">SMTP Connect</CardTitle>
          <p className="text-muted text-sm mt-2">
            Connect your SMTP server and manage email sending from a simple, secure dashboard.
          </p>
        </CardHeader>
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
                className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:text-sm disabled:cursor-not-allowed disabled:opacity-50"
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
