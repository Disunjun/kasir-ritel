import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const stockOutData = [
  { ref: "SK-2025-011", product: "Kopi Susu Bubuk 200g", warehouse: "Toko Lantai 1", qty: 35, date: "2025-09-01", status: "Selesai" },
  { ref: "SK-2025-012", product: "Es Krim Cokelat 500ml", warehouse: "Gudang Utama (Pusat)", qty: 18, date: "2025-09-02", status: "Diproses" },
  { ref: "SK-2025-013", product: "Sampo Antiketombe 180ml", warehouse: "Gudang Cabang Bandung", qty: 22, date: "2025-09-04", status: "Selesai" },
];

export default function StockOutPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Inventori</p>
          <h1 className="text-2xl font-bold tracking-tight">Stok Keluar</h1>
        </div>
        <Button>Catat Pengeluaran</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Total Barang Keluar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.460</div>
            <p className="text-sm text-slate-500">Unit bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Nilai Keluar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Rp 17.4M</div>
            <p className="text-sm text-slate-500">Penjualan & distribusi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Permintaan Tertunda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4</div>
            <p className="text-sm text-slate-500">Perlu review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Daftar Stok Keluar</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Cari produk..." className="w-56" />
            <Button variant="secondary">Reset</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referensi</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockOutData.map((item) => (
                <TableRow key={item.ref}>
                  <TableCell className="font-medium">{item.ref}</TableCell>
                  <TableCell>{item.product}</TableCell>
                  <TableCell>{item.warehouse}</TableCell>
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
