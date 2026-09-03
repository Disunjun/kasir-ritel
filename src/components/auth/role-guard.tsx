import { redirect } from "next/navigation";
import { getCurrentUserRole, type UserRole } from "@/lib/auth-session";

export async function RoleGuard({
  requiredRole,
  children,
}: {
  requiredRole: UserRole;
  children: React.ReactNode;
}) {
  const currentRole = await getCurrentUserRole();

  if (!currentRole) {
    redirect("/login");
  }

  if (currentRole !== requiredRole) {
    redirect(currentRole === "ADMIN" ? "/dashboard" : "/kasir/transaksi");
  }

  return <>{children}</>;
}
