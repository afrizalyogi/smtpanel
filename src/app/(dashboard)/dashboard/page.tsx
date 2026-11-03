"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import Link from "next/link";
import { EmailTable } from "@/components/EmailTable";

export default function DashboardPage() {
  const { stats, emails } = useAppStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Overview</h1>
          <p className="text-muted">SMTP connection and sending statistics.</p>
        </div>
        <Link href="/send" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Send Email</Button>
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-soft">
          <div className="p-6">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted mt-1">Total Emails Sent</div>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-success">{stats.success}</div>
            <div className="text-sm text-muted mt-1">Successful</div>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-danger">{stats.failed}</div>
            <div className="text-sm text-muted mt-1">Failed</div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <Link href="/sent" className="text-sm font-medium text-muted hover:text-fg transition-colors">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <EmailTable emails={emails.slice(0, 3)} empty="No recent activity." />
        </CardContent>
      </Card>
    </div>
  );
}
