"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Package,
  Tags,
  Warehouse,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  AlertTriangle,
  ClipboardCheck,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions/auth";

const menuItems = [
  { group: "Utama", items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  { group: "Kasir", items: [{ name: "Transaksi", href: "/kasir/transaksi", icon: ShoppingCart }, { name: "Riwayat", href: "/kasir/riwayat", icon: History }] },
  { group: "Inventori", items: [{ name: "Produk", href: "/admin/master/produk", icon: Package }, { name: "Kategori", href: "/admin/master/kategori", icon: Tags }, { name: "Gudang", href: "/admin/master/gudang", icon: Warehouse }, { name: "Stok Masuk", href: "/admin/inventori/stok-masuk", icon: ArrowDownLeft }, { name: "Stok Keluar", href: "/admin/inventori/stok-keluar", icon: ArrowUpRight }, { name: "Transfer Stok", href: "/admin/inventori/transfer", icon: ArrowLeftRight }, { name: "Stok Minimum", href: "/admin/inventori/stok-minimum", icon: AlertTriangle }, { name: "Stock Opname", href: "/admin/inventori/opname", icon: ClipboardCheck }] },
  { group: "Manajemen", items: [{ name: "Kelola Kasir", href: "/admin/kasir", icon: Users }, { name: "Laporan", href: "/admin/laporan/harian", icon: BarChart3 }, { name: "Pengaturan", href: "/settings", icon: Settings }] },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white transition-transform">
      <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
        <div className="mb-10 flex items-center px-2">
          <span className="text-2xl font-extrabold text-primary">KasirRitel</span>
        </div>

        <nav className="space-y-6">
          {menuItems.map((group) => (
            <div key={group.group}>
              <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {group.group}
              </h2>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-lg px-2 py-2 text-sm font-medium transition-all hover:bg-secondary hover:text-primary",
                        isActive ? "bg-secondary text-primary" : "text-slate-700",
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t pt-4">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center rounded-lg px-2 py-2 text-sm font-medium text-destructive transition-all hover:bg-red-50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Keluar
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
