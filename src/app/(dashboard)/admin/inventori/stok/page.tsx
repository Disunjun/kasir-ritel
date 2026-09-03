import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const stockData = [
  { product: "Indomie Goreng Ayam Spesial 85g", warehouse: "Gudang Utama (Pusat)", qty: 48, minStock: 20, status: "Aman" },
  { product: "Coca-Cola Original 390ml", warehouse: "Gudang Utama (Pusat)", qty: 9, minStock: 20, status: "Menipis" },
  { product: "Energen Sereal Cokelat 5x30g", warehouse: "Toko Lantai 1", qty: 0, minStock: 10, status: "Habis" },
  { product: "Kopi Susu Bubuk 200g", warehouse: "Gudang Cabang Surabaya", qty: 18, minStock: 15, status: "Aman" },
];

export default function StockPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Inventori</p>
          <h1 className="text-2xl font-bold tracking-tight">Stok</h1>
        </div>
        <Button>Update Manual</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Persediaan Stok</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Filter gudang..." className="w-52" />
            <Button variant="secondary">Reset</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead>Qty System</TableHead>
                <TableHead>Min Stok</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockData.map((item) => (
                <TableRow key={`${item.product}-${item.warehouse}`}>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell>{item.warehouse}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.minStock}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === "Aman" ? "default" : item.status === "Menipis" ? "secondary" : "destructive"
                      }
                    >
                      {item.status}
                    </Badge>
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
