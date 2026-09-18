"use client";

import { useEffect, useState } from "react";
import { Crown, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConviteListado, MembroListado } from "@/lib/servicos/equipe";

interface Props {
  empresaId: string;
  /** Chamado depois de remover/cancelar, para o card atualizar a contagem. */
  onMudou?: () => void;
}

/**
 * Equipe de uma empresa vista pelo admin: dono, gerentes e convites
 * pendentes, com remoção. Carrega sob demanda (aberto pelo botão do card).
 */
export default function EquipeAdmin({ empresaId, onMudou }: Props) {
  const [dados, setDados] = useState<{ membros: MembroListado[]; convites: ConviteListado[] } | null>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function carregar() {
    const r = await fetch(`/api/admin/empresas/${empresaId}/equipe`).catch(() => null);
    if (r?.ok) setDados(await r.json());
    else setErro("Não deu para carregar a equipe.");
  }

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  async function remover(tipo: "membro" | "convite", id: string, rotulo: string) {
    const pergunta =
      tipo === "membro"
        ? `Remover ${rotulo} da equipe? A pessoa perde o acesso à empresa na hora.`
        : `Cancelar o convite de ${rotulo}?`;
    if (!confirm(pergunta)) return;
    setErro("");
    setOcupado(id);
    const r = await fetch(`/api/admin/empresas/${empresaId}/equipe?${tipo}=${encodeURIComponent(id)}`, { method: "DELETE" });
    setOcupado(null);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setErro(d.error || "Não deu para remover.");
      return;
    }
    await carregar();
    onMudou?.();
  }

  if (!dados && !erro) {
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin" /> carregando equipe…
      </p>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-2 space-y-1.5 text-xs">
      {dados?.membros.map((m) => (
        <div key={m.userId} className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium flex items-center gap-1 truncate">
              {m.papel === "dono" && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
              {m.nome}
              {m.status === "suspenso" && <span className="text-red-600 font-normal"> · suspenso</span>}
            </p>
            <p className="text-muted-foreground truncate">
              {m.email} · {m.papel === "dono" ? "dono" : `gerente${m.desde ? ` desde ${new Date(m.desde).toLocaleDateString("pt-BR")}` : ""}`}
            </p>
          </div>
          {m.papel === "gerente" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-red-700 hover:text-red-700 hover:bg-red-50"
              disabled={ocupado === m.userId}
              onClick={() => remover("membro", m.userId, m.nome)}
              title="Remover da equipe"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {dados?.convites.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-2 text-muted-foreground">
          <p className="truncate">
            convite: {c.nome || c.email}
            {c.nome && ` (${c.email})`} · {c.vencido ? "vencido" : `vale até ${new Date(c.expiraEm).toLocaleDateString("pt-BR")}`}
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5"
            disabled={ocupado === c.id}
            onClick={() => remover("convite", c.id, c.nome || c.email)}
            title="Cancelar convite"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      {dados && dados.membros.length <= 1 && dados.convites.length === 0 && (
        <p className="text-muted-foreground">Só o dono. Nenhum gerente nem convite pendente.</p>
      )}
      {erro && <p className="text-red-700">{erro}</p>}
    </div>
  );
}
