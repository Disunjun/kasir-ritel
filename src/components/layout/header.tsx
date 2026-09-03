export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">Admin Toko</p>
          <p className="text-xs text-slate-500">ADMIN</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          A
        </div>
      </div>
    </header>
  );
}
