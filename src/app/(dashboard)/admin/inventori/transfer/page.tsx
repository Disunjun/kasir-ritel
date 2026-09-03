import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const transferData = [
  { ref: "TR-2025-005", product: "Indomie Goreng Ayam Spesial 85g", from: "Gudang Utama (Pusat)", to: "Toko Lantai 1", qty: 50, date: "2025-09-02", status: "Selesai" },
  { ref: "TR-2025-006", product: "Teh Botol Sosro 350ml", from: "Gudang Cabang Surabaya", to: "Gudang Utama (Pusat)", qty: 30, date: "2025-09-03", status: "Diproses" },
  { ref: "TR-2025-007", product: "Mie Sedaap Goreng 85g", from: "Toko Lantai 2", to: "Toko Lantai 1", qty: 25, date: "2025-09-04", status: "Selesai" },
];

export default function TransferPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Inventori</p>
          <h1 className="text-2xl font-bold tracking-tight">Transfer Stok</h1>
        </div>
        <Button>Transfer Baru</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Transfer Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">14</div>
            <p className="text-sm text-slate-500">Dokumen aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Qty Ditransfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.240</div>
            <p className="text-sm text-slate-500">Unit dipindahkan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Transfer Tertunda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
            <p className="text-sm text-slate-500">Belum dikonfirmasi</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Riwayat Transfer Stok</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Cari referensi..." className="w-56" />
            <Button variant="secondary">Reset</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referensi</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Asal</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transferData.map((item) => (
                <TableRow key={item.ref}>
                  <TableCell className="font-medium">{item.ref}</TableCell>
                  <TableCell>{item.product}</TableCell>
                  <TableCell>{item.from}</TableCell>
                  <TableCell>{item.to}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "Selesai" ? "default" : "secondary"}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">Detail</Button>
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
