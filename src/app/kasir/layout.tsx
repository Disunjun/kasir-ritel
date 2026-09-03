import Link from "next/link";
import { RoleGuard } from "@/components/auth/role-guard";

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard requiredRole="KASIR">
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              KasirRitel
            </Link>
            <span className="text-sm font-medium text-slate-600">
              Kasir: Rizky Ananda
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Shift: Aktif sejak 08:00
            </span>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:scale-[0.98]">
              Tutup Kas
            </button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </RoleGuard>
  );
}
