import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const transactions = [
  { invoice: "INV-2048", cashier: "Rizky Ananda", time: "09:12", method: "Tunai", total: 468000, status: "Lunas" },
  { invoice: "INV-2049", cashier: "Rizky Ananda", time: "09:28", method: "QRIS", total: 321500, status: "Lunas" },
  { invoice: "INV-2050", cashier: "Rizky Ananda", time: "09:41", method: "Kartu", total: 856000, status: "Proses" },
  { invoice: "INV-2051", cashier: "Rizky Ananda", time: "10:03", method: "Tunai", total: 197500, status: "Lunas" },
];

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function RiwayatPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Kasir</p>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">Hari Ini</Button>
          <Button variant="outline">Minggu Ini</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Transaksi hari ini</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Cari invoice..." className="w-52" />
            <Button variant="secondary">Reset</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Kasir</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.invoice}>
                  <TableCell className="font-medium">{transaction.invoice}</TableCell>
                  <TableCell>{transaction.cashier}</TableCell>
                  <TableCell>{transaction.time}</TableCell>
                  <TableCell>{transaction.method}</TableCell>
                  <TableCell>{currency.format(transaction.total)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.status === "Lunas" ? "default" : "secondary"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
