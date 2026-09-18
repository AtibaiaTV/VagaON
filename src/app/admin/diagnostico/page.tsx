import { CheckCircle2, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
import { diagnosticar, type EstadoVariavel, type Severidade, type VariavelAvaliada } from "@/lib/diagnostico";

export const dynamic = "force-dynamic";

const SEVERIDADE_ROTULO: Record<Severidade, string> = {
  essencial: "Essencial",
  importante: "Importante",
  opcional: "Opcional",
};

const SEVERIDADE_COR: Record<Severidade, string> = {
  essencial: "bg-red-50 text-red-700 border-red-200",
  importante: "bg-amber-50 text-amber-700 border-amber-200",
  opcional: "bg-gray-100 text-gray-600 border-gray-200",
};

function Icone({ estado }: { estado: EstadoVariavel }) {
  if (estado === "ok") return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
  if (estado === "alerta") return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
  return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
}

function Linha({ v }: { v: VariavelAvaliada }) {
  return (
    <div className="flex gap-3 px-4 py-3 border-t first:border-t-0">
      <div className="pt-0.5">
        <Icone estado={v.estado} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-sm font-semibold">{v.nome}</code>
          <span className={`text-[11px] px-1.5 py-0.5 rounded border ${SEVERIDADE_COR[v.severidade]}`}>
            {SEVERIDADE_ROTULO[v.severidade]}
          </span>
          {v.estado === "ausente" && <span className="text-xs text-red-600 font-medium">não definida</span>}
        </div>

        <p className="text-sm text-muted-foreground mt-1">{v.descricao}</p>

        {v.mostrarValor && v.valor && (
          <p className="text-xs font-mono mt-1 break-all text-foreground/70">{v.valor}</p>
        )}

        {v.mensagemAlerta && (
          <p className="text-sm text-amber-700 mt-1.5 font-medium">{v.mensagemAlerta}</p>
        )}

        {v.estado === "ausente" && (
          <div className="mt-1.5 space-y-1">
            <p className="text-sm text-foreground/80">
              <span className="font-medium">Sem ela: </span>
              {v.semEla}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Onde conseguir: </span>
              {v.comoObter}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Checagem das variáveis de ambiente: o que está configurado, o que falta e o
 * que exatamente deixa de funcionar sem cada uma. Nenhum segredo é exibido —
 * só variáveis públicas mostram valor.
 */
export default function AdminDiagnosticoPage() {
  const { grupos, pendencias, ok, total } = diagnosticar();

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Diagnóstico de configuração</h1>
        <p className="text-muted-foreground text-sm mt-1">
          O que está definido neste ambiente ({process.env.NODE_ENV}) e o que cada variável que falta deixa de
          funcionar. Os valores secretos nunca aparecem aqui — só se estão presentes ou não.
        </p>
      </div>

      <div className="rounded-xl border bg-white px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span>
          <span className="font-semibold">{ok}</span> de {total} configuradas
        </span>
        {pendencias.length === 0 ? (
          <span className="text-green-700 font-medium">Nada pendente.</span>
        ) : (
          <span className="text-amber-700 font-medium">
            {pendencias.length} {pendencias.length === 1 ? "pendência" : "pendências"} a resolver
          </span>
        )}
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"
        >
          Variáveis na Vercel <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {pendencias.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Resolver primeiro</p>
          <ul className="mt-2 space-y-1.5 text-sm text-amber-900/90">
            {pendencias.map((v) => (
              <li key={v.nome}>
                <code className="font-semibold">{v.nome}</code> — {v.mensagemAlerta ?? v.semEla}
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-900/70 mt-3">
            Na Vercel: Settings → Environment Variables. Depois de salvar é preciso um novo deploy — variáveis
            NEXT_PUBLIC_* entram no código no momento do build.
          </p>
        </div>
      )}

      {grupos.map((g) => (
        <section key={g.nome}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">{g.nome}</h2>
          <div className="rounded-xl border bg-white overflow-hidden">
            {g.variaveis.map((v) => (
              <Linha key={v.nome} v={v} />
            ))}
          </div>
        </section>
      ))}

      <p className="text-xs text-muted-foreground">
        Lista completa, com exemplos de valor, em <code>docs/VARIAVEIS.md</code> e <code>.env.example</code>. Para
        conferir o WhatsApp de ponta a ponta, use <a href="/admin/whatsapp" className="underline">Admin → WhatsApp → Testar envio</a>.
      </p>
    </div>
  );
}
