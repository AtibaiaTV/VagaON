import Link from "next/link";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { labelEspecialidade } from "@/constants/especialidades";
import {
  PESOS,
  SCORE_MINIMO_FEED,
  avaliarMatch,
  faixaDoScore,
  foiEliminado,
  paraProfissionalMatch,
  paraVagaMatch,
  type ResultadoMatch,
} from "@/lib/match";
import Profissional from "@/models/Profissional";
import Vaga from "@/models/Vaga";

export const dynamic = "force-dynamic";

/**
 * Laboratório do match: escolha um profissional ou uma vaga e veja como o
 * motor pontua TODOS os pares contra ele, inclusive os eliminados e os que
 * ficam abaixo do mínimo do feed. É aqui que se calibra `pesos.ts` olhando
 * para dados reais, antes de mexer no que o usuário vê.
 */

interface Linha {
  id: string;
  rotulo: string;
  sub: string;
  resultado: ResultadoMatch | null;
  motivoEliminacao: string | null;
}

function Barra({ nota }: { nota: number | null }) {
  if (nota === null) return <span className="text-xs text-muted-foreground">∅</span>;
  const cor = nota >= 0.7 ? "#2DB87A" : nota >= 0.4 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${nota * 100}%`, backgroundColor: cor }} />
      </div>
      <span className="text-[11px] tabular-nums w-7">{nota.toFixed(2)}</span>
    </div>
  );
}

export default async function MatchLabPage({
  searchParams,
}: {
  searchParams: { profissionalId?: string; vagaId?: string };
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/painel");

  await connectDB();

  const { profissionalId, vagaId } = searchParams;
  let linhas: Linha[] = [];
  let titulo = "";
  let subtitulo = "";

  if (profissionalId && isValidObjectId(profissionalId)) {
    const p = await Profissional.findById(profissionalId).lean();
    if (p) {
      titulo = p.nomeCompleto;
      subtitulo = `${p.especialidades.map(labelEspecialidade).join(", ") || "sem especialidade"} · ${p.cidade}/${p.estado} · raio ${p.raioKm ?? 40} km${p.dispostoViajar ? " · viaja" : ""}`;
      const perfil = paraProfissionalMatch(p);
      const vagas = await Vaga.find({ status: "ativa" })
        .populate("empresaId", "nomeFantasia verificada")
        .limit(500)
        .lean();
      linhas = vagas.map((v) => {
        const r = avaliarMatch(perfil, paraVagaMatch(v));
        const emp = v.empresaId as unknown as { nomeFantasia?: string } | null;
        return {
          id: String(v._id),
          rotulo: v.titulo,
          sub: `${labelEspecialidade(v.especialidade)} · ${emp?.nomeFantasia ?? ""} · ${v.remoto ? "remoto" : `${v.cidade}/${v.estado}`}`,
          resultado: foiEliminado(r) ? null : r,
          motivoEliminacao: foiEliminado(r) ? r.motivo : null,
        };
      });
    }
  } else if (vagaId && isValidObjectId(vagaId)) {
    const v = await Vaga.findById(vagaId).populate("empresaId", "nomeFantasia verificada").lean();
    if (v) {
      const emp = v.empresaId as unknown as { nomeFantasia?: string } | null;
      titulo = v.titulo;
      subtitulo = `${labelEspecialidade(v.especialidade)} · ${emp?.nomeFantasia ?? ""} · ${v.remoto ? "remoto" : `${v.cidade}/${v.estado}`} · ${v.tipo}`;
      const alvo = paraVagaMatch(v);
      const profissionais = await Profissional.find({}).limit(500).lean();
      linhas = profissionais.map((p) => {
        const r = avaliarMatch(paraProfissionalMatch(p), alvo);
        return {
          id: String(p._id),
          rotulo: p.nomeCompleto,
          sub: `${p.especialidades.map(labelEspecialidade).join(", ") || "sem especialidade"} · ${p.cidade}/${p.estado} · ${p.anosExperiencia ?? 0} anos`,
          resultado: foiEliminado(r) ? null : r,
          motivoEliminacao: foiEliminado(r) ? r.motivo : null,
        };
      });
    }
  }

  linhas.sort((a, b) => (b.resultado?.prioridade ?? -1) - (a.resultado?.prioridade ?? -1));
  const pontuados = linhas.filter((l) => l.resultado);
  const eliminados = linhas.length - pontuados.length;
  const noFeed = pontuados.filter((l) => (l.resultado?.total ?? 0) >= SCORE_MINIMO_FEED).length;

  const [listaP, listaV] = linhas.length
    ? [[], []]
    : await Promise.all([
        Profissional.find({}).select("nomeCompleto especialidades cidade estado").sort({ updatedAt: -1 }).limit(40).lean(),
        Vaga.find({ status: "ativa" }).select("titulo especialidade cidade estado").sort({ createdAt: -1 }).limit(40).lean(),
      ]);

  const dimensoes = Object.keys(PESOS) as (keyof typeof PESOS)[];

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div style={{ backgroundColor: "#143f28" }} className="py-6">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide">Admin</p>
            <h1 className="text-xl font-bold text-white">Match Lab</h1>
          </div>
          <Link href="/admin" className="text-sm text-white/70 hover:text-white">← Admin</Link>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl border p-4 text-sm">
          <p className="font-semibold mb-2">Pesos atuais (src/lib/match/pesos.ts)</p>
          <div className="flex flex-wrap gap-2">
            {dimensoes.map((d) => (
              <span key={d} className="px-2 py-1 rounded-md bg-muted text-xs">
                {d}: <b>{PESOS[d]}</b>
              </span>
            ))}
            <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 text-xs">
              mínimo do feed: <b>{SCORE_MINIMO_FEED}</b>
            </span>
          </div>
        </div>

        {!linhas.length ? (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="font-semibold mb-3">Ver vagas para um profissional</p>
              <ul className="divide-y text-sm max-h-[60vh] overflow-y-auto">
                {listaP.map((p) => (
                  <li key={String(p._id)}>
                    <Link href={`/admin/match-lab?profissionalId=${p._id}`} className="block py-2 hover:text-primary">
                      <span className="font-medium">{p.nomeCompleto}</span>
                      <span className="text-muted-foreground"> — {p.especialidades.slice(0, 2).map(labelEspecialidade).join(", ") || "sem especialidade"} · {p.cidade}/{p.estado}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="font-semibold mb-3">Ver candidatos para uma vaga</p>
              <ul className="divide-y text-sm max-h-[60vh] overflow-y-auto">
                {listaV.map((v) => (
                  <li key={String(v._id)}>
                    <Link href={`/admin/match-lab?vagaId=${v._id}`} className="block py-2 hover:text-primary">
                      <span className="font-medium">{v.titulo}</span>
                      <span className="text-muted-foreground"> — {labelEspecialidade(v.especialidade)} · {v.cidade}/{v.estado}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border p-4">
              <p className="font-bold text-lg">{titulo}</p>
              <p className="text-sm text-muted-foreground">{subtitulo}</p>
              <p className="text-xs mt-2">
                <b>{linhas.length}</b> avaliados · <b>{pontuados.length}</b> pontuados · <b className="text-primary">{noFeed}</b> entrariam no feed (≥ {SCORE_MINIMO_FEED}) · <b className="text-red-600">{eliminados}</b> eliminados
                {" · "}<Link href="/admin/match-lab" className="underline">trocar</Link>
              </p>
            </div>

            <div className="bg-white rounded-xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-left">
                  <tr>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Par</th>
                    {dimensoes.map((d) => (
                      <th key={d} className="px-3 py-2 font-normal">{d}</th>
                    ))}
                    <th className="px-3 py-2">Explicações / alertas</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {linhas.map((l) => (
                    <tr key={l.id} className={!l.resultado ? "bg-red-50/40" : (l.resultado.total < SCORE_MINIMO_FEED ? "opacity-60" : "")}>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {l.resultado ? (
                          <>
                            <span className="font-black text-lg">{l.resultado.total}</span>
                            <span className="block text-[10px] text-muted-foreground">prio {l.resultado.prioridade} · {faixaDoScore(l.resultado.total).label}</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-red-600">eliminado</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top min-w-[200px]">
                        <p className="font-medium leading-tight">{l.rotulo}</p>
                        <p className="text-xs text-muted-foreground">{l.sub}</p>
                        {l.resultado?.distanciaKm != null && <p className="text-xs text-muted-foreground">{l.resultado.distanciaKm} km</p>}
                      </td>
                      {dimensoes.map((d) => (
                        <td key={d} className="px-3 py-2 align-top">
                          {l.resultado ? <Barra nota={l.resultado.dimensoes.find((x) => x.id === d)?.nota ?? null} /> : null}
                        </td>
                      ))}
                      <td className="px-3 py-2 align-top text-xs min-w-[220px]">
                        {l.motivoEliminacao && <p className="text-red-700">{l.motivoEliminacao}</p>}
                        {l.resultado?.explicacoes.map((e) => <p key={e} className="text-emerald-700">✓ {e}</p>)}
                        {l.resultado?.alertas.map((a) => <p key={a} className="text-amber-700">⚠ {a}</p>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
