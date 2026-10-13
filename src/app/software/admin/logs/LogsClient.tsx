"use client";

import { useState } from "react";
import { Button } from "@/software-components/ui/button";
import { Input } from "@/software-components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/software-components/ui/table";
import { Badge } from "@/software-components/ui/badge";
import { Download, Terminal } from "lucide-react";
import type { SystemLog } from "@prisma/client";

type LogWithAdmin = SystemLog & { adminUsername?: string | null };

export default function LogsClient({ initialLogs }: { initialLogs: LogWithAdmin[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = initialLogs.filter((log) =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
        <Input
          placeholder="بحث في السجلات..."
          className="w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={() => (window.location.href = "/api/logs/export")}>
          <Download className="w-4 h-4" />
          تصدير السجلات (CSV)
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">العملية</TableHead>
              <TableHead className="text-right">التفاصيل</TableHead>
              <TableHead className="text-right">المشرف</TableHead>
              <TableHead className="text-right">التاريخ والوقت</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-muted-foreground" />
                    <span>{log.action}</span>
                    {log.level === "error" && <Badge variant="destructive" className="text-[10px]">خطأ</Badge>}
                    {log.level === "warn" && <Badge variant="secondary" className="text-[10px]">تنبيه</Badge>}
                  </div>
                </TableCell>
                <TableCell>{log.message}</TableCell>
                <TableCell className="text-muted-foreground">
                  {log.adminUsername ? (
                    <Badge variant="outline">{log.adminUsername}</Badge>
                  ) : log.adminId ? (
                    <Badge variant="outline">{log.adminId.substring(0, 8)}...</Badge>
                  ) : (
                    "النظام"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm" dir="ltr">
                  {new Date(log.createdAt).toLocaleString("ar-EG")}
                </TableCell>
              </TableRow>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  لا توجد سجلات تطابق بحثك.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
