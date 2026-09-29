"use client";

import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SentPage() {
  const router = useRouter();
  const emails = useAppStore((state) => state.emails);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");

  const filteredEmails = emails.filter((e) => {
    const matchSearch = e.to.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Sent History</h1>

      <Card>
        <CardHeader className="gap-4 md:flex-nowrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
            <Input 
              placeholder="Search recipient or subject..." 
              className="!pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="flex h-9 w-[150px] rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Sent">Sent</option>
            <option value="Failed">Failed</option>
          </select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message ID</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmails.length > 0 ? (
                filteredEmails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="text-muted">{email.date}</TableCell>
                    <TableCell className="font-mono">{email.to}</TableCell>
                    <TableCell>{email.subject}</TableCell>
                    <TableCell>
                      <Badge variant={email.status === "Sent" ? "success" : "danger"}>
                        {email.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-mono text-muted text-xs">{email.msgId}</TableCell>
                    <TableCell>
                      <Button variant="secondary" size="sm" onClick={() => router.push(`/sent/${email.id}`)}>
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted py-8">
                    No emails found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
