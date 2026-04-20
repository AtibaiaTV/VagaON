"use client";

import { useEffect, useState } from "react";
import { X, Printer, FileDown, MapPin, Phone, Mail } from "lucide-react";
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

/** Gera um HTML completo e auto-contido para o currículo */
function gerarHtmlCurriculo(
  p: CurriculumData["profissional"],
  u: CurriculumData["user"],
  iniciais: string,
  primeiraEsp: string
): string {
  const estilosHoje = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return `<style>${Array.from(sheet.cssRules).map((r) => r.cssText).join("\n")}</style>`;
      } catch {
        return sheet.href ? `<link rel="stylesheet" href="${sheet.href}">` : "";
      }
    })
    .join("\n");

  const expHtml = p.experiencias.map((exp) => `
    <div style="position:relative;padding-left:16px;border-left:2px solid #2DB87A;margin-bottom:16px">
      <div style="position:absolute;left:-5px;top:4px;width:8px;height:8px;border-radius:50%;background:#2DB87A"></div>
      <p style="font-weight:700;font-size:13px;color:#143f28">${exp.cargo}</p>
      <p style="font-size:11px;color:#4b5563;margin-top:2px">${exp.empresa}${exp.cidade || exp.estado ? ` · <span style="color:#9ca3af">${[exp.cidade, exp.estado].filter(Boolean).join(", ")}</span>` : ""}</p>
      <p style="font-size:10px;color:#9ca3af;margin-top:2px">
        ${exp.dataInicio ? new Date(exp.dataInicio).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }) : "—"}
        —
        ${exp.dataFim ? new Date(exp.dataFim).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }) : "Atual"}
      </p>
      ${exp.descricao ? `<p style="font-size:11px;color:#6b7280;margin-top:6px">${exp.descricao}</p>` : ""}
    </div>
  `).join("");

  const espHtml = p.especialidades.map((esp) => {
    const label = ESPECIALIDADES.find((e) => e.value === esp)?.label ?? esp;
    return `<span style="font-size:11px;font-weight:500;padding:3px 10px;border-radius:999px;background:#f0faf5;color:#1a5c38;border:1px solid #c6e9d9">${label}</span>`;
  }).join(" ");

  const habHtml = p.habilidades.map((h) => `<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:#f4f7f5;color:#374151;border:1px solid #e5e7eb">${h}</span>`).join(" ");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Currículo — ${p.nomeCompleto}</title>
  ${estilosHoje}
  <style>
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @page { margin: 0; size: A4 portrait; }
    body { margin: 0; font-family: Arial, sans-serif; display: flex; min-height: 100vh; }
  </style>
