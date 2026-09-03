import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const warehouses = [
  { code: "GUD-1", name: "Gudang Utama (Pusat)", address: "Jl. Merdeka No. 12, Bandung", status: "Aktif" },
  { code: "GUD-2", name: "Toko Lantai 1", address: "Jl. Sudirman No. 5, Bandung", status: "Aktif" },
  { code: "GUD-3", name: "Gudang Cabang Surabaya", address: "Jl. Kertajaya No. 88, Surabaya", status: "Aktif" },
];

export default function GudangPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Master Data</p>
          <h1 className="text-2xl font-bold tracking-tight">Gudang</h1>
        </div>
        <Button>Tambah Gudang</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Daftar Gudang</CardTitle>
          <Input placeholder="Cari gudang..." className="w-64" />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Gudang</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((warehouse) => (
                <TableRow key={warehouse.code}>
                  <TableCell className="font-medium">{warehouse.code}</TableCell>
                  <TableCell>{warehouse.name}</TableCell>
                  <TableCell>{warehouse.address}</TableCell>
                  <TableCell>
                    <Badge variant="default">{warehouse.status}</Badge>
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
