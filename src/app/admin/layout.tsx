import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Logo from "@/components/layout/Logo";
import { LayoutDashboard, Users, Building2, Briefcase, LogOut } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/empresas", label: "Empresas", icon: Building2 },
  { href: "/admin/vagas", label: "Vagas", icon: Briefcase },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/painel");

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-56 bg-foreground text-background flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-background/10">
          <div>
            <Logo size="sm" variant="white" />
            <p className="text-xs text-background/50 mt-1 truncate">{session.user.email}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-background/70 hover:text-background hover:bg-background/10 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-background/10">
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-background/60 hover:text-background hover:bg-background/10"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
