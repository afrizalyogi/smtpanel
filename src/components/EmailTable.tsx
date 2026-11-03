"use client";

import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EmailRecord } from "@/store";

export function EmailTable({ emails, empty }: { emails: EmailRecord[]; empty: string }) {
  const router = useRouter();
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="whitespace-nowrap">Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.length > 0 ? (
            emails.map((email) => (
              <TableRow key={email.id}>
                <TableCell className="font-mono">{email.to}</TableCell>
                <TableCell>{email.subject}</TableCell>
                <TableCell>
                  <Badge variant={email.status === "Sent" ? "success" : "danger"}>{email.status}</Badge>
                </TableCell>
                <TableCell className="text-muted whitespace-nowrap">{email.date}</TableCell>
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
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
