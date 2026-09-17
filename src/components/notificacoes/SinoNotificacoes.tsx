import Link from "next/link";
import { Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { contarNaoLidas } from "@/lib/notificacoes";

/** Sino do Navbar com contador de não lidas. Server component: zero JS extra. */
export default async function SinoNotificacoes() {
  const session = await auth();
  if (!session?.user) return null;

  const naoLidas = await contarNaoLidas(session.user.id).catch(() => 0);

  return (
    <Link
      href="/notificacoes"
      aria-label={naoLidas ? `${naoLidas} notificações não lidas` : "Notificações"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
    >
      <Bell className="h-5 w-5 text-foreground/80" />
      {naoLidas > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2DB87A] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
          {naoLidas > 99 ? "99+" : naoLidas}
        </span>
      )}
    </Link>
  );
}
