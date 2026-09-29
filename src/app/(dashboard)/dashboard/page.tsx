"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { stats, emails } = useAppStore();
  const router = useRouter();
  const recentEmails = emails.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Overview</h1>
          <p className="text-muted">SMTP connection and sending statistics.</p>
        </div>
        <Link href="/send">
          <Button>Send Email</Button>
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
          <div className="w-full overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEmails.length > 0 ? (
                recentEmails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="font-mono">{email.to}</TableCell>
                    <TableCell>{email.subject}</TableCell>
                    <TableCell>
                      <Badge variant={email.status === "Sent" ? "success" : "danger"}>
                        {email.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted">{email.date}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/sent/${email.id}`)}>
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted py-8">
                    No recent activity.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
