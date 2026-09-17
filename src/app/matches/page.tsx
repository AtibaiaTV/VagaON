import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import ListaMatches from "@/components/match/ListaMatches";
import AtivarPush from "@/components/notificacoes/AtivarPush";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Matches — VagaON",
};

export default async function MatchesPage() {
  const session = await auth();
  if (!session) redirect("/entrar");
  const { role } = session.user;
  if (role === "admin") redirect("/painel");

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex flex-col">
      <Navbar />

      <div style={{ backgroundColor: role === "empresa" ? "#143f28" : "#1a5c38" }} className="py-5">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageCircle className="h-6 w-6 text-[#4ade80]" />
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Matches</h1>
              <p className="text-white/60 text-xs">Interesse mútuo confirmado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AtivarPush />
            <Link href="/descobrir">
              <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white gap-1.5">
                <Flame className="h-4 w-4" />
                Descobrir
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5">
        <ListaMatches lado={role} />
      </main>
    </div>
  );
}
