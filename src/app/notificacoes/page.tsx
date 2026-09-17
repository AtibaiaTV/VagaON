import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, ClipboardList, Flame, MessageCircle, Settings2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import AtivarPush from "@/components/notificacoes/AtivarPush";
import MarcarLidas from "@/components/notificacoes/MarcarLidas";
import Notificacao from "@/models/Notificacao";

export const dynamic = "force-dynamic";

export const metadata = { title: "Notificações — VagaON" };

const ICONE: Record<string, React.ReactNode> = {
  match: <Flame className="h-4 w-4" />,
  mensagem: <MessageCircle className="h-4 w-4" />,
  candidatura: <ClipboardList className="h-4 w-4" />,
  sistema: <Bell className="h-4 w-4" />,
};

function tempoRelativo(d: Date) {
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const dias = Math.floor(h / 24);
  return dias === 1 ? "ontem" : `${dias} dias`;
}

export default async function NotificacoesPage() {
  const session = await auth();
  if (!session) redirect("/entrar");

  await connectDB();
  const itens = await Notificacao.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(50).lean();
  const haNaoLidas = itens.some((n) => !n.lidaEm);
  const corHero = session.user.role === "empresa" ? "#143f28" : "#1a5c38";

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex flex-col">
      <Navbar />
      <MarcarLidas haNaoLidas={haNaoLidas} />

      <div style={{ backgroundColor: corHero }} className="py-5">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-[#4ade80]" />
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Notificações</h1>
              <p className="text-white/60 text-xs">Match, mensagens e candidaturas</p>
            </div>
          </div>
          <Link href="/perfil">
            <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white gap-1.5">
              <Settings2 className="h-4 w-4" />
              Canais
            </Button>
          </Link>
        </div>
      </div>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 space-y-4">
        <AtivarPush variante="card" />

        {itens.length === 0 ? (
          <div className="text-center py-16 max-w-xs mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg">Nada por aqui ainda</h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              Quando der match, chegar mensagem ou uma candidatura mudar de status, você vê aqui.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {itens.map((n) => {
              const naoLida = !n.lidaEm;
              return (
                <li key={String(n._id)}>
                  <Link
                    href={n.url}
                    className={`flex items-start gap-3 bg-white rounded-2xl border px-4 py-3 hover:border-primary/40 hover:shadow-md transition-all ${
                      naoLida ? "border-primary/40" : "border-border/40"
                    }`}
                  >
                    <span className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${naoLida ? "bg-[#1a5c38] text-[#4ade80]" : "bg-muted text-muted-foreground"}`}>
                      {ICONE[n.categoria] ?? ICONE.sistema}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-sm truncate ${naoLida ? "font-bold" : "font-semibold"}`}>{n.titulo}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{tempoRelativo(new Date(n.createdAt))}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.corpo}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
