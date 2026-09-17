import { ESPECIALIDADES } from "@/constants/especialidades";
import type { PerfilExtraido } from "./curriculo";

const CHAVES_ESPECIALIDADE = new Set(ESPECIALIDADES.map((e) => e.value));

/**
 * Aplica o que a IA extraiu do currículo ao estado do formulário de perfil.
 * Pura e sem dependências de servidor — roda no cliente e é testável.
 *
 * Política: campo já preenchido é mantido (a pessoa sabe mais que o PDF);
 * listas são unidas sem duplicar. Tudo continua editável antes de salvar.
 */

export interface ExperienciaForm {
  _id?: string;
  cargo: string;
  empresa: string;
  cidade: string;
  estado: string;
  /** AAAA-MM (input type="month"). */
  dataInicio: string;
  /** AAAA-MM; vazio = emprego atual. */
  dataFim: string;
  descricao: string;
}

export interface IdiomaForm {
  idioma: string;
  nivel: string;
}

export interface EstadoPerfilForm {
  pessoal: {
    nomeCompleto: string;
    telefone: string;
    cidade: string;
    estado: string;
    resumoProfissional: string;
  };
  especialidades: string[];
  /** Separadas por vírgula, como no campo do formulário. */
  habilidades: string;
  experiencias: ExperienciaForm[];
  idiomas: IdiomaForm[];
}

export interface RelatorioMesclagem {
  /** Campos de texto que estavam vazios e foram preenchidos. */
  preenchidos: string[];
  /** Campos que já tinham valor e foram mantidos. */
  mantidos: string[];
  adicionados: { especialidades: number; habilidades: number; experiencias: number; idiomas: number };
  /** Experiências importadas sem data de início — precisam de revisão. */
  experienciasSemData: number;
}

const ROTULOS: Record<keyof EstadoPerfilForm["pessoal"], string> = {
  nomeCompleto: "nome",
  telefone: "telefone",
  cidade: "cidade",
  estado: "estado",
  resumoProfissional: "resumo profissional",
};

export function formatarTelefone(digitos: string): string {
  const d = digitos.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digitos;
}

function chaveNormalizada(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function unirSemDuplicar(atual: string[], novos: string[]): { lista: string[]; adicionados: number } {
  const vistos = new Set(atual.map(chaveNormalizada));
  const lista = [...atual];
  let adicionados = 0;
  for (const n of novos) {
    const chave = chaveNormalizada(n);
    if (!chave || vistos.has(chave)) continue;
    vistos.add(chave);
    lista.push(n);
    adicionados++;
  }
  return { lista, adicionados };
}

export function mesclarPerfilExtraido<T extends EstadoPerfilForm>(
  atual: T,
  extraido: PerfilExtraido
): { estado: T; relatorio: RelatorioMesclagem } {
  const preenchidos: string[] = [];
  const mantidos: string[] = [];

  const pessoal = { ...atual.pessoal };
  const sugestoes: Partial<Record<keyof EstadoPerfilForm["pessoal"], string | null>> = {
    nomeCompleto: extraido.nomeCompleto,
    telefone: extraido.telefone ? formatarTelefone(extraido.telefone) : null,
    cidade: extraido.cidade,
    estado: extraido.estado,
    resumoProfissional: extraido.resumoProfissional,
  };
  for (const campo of Object.keys(sugestoes) as (keyof typeof sugestoes)[]) {
    const valor = sugestoes[campo]?.trim();
    if (!valor) continue;
    if (pessoal[campo]?.trim()) mantidos.push(ROTULOS[campo]);
    else {
      pessoal[campo] = valor;
      preenchidos.push(ROTULOS[campo]);
    }
  }

  // O servidor já filtra pela taxonomia; aqui é cinto e suspensório.
  const esp = unirSemDuplicar(
    atual.especialidades,
    extraido.especialidades.filter((e) => CHAVES_ESPECIALIDADE.has(e))
  );

  const habAtuais = atual.habilidades.split(",").map((h) => h.trim()).filter(Boolean);
  const hab = unirSemDuplicar(habAtuais, extraido.habilidades);

  const chaveExp = (cargo: string, empresa: string) => `${chaveNormalizada(cargo)}|${chaveNormalizada(empresa)}`;
  const expVistas = new Set(atual.experiencias.map((e) => chaveExp(e.cargo, e.empresa)));
  const experiencias = [...atual.experiencias];
  let expAdicionadas = 0;
  let experienciasSemData = 0;
  for (const e of extraido.experiencias) {
    if (!e.cargo?.trim() || !e.empresa?.trim()) continue;
    const chave = chaveExp(e.cargo, e.empresa);
    if (expVistas.has(chave)) continue;
    expVistas.add(chave);
    if (!e.dataInicio) experienciasSemData++;
    experiencias.push({
      cargo: e.cargo.trim(),
      empresa: e.empresa.trim(),
      cidade: e.cidade?.trim() ?? "",
      estado: e.estado ?? "",
      dataInicio: e.dataInicio ?? "",
      dataFim: e.atual ? "" : (e.dataFim ?? ""),
      descricao: e.descricao?.trim() ?? "",
    });
    expAdicionadas++;
  }

  const idiomasVistos = new Set(atual.idiomas.map((i) => chaveNormalizada(i.idioma)));
  const idiomas = [...atual.idiomas];
  let idiomasAdicionados = 0;
  for (const i of extraido.idiomas) {
    const chave = chaveNormalizada(i.idioma);
    if (!chave || idiomasVistos.has(chave)) continue;
    idiomasVistos.add(chave);
    idiomas.push({ idioma: i.idioma.trim(), nivel: i.nivel });
    idiomasAdicionados++;
  }

  return {
    estado: {
      ...atual,
      pessoal,
      especialidades: esp.lista,
      habilidades: hab.lista.join(", "),
      experiencias,
      idiomas,
    },
    relatorio: {
      preenchidos,
      mantidos,
      adicionados: {
        especialidades: esp.adicionados,
        habilidades: hab.adicionados,
        experiencias: expAdicionadas,
        idiomas: idiomasAdicionados,
      },
      experienciasSemData,
    },
  };
}

/** Frase curta para o aviso pós-importação. */
export function descreverMesclagem(r: RelatorioMesclagem): string {
  const partes: string[] = [];
  if (r.preenchidos.length) partes.push(`preenchemos ${r.preenchidos.join(", ")}`);
  const a = r.adicionados;
  const listas = [
    a.especialidades ? `${a.especialidades} especialidade${a.especialidades > 1 ? "s" : ""}` : null,
    a.experiencias ? `${a.experiencias} experiência${a.experiencias > 1 ? "s" : ""}` : null,
    a.habilidades ? `${a.habilidades} habilidade${a.habilidades > 1 ? "s" : ""}` : null,
    a.idiomas ? `${a.idiomas} idioma${a.idiomas > 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  if (listas.length) partes.push(`adicionamos ${listas.join(", ")}`);
  if (!partes.length) return "Nada novo para adicionar — seu perfil já tinha tudo o que o currículo traz.";
  const frase = partes.join(" e ");
  return frase.charAt(0).toUpperCase() + frase.slice(1) + ".";
}
