import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const categories = [
  { name: "FMCG", itemCount: 42, status: "Aktif" },
  { name: "Makanan Ringan", itemCount: 28, status: "Aktif" },
  { name: "Minuman", itemCount: 19, status: "Aktif" },
  { name: "Sembako", itemCount: 15, status: "Pending" },
  { name: "Produk Susu & Bayi", itemCount: 11, status: "Aktif" },
];

export default function KategoriPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Master Data</p>
          <h1 className="text-2xl font-bold tracking-tight">Kategori</h1>
        </div>
        <Button>Tambah Kategori</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Daftar Kategori</CardTitle>
          <Input placeholder="Cari kategori..." className="w-64" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kategori</TableHead>
                <TableHead>Jumlah Produk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.name}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.itemCount}</TableCell>
                  <TableCell>
                    <Badge variant={category.status === "Aktif" ? "default" : "secondary"}>
                      {category.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="destructive" size="sm">Hapus</Button>
                    </div>
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
