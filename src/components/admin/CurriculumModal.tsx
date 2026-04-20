"use client";

import { useEffect, useState, useRef } from "react";
import { X, Printer, MapPin, Phone, Mail, ChefHat } from "lucide-react";
import { ESPECIALIDADES } from "@/constants/especialidades";

interface Experiencia {
  cargo: string;
  empresa: string;
  cidade: string;
  estado: string;
  dataInicio: string;
  dataFim: string | null;
  descricao: string;
}

interface CurriculumData {
  user: { name: string; email: string };
  profissional: {
    nomeCompleto: string;
    telefone: string;
    cidade: string;
    estado: string;
    fotoPerfil: string | null;
    especialidades: string[];
    resumoProfissional: string;
    habilidades: string[];
    experiencias: Experiencia[];
    disponibilidade: { tipo: string[]; imediata: boolean; dataDisponivel: string | null };
    completude: number;
  };
}

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT",
  temporario: "Temporário",
  sazonal: "Sazonal",
};

interface Props {
  userId: string;
  userName: string;
  onClose: () => void;
}

export default function CurriculumModal({ userId, userName, onClose }: Props) {
  const [dados, setDados] = useState<CurriculumData | null>(null);
  const [erro, setErro] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/admin/usuarios/${userId}/curriculum`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErro(d.error);
        else setDados(d);
      })
      .catch(() => setErro("Erro ao carregar currículo."));
  }, [userId]);

  function handlePrint() {
    const conteudo = printRef.current;
    if (!conteudo) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Currículo — ${dados?.profissional.nomeCompleto}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        ${conteudo.ownerDocument.head.innerHTML}
      </style>
      </head><body>${conteudo.outerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  const p = dados?.profissional;
  const u = dados?.user;

  const primeiraEspecialidade = p?.especialidades?.[0]
    ? (ESPECIALIDADES.find((e) => e.value === p.especialidades[0])?.label ?? p.especialidades[0])
    : "Profissional";

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">

        {/* Barra de ações */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-[#f4f7f5] rounded-t-2xl shrink-0">
          <p className="text-sm font-semibold text-[#143f28]">Currículo — {userName}</p>
          <div className="flex items-center gap-2">
            {dados && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1a5c38] text-white hover:bg-[#143f28] transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <div className="overflow-y-auto flex-1 rounded-b-2xl">
          {!dados && !erro && (
            <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
              Carregando currículo...
            </div>
          )}
          {erro && (
            <div className="flex items-center justify-center py-24 text-red-600 text-sm">
              {erro}
            </div>
          )}

          {dados && (
            <div ref={printRef} className="flex min-h-full">

              {/* ── COLUNA ESQUERDA — barra lateral verde escura ── */}
              <aside
                style={{ backgroundColor: "#143f28", minWidth: "240px", width: "240px" }}
                className="text-white flex flex-col shrink-0"
              >
                {/* Foto / avatar */}
                <div className="flex flex-col items-center pt-8 pb-6 px-4">
                  <div className="w-28 h-28 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center mb-3">
                    {p?.fotoPerfil ? (
                      <img src={p.fotoPerfil} alt={p.nomeCompleto} className="w-full h-full object-cover" />
                    ) : (
                      <ChefHat className="h-12 w-12 text-white/50" />
                    )}
                  </div>
                  {/* Barra de completude */}
                  <div className="w-full mt-1">
                    <div className="flex justify-between text-xs text-white/50 mb-1">
                      <span>Perfil</span>
                      <span>{p?.completude ?? 0}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${p?.completude ?? 0}%`, backgroundColor: "#4ade80" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-8 space-y-6 flex-1">

                  {/* Contato */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-3 border-b border-white/10 pb-1.5">
                      Contato
                    </h3>
                    <ul className="space-y-2.5 text-xs text-white/75">
                      {p?.telefone && (
                        <li className="flex items-start gap-2">
                          <Phone className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#4ade80]" />
                          <span>{p.telefone}</span>
                        </li>
                      )}
                      {u?.email && (
                        <li className="flex items-start gap-2">
                          <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#4ade80]" />
                          <span className="break-all">{u.email}</span>
                        </li>
                      )}
                      {(p?.cidade || p?.estado) && (
                        <li className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#4ade80]" />
                          <span>{[p.cidade, p.estado].filter(Boolean).join(", ")}</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Sobre */}
                  {p?.resumoProfissional && (
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-3 border-b border-white/10 pb-1.5">
                        Sobre
                      </h3>
                      <p className="text-xs text-white/70 leading-relaxed">
                        {p.resumoProfissional}
                      </p>
                    </div>
                  )}

                  {/* Habilidades */}
                  {(p?.habilidades?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-3 border-b border-white/10 pb-1.5">
                        Habilidades
                      </h3>
                      <ul className="space-y-1.5">
                        {p!.habilidades.map((h) => (
                          <li key={h} className="text-xs text-white/75 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#4ade80] shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Disponibilidade */}
                  {(p?.disponibilidade?.tipo?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-3 border-b border-white/10 pb-1.5">
                        Disponibilidade
                      </h3>
                      <ul className="space-y-1.5">
                        {p!.disponibilidade.tipo.map((t) => (
                          <li key={t} className="text-xs text-white/75 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#4ade80] shrink-0" />
                            {TIPO_LABEL[t] ?? t}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-white/45 mt-2">
                        {p!.disponibilidade.imediata
                          ? "Disponível imediatamente"
                          : p!.disponibilidade.dataDisponivel
                          ? `A partir de ${new Date(p!.disponibilidade.dataDisponivel).toLocaleDateString("pt-BR")}`
                          : ""}
                      </p>
                    </div>
                  )}

                </div>
              </aside>

              {/* ── COLUNA DIREITA — conteúdo principal ── */}
              <main className="flex-1 bg-white p-8">

                {/* Cabeçalho com nome */}
                <div className="mb-6 pb-5 border-b-2" style={{ borderColor: "#1a5c38" }}>
                  <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#143f28" }}>
                    {p?.nomeCompleto}
                  </h1>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: "#2DB87A" }}>
                    {primeiraEspecialidade.toUpperCase()}
                  </p>
                  {/* Linha decorativa */}
                  <div className="mt-3 h-0.5 w-16 rounded-full" style={{ backgroundColor: "#2DB87A" }} />
                </div>

                {/* Especialidades */}
                {(p?.especialidades?.length ?? 0) > 0 && (
                  <section className="mb-6">
                    <h2
                      className="text-xs font-bold uppercase tracking-[0.15em] mb-3 pb-1 border-b"
                      style={{ color: "#143f28", borderColor: "#e5e7eb" }}
                    >
                      Especialidades
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {p!.especialidades.map((esp) => {
                        const label = ESPECIALIDADES.find((e) => e.value === esp)?.label ?? esp;
                        return (
                          <span
                            key={esp}
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: "#f0faf5", color: "#1a5c38", border: "1px solid #c6e9d9" }}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Experiências */}
                {(p?.experiencias?.length ?? 0) > 0 && (
                  <section className="mb-6">
                    <h2
                      className="text-xs font-bold uppercase tracking-[0.15em] mb-4 pb-1 border-b"
                      style={{ color: "#143f28", borderColor: "#e5e7eb" }}
                    >
                      Experiências Profissionais
                    </h2>
                    <div className="space-y-4">
                      {p!.experiencias.map((exp, i) => (
                        <div key={i} className="relative pl-4 border-l-2" style={{ borderColor: "#2DB87A" }}>
                          <div
                            className="absolute -left-[5px] top-1 w-2 h-2 rounded-full"
                            style={{ backgroundColor: "#2DB87A" }}
                          />
                          <p className="font-bold text-sm" style={{ color: "#143f28" }}>
                            {exp.cargo}
                          </p>
                          <p className="text-xs font-medium text-gray-600 mt-0.5">
                            {exp.empresa}
                            {(exp.cidade || exp.estado) && (
                              <span className="text-gray-400 font-normal">
                                {" "}· {[exp.cidade, exp.estado].filter(Boolean).join(", ")}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {exp.dataInicio
                              ? new Date(exp.dataInicio).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" })
                              : "—"}
                            {" — "}
                            {exp.dataFim
                              ? new Date(exp.dataFim).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" })
                              : "Atual"}
                          </p>
                          {exp.descricao && (
                            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                              {exp.descricao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Sem experiências */}
                {(p?.experiencias?.length ?? 0) === 0 && (
                  <section className="mb-6">
                    <h2
                      className="text-xs font-bold uppercase tracking-[0.15em] mb-3 pb-1 border-b"
                      style={{ color: "#143f28", borderColor: "#e5e7eb" }}
                    >
                      Experiências Profissionais
                    </h2>
                    <p className="text-xs text-gray-400 italic">Nenhuma experiência cadastrada.</p>
                  </section>
                )}

                {/* Informações complementares */}
                {(p?.habilidades?.length ?? 0) > 0 && (
                  <section>
                    <h2
                      className="text-xs font-bold uppercase tracking-[0.15em] mb-3 pb-1 border-b"
                      style={{ color: "#143f28", borderColor: "#e5e7eb" }}
                    >
                      Informações Complementares
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {p!.habilidades.map((h) => (
                        <span
                          key={h}
                          className="text-xs px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: "#f4f7f5", color: "#374151", border: "1px solid #e5e7eb" }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

              </main>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
