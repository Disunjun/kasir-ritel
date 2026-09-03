import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const minimumStockData = [
  { product: "Coca-Cola Original 390ml", warehouse: "Gudang Utama (Pusat)", currentQty: 9, minQty: 20, gap: 11, status: "Menipis" },
  { product: "Energen Sereal Cokelat 5x30g", warehouse: "Toko Lantai 1", currentQty: 0, minQty: 10, gap: 10, status: "Habis" },
  { product: "Kopi Susu Bubuk 200g", warehouse: "Gudang Cabang Surabaya", currentQty: 18, minQty: 15, gap: 3, status: "Waspada" },
];

export default function MinimumStockPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Inventori</p>
          <h1 className="text-2xl font-bold tracking-tight">Stok Minimum</h1>
        </div>
        <Button>Atur Min Stok</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Produk Menipis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-sm text-slate-500">Barang di bawah minimum</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Produk Habis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-sm text-slate-500">Belum ada stok</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Reorder Suggestion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-sm text-slate-500">Item perlu restock</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Threshold Stok</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Cari produk..." className="w-56" />
            <Button variant="secondary">Reset</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead>Qty Saat Ini</TableHead>
                <TableHead>Min Stok</TableHead>
                <TableHead>Selisih</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {minimumStockData.map((item) => (
                <TableRow key={`${item.product}-${item.warehouse}`}>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell>{item.warehouse}</TableCell>
                  <TableCell>{item.currentQty}</TableCell>
                  <TableCell>{item.minQty}</TableCell>
                  <TableCell>{item.gap}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "Habis"
                          ? "destructive"
                          : item.status === "Menipis"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">Pesan</Button>
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
