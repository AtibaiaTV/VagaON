import Link from "next/link";
import { Activity, BellRing, Clock, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MetricasLiquidez } from "@/lib/servicos/metricas-liquidez";

function pct(parte: number, total: number): string {
  if (!total) return "—";
  return `${Math.round((parte / total) * 100)}%`;
}

function horas(h: number | null): string {
  if (h === null) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} h`;
  return `${(h / 24).toFixed(1)} dias`;
}

function Tile({ rotulo, valor, dica, destaque, href }: { rotulo: string; valor: string; dica?: string; destaque?: boolean; href: string }) {
  return (
    <Link
      href={href}
      title="Ver quem está por trás deste número"
      className={`block rounded-lg border px-3 py-2.5 transition-all hover:border-primary hover:shadow-sm ${destaque ? "border-primary/40 bg-primary/5" : "bg-white"}`}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="text-xl font-bold leading-tight mt-0.5">{valor}</p>
      {dica && <p className="text-[11px] text-muted-foreground mt-0.5">{dica}</p>}
    </Link>
  );
}

/**
 * O termômetro do match: virou conversa? em quanto tempo? os avisos
 * mexeram nisso? Sem estes números, a decisão sobre WhatsApp e alertas
 * fica no "acho".
 */
export default function PainelLiquidez({ m }: { m: MetricasLiquidez }) {
  const t = m.matches;
  const leitura: string[] = [];
  if (t.total === 0) {
    leitura.push(`Nenhum match nos últimos ${m.dias} dias. O gargalo ainda é liquidez (vagas e perfis ativos), não aviso.`);
  } else {
    leitura.push(
      `${pct(t.comMensagem, t.total)} dos matches viraram conversa; ${pct(t.respondidosEm48h, t.total)} em até 48 h. ` +
        (t.semMensagem ? `${t.semMensagem} morreram sem uma mensagem.` : "Nenhum ficou sem mensagem.")
    );
    if (t.horasAtePrimeiraMensagemMediana !== null) {
      leitura.push(`Metade das conversas começa em até ${horas(t.horasAtePrimeiraMensagemMediana)} depois do match.`);
    }
    if (m.alertaMatchParado.enviados) {
      leitura.push(
        `Alerta de match parado: ${m.alertaMatchParado.enviados} enviado(s), ${m.alertaMatchParado.reagiram} viraram conversa depois (${pct(m.alertaMatchParado.reagiram, m.alertaMatchParado.enviados)}).`
      );
    }
  }
  if (m.alertaVagaNova.profissionaisAvisados) {
    leitura.push(
      `Alerta de vaga nova: ${m.alertaVagaNova.profissionaisAvisados} aviso(s) em ${m.alertaVagaNova.vagasComAlerta} vaga(s); ${m.alertaVagaNova.converteram} viraram like ou candidatura (${pct(m.alertaVagaNova.converteram, m.alertaVagaNova.profissionaisAvisados)}).`
    );
  }

  return (
    <Card className="mb-10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Liquidez do match · últimos {m.dias} dias
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Match vira conversa? Em quanto tempo? Os avisos ajudam? É o que decide se WhatsApp e alertas valem o custo.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Tile rotulo="Matches" valor={String(t.total)} dica={`${t.contratados} contratação(ões)`} href={`/admin/matches?dias=${m.dias}`} />
          <Tile rotulo="Viraram conversa" valor={pct(t.comMensagem, t.total)} dica={`${t.comMensagem} de ${t.total}`} destaque href={`/admin/matches?dias=${m.dias}&f=conversa`} />
          <Tile rotulo="Resposta em 48 h" valor={pct(t.respondidosEm48h, t.total)} dica={`${t.semMensagem} sem nenhuma mensagem`} destaque href={`/admin/matches?dias=${m.dias}&f=${t.respondidosEm48h ? "48h" : "sem-mensagem"}`} />
          <Tile
            rotulo="Tempo até a 1ª mensagem"
            valor={horas(t.horasAtePrimeiraMensagemMediana)}
            dica={`mediana · média ${horas(t.horasAtePrimeiraMensagemMedia)}`}
            href={`/admin/matches?dias=${m.dias}&f=conversa`}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Tile
            rotulo="Quem fala primeiro"
            valor={t.comMensagem ? `${pct(t.primeiroFalou.empresa, t.comMensagem)} empresa` : "—"}
            dica={t.comMensagem ? `${pct(t.primeiroFalou.profissional, t.comMensagem)} profissional` : undefined}
            href={`/admin/matches?dias=${m.dias}&f=empresa-primeiro`}
          />
          <Tile
            rotulo="Alerta de match parado"
            valor={String(m.alertaMatchParado.enviados)}
            dica={m.alertaMatchParado.enviados ? `${m.alertaMatchParado.reagiram} reagiram (${pct(m.alertaMatchParado.reagiram, m.alertaMatchParado.enviados)})` : "nenhum enviado"}
            href={`/admin/matches?dias=${m.dias}&f=alerta-parado`}
          />
          <Tile
            rotulo="Alerta de vaga nova"
            valor={String(m.alertaVagaNova.profissionaisAvisados)}
            dica={`${m.alertaVagaNova.vagasComAlerta} vaga(s) · ${m.alertaVagaNova.converteram} converteram (${pct(m.alertaVagaNova.converteram, m.alertaVagaNova.profissionaisAvisados)})`}
            href={`/admin/alertas?dias=${m.dias}&tipo=vaga-nova`}
          />
          <Tile
            rotulo="Match → contratação"
            valor={t.diasAteContratacaoMedia !== null ? `${t.diasAteContratacaoMedia.toFixed(0)} dias` : "—"}
            dica={`${m.resumoSemanal.enviados} resumo(s) semanal(is) enviado(s)`}
            href={`/admin/matches?dias=${m.dias}&f=contratados`}
          />
        </div>

        <ul className="text-sm space-y-1">
          {leitura.map((l, i) => (
            <li key={i} className="flex gap-2">
              {i === 0 ? <MessageSquareText className="h-4 w-4 text-primary shrink-0 mt-0.5" /> : i === 1 ? <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" /> : <BellRing className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
              <span>{l}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-muted-foreground">
          Clique em qualquer número para ver quem está por trás dele. Resumos semanais enviados:{" "}
          <Link href={`/admin/alertas?dias=${m.dias}&tipo=resumo`} className="underline">ver lista</Link>. Conta só mensagens de pessoas (propostas de entrevista e avisos do sistema não valem como resposta). Conversão do
          alerta de vaga = like ou candidatura naquela vaga depois do aviso.
        </p>
      </CardContent>
    </Card>
  );
}
