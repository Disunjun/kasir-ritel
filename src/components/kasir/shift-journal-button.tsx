"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";

export function ShiftJournalButton() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("cashier_shift_logs")
        .select("action, amount, shifts(opened_at)")
        .order("id", { ascending: false })
        .limit(20);
      if (data) setLogs(data);
    };
    void load();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost">Jurnal Shift</Button>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Jurnal Shift</DialogTitle></DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log, i) => (
              <TableRow key={i}>
                <TableCell>{log.shifts?.opened_at ? new Date(log.shifts.opened_at).toLocaleString() : "-"}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell className="text-right">{Number(log.amount ?? 0).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!logs.length && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-slate-500 py-6">Belum ada jurnal shift.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