</head>
<body>
  <aside style="background:#143f28;width:240px;min-width:240px;color:white;display:flex;flex-direction:column">
    <div style="display:flex;flex-direction:column;align-items:center;padding:32px 16px 24px">
      ${p.fotoPerfil
        ? `<img src="${p.fotoPerfil}" style="width:112px;height:112px;border-radius:50%;border:4px solid rgba(255,255,255,0.2);object-fit:cover;margin-bottom:12px">`
        : `<div style="width:112px;height:112px;border-radius:50%;border:4px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;margin-bottom:12px;font-size:32px;font-weight:700;color:white">${iniciais}</div>`
      }
      <div style="width:100%;margin-top:4px">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:4px"><span>Perfil</span><span>${p.completude}%</span></div>
        <div style="height:6px;background:rgba(255,255,255,0.1);border-radius:999px;overflow:hidden"><div style="height:100%;width:${p.completude}%;background:#4ade80;border-radius:999px"></div></div>
      </div>
    </div>
    <div style="padding:0 20px 32px;display:flex;flex-direction:column;gap:24px">
      <div>
        <p style="font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.4);border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px;margin-bottom:10px">Contato</p>
        ${p.telefone ? `<p style="font-size:11px;color:rgba(255,255,255,0.75);margin-bottom:8px">📞 ${p.telefone}</p>` : ""}
        ${u.email ? `<p style="font-size:11px;color:rgba(255,255,255,0.75);margin-bottom:8px;word-break:break-all">✉ ${u.email}</p>` : ""}
        ${p.cidade || p.estado ? `<p style="font-size:11px;color:rgba(255,255,255,0.75)">📍 ${[p.cidade, p.estado].filter(Boolean).join(", ")}</p>` : ""}
      </div>
      ${p.resumoProfissional ? `
      <div>
        <p style="font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.4);border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px;margin-bottom:10px">Sobre</p>
        <p style="font-size:11px;color:rgba(255,255,255,0.7);line-height:1.6">${p.resumoProfissional}</p>
      </div>` : ""}
      ${p.habilidades.length > 0 ? `
      <div>
        <p style="font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.4);border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px;margin-bottom:10px">Habilidades</p>
        ${p.habilidades.map((h) => `<p style="font-size:11px;color:rgba(255,255,255,0.75);margin-bottom:6px">• ${h}</p>`).join("")}
      </div>` : ""}
      ${p.disponibilidade.tipo.length > 0 ? `
      <div>
        <p style="font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.4);border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px;margin-bottom:10px">Disponibilidade</p>
        ${p.disponibilidade.tipo.map((t) => `<p style="font-size:11px;color:rgba(255,255,255,0.75);margin-bottom:6px">• ${TIPO_LABEL[t] ?? t}</p>`).join("")}
        <p style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:6px">${p.disponibilidade.imediata ? "Disponível imediatamente" : ""}</p>
      </div>` : ""}
    </div>
  </aside>
  <main style="flex:1;background:white;padding:32px">
    <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #1a5c38">
      <h1 style="font-size:28px;font-weight:800;color:#143f28;margin:0">${p.nomeCompleto}</h1>
      <p style="font-size:12px;font-weight:600;color:#2DB87A;margin:4px 0 10px">${primeiraEsp.toUpperCase()}</p>
      <div style="height:2px;width:60px;border-radius:999px;background:#2DB87A"></div>
    </div>
    ${p.especialidades.length > 0 ? `
    <div style="margin-bottom:24px">
      <h2 style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#143f28;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:10px">Especialidades</h2>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${espHtml}</div>
    </div>` : ""}
    <div style="margin-bottom:24px">
      <h2 style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#143f28;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:16px">Experiências Profissionais</h2>
      ${p.experiencias.length > 0 ? expHtml : `<p style="font-size:11px;color:#9ca3af;font-style:italic">Nenhuma experiência cadastrada.</p>`}
    </div>
    ${p.habilidades.length > 0 ? `
    <div>
      <h2 style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#143f28;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:10px">Informações Complementares</h2>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${habHtml}</div>
    </div>` : ""}
  </main>
