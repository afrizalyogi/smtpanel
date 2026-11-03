"use client";

import * as React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmailTable } from "@/components/EmailTable";
import { ImportExportButtons } from "@/components/ImportExportButtons";
import { useAppStore, type EmailRecord } from "@/store";
import { downloadJson, importJsonArray } from "@/lib/utils";
import { Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function SentPage() {
  const { emails, importHistory } = useAppStore();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");

  const filteredEmails = emails.filter((e) => {
    const matchSearch = e.to.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    if (emails.length === 0) {
      toast.error("No history to export.");
      return;
    }
    downloadJson(emails, "smtpanel_history.json");
    toast.success("History exported successfully.");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) =>
    importJsonArray(event, "history", (items) => {
      importHistory(items as EmailRecord[]);
      toast.success(`Imported ${items.length} history records.`);
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Sent History</h1>
        <ImportExportButtons onImport={handleImport} onExport={handleExport} />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-4 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
            <Input 
              placeholder="Search recipient or subject..." 
              className="!pl-9 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-[150px]">
            <select
              className="appearance-none flex h-9 w-full rounded-md border border-border bg-transparent pl-3 pr-8 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Sent">Sent</option>
              <option value="Failed">Failed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <EmailTable emails={filteredEmails} empty="No emails found." />
        </CardContent>
      </Card>
    </div>
  );
}
