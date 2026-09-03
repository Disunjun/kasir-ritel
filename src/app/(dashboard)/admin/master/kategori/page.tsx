"use client";

import { useEffect, useMemo, useState } from "react";
import { saveCategory } from "@/actions/master-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient, hasSupabaseConfig } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Category = { id: string; name: string; slug: string; itemCount: number };
const fallback: Category[] = [
  { id: "fallback-1", name: "Makanan", slug: "makanan", itemCount: 1 },
  { id: "fallback-2", name: "Minuman", slug: "minuman", itemCount: 2 },
  { id: "fallback-3", name: "Sembako", slug: "sembako", itemCount: 0 },
];

export default function KategoriPage() {
  const [categories, setCategories] = useState(fallback);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("categories").select("id, name, slug, products(id)");
      if (error || !data) return;
      setCategories(data.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        itemCount: Array.isArray(item.products) ? item.products.length : 0,
      })));
    };
    void load();
  }, []);

  const submit = async () => {
    setSaving(true);
    const result = await saveCategory({ name });
    setNotice(result.error ?? result.success ?? null);
    setSaving(false);
    if (!result.error) { setOpen(false); setName(""); }
  };

  const filtered = useMemo(
    () => categories.filter((category) => category.name.toLowerCase().includes(query.toLowerCase())),
    [categories, query],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-sm font-medium text-primary">Master Data</p><h1 className="text-2xl font-bold tracking-tight">Kategori</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>Tambah Kategori</Button>} />
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Tambah Kategori</DialogTitle><DialogDescription>Buat kategori produk baru.</DialogDescription></DialogHeader>
            <Input placeholder="Nama kategori" value={name} onChange={(event) => setName(event.target.value)} />
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={submit} disabled={saving || !name.trim()}>{saving ? "Menyimpan..." : "Simpan"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {notice && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</div>}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Daftar Kategori</CardTitle>
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kategori..." className="w-64" />
        </CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Nama Kategori</TableHead><TableHead>Jumlah Produk</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map((category) => <TableRow key={category.id}><TableCell className="font-medium">{category.name}</TableCell><TableCell>{category.itemCount}</TableCell><TableCell><Badge variant="default">Aktif</Badge></TableCell><TableCell className="text-right"><Button variant="outline" size="sm">Edit</Button></TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