</body>
</html>`;
}

export default function CurriculumModal({ userId, userName, onClose }: Props) {
  const [dados, setDados] = useState<CurriculumData | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/admin/usuarios/${userId}/curriculum`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErro(d.error);
        else setDados(d);
      })
      .catch(() => setErro("Erro ao carregar currículo."));
  }, [userId]);

  const p = dados?.profissional;
  const u = dados?.user;

  const iniciais = p?.nomeCompleto
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("") ?? "P";

  const primeiraEspecialidade = p?.especialidades?.[0]
    ? (ESPECIALIDADES.find((e) => e.value === p.especialidades[0])?.label ?? p.especialidades[0])
    : "Profissional";

  function abrirJanelaCurriculo(modoPDF: boolean) {
    if (!p || !u) return;
    const html = gerarHtmlCurriculo(p, u, iniciais, primeiraEspecialidade);
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      alert("Permita pop-ups nesta página para imprimir / salvar PDF.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      if (modoPDF) {
        // Tenta abrir o diálogo de impressão com "Salvar como PDF" sugerido
        win.document.title = `Curriculo_${p.nomeCompleto.replace(/\s+/g, "_")}.pdf`;
      }
      setTimeout(() => win.print(), 400);
    };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">

        {/* Barra de ações */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-[#f4f7f5] rounded-t-2xl shrink-0">
          <p className="text-sm font-semibold text-[#143f28]">Currículo — {userName}</p>
          <div className="flex items-center gap-2">
            {dados && (
              <>
                <button
                  onClick={() => abrirJanelaCurriculo(false)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-[#c6e9d9] text-[#1a5c38] hover:bg-[#f0faf5] transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir
                </button>
                <button
                  onClick={() => abrirJanelaCurriculo(true)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1a5c38] text-white hover:bg-[#143f28] transition-colors"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Salvar PDF
                </button>
              </>
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
            <div className="flex min-h-full">

              {/* ── COLUNA ESQUERDA ── */}
              <aside
                style={{ backgroundColor: "#143f28", minWidth: "240px", width: "240px" }}
                className="text-white flex flex-col shrink-0"
              >
                {/* Avatar */}
                <div className="flex flex-col items-center pt-8 pb-6 px-4">
                  <div className="w-28 h-28 rounded-full border-4 border-white/20 overflow-hidden bg-white/15 flex items-center justify-center mb-3 shrink-0">
                    {p?.fotoPerfil ? (
                      <img
                        src={p.fotoPerfil}
                        alt={p.nomeCompleto}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white/80 select-none">
                        {iniciais}
                      </span>
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
                        className="h-full rounded-full transition-all"
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
                      <p className="text-xs text-white/70 leading-relaxed">{p.resumoProfissional}</p>
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
                        {p!.disponibilidade.imediata ? "Disponível imediatamente" : ""}
                      </p>
                    </div>
                  )}
                </div>
              </aside>

              {/* ── COLUNA DIREITA ── */}
              <main className="flex-1 bg-white p-8">
                {/* Cabeçalho */}
                <div className="mb-6 pb-5 border-b-2" style={{ borderColor: "#1a5c38" }}>
                  <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#143f28" }}>
                    {p?.nomeCompleto}
                  </h1>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: "#2DB87A" }}>
                    {primeiraEspecialidade.toUpperCase()}
                  </p>
                  <div className="mt-3 h-0.5 w-16 rounded-full" style={{ backgroundColor: "#2DB87A" }} />
                </div>

                {/* Especialidades */}
                {(p?.especialidades?.length ?? 0) > 0 && (
                  <section className="mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-3 pb-1 border-b" style={{ color: "#143f28", borderColor: "#e5e7eb" }}>
                      Especialidades
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {p!.especialidades.map((esp) => {
                        const label = ESPECIALIDADES.find((e) => e.value === esp)?.label ?? esp;
                        return (
                          <span key={esp} className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "#f0faf5", color: "#1a5c38", border: "1px solid #c6e9d9" }}>
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Experiências */}
                <section className="mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-4 pb-1 border-b" style={{ color: "#143f28", borderColor: "#e5e7eb" }}>
                    Experiências Profissionais
                  </h2>
                  {(p?.experiencias?.length ?? 0) > 0 ? (
                    <div className="space-y-4">
                      {p!.experiencias.map((exp, i) => (
                        <div key={i} className="relative pl-4 border-l-2" style={{ borderColor: "#2DB87A" }}>
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full" style={{ backgroundColor: "#2DB87A" }} />
                          <p className="font-bold text-sm" style={{ color: "#143f28" }}>{exp.cargo}</p>
                          <p className="text-xs font-medium text-gray-600 mt-0.5">
                            {exp.empresa}
                            {(exp.cidade || exp.estado) && (
                              <span className="text-gray-400 font-normal"> · {[exp.cidade, exp.estado].filter(Boolean).join(", ")}</span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {exp.dataInicio ? new Date(exp.dataInicio).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }) : "—"}
                            {" — "}
                            {exp.dataFim ? new Date(exp.dataFim).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }) : "Atual"}
                          </p>
                          {exp.descricao && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{exp.descricao}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Nenhuma experiência cadastrada.</p>
                  )}
                </section>

                {/* Informações complementares */}
                {(p?.habilidades?.length ?? 0) > 0 && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-3 pb-1 border-b" style={{ color: "#143f28", borderColor: "#e5e7eb" }}>
                      Informações Complementares
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {p!.habilidades.map((h) => (
                        <span key={h} className="text-xs px-2 py-0.5 rounded-md" style={{ backgroundColor: "#f4f7f5", color: "#374151", border: "1px solid #e5e7eb" }}>
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
