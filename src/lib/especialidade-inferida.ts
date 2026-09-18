import { ESPECIALIDADES } from "../constants/especialidades";

/**
 * Descobre a especialidade (value da tabela) a partir do título da vaga e
 * de um texto livre ("Hotelaria / Governança", "Alimentação e Gastronomia").
 *
 * Por que existe: 42 das 60 vagas da base vieram por importação com a
 * função em texto livre. O motor de match pré-filtra por `especialidade`
 * dentro da tabela, então essas vagas nunca apareciam no Descobrir nem
 * ganhavam página por função. Regras de palavra-chave, da mais específica
 * para a mais genérica; sem acerto, "outro" (válido, mas fora do match).
 *
 * Import relativo de propósito: o script de migração roda com
 * `node --experimental-strip-types`, sem o alias `@/`.
 */

const VALIDAS = new Set(ESPECIALIDADES.map((e) => e.value));

export function normalizarTexto(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** [regex sobre o título normalizado, especialidade]. Ordem importa. */
const REGRAS_TITULO: [RegExp, string][] = [
  // Cozinha — liderança
  [/\bchef executiv/, "chef_executivo"],
  [/\bsous ?chef\b/, "sous_chef"],
  [/\bchef de partie\b|\bchef partie\b/, "chef_partie"],
  [/\bchef\b/, "chef_cozinha"],
  // Cozinha — especialidades e apoio (antes de "cozinheir", que é genérico)
  [/\bconfeit|patissi/, "confeiteiro"],
  [/\bpadeir/, "padeiro"],
  [/\bchocolat/, "chocolateiro"],
  [/\bpizzaiol/, "pizzaiolo"],
  [/\bchurrasqueir|parriller/, "churrasqueiro"],
  [/\bsushi/, "sushiman"],
  [/\bgarde manger\b/, "garde_manger"],
  [/\bsteward\b/, "steward_cozinha"],
  [/\blavador(a)? de louca\b|\blouca\b/, "lavador_louca"],
  [/\bajudante de cozinha\b/, "ajudante_cozinha"],
  [/\bauxiliar de cozinha\b|\baux(iliar)? cozinha\b/, "auxiliar_cozinha"],
  [/\bcozinheir\w* industrial\b/, "cozinheiro_industrial"],
  [/\bvegan|vegetarian/, "cozinheiro_vegano"],
  [/\bcozinheir/, "cozinheiro_linha"],
  // Bar
  [/\bbarista\b/, "barista"],
  [/\bbartender\b|\bbarman\b|\bbarmaid\b/, "bartender"],
  [/\bbarback\b/, "barback"],
  [/\bmixolog/, "mixologista"],
  [/\bcervej|beer\b/, "beer_sommelier"],
  [/\bsommelier\b/, "sommelier"],
  [/\batendente de bar\b/, "atendente_bar"],
  // Salão
  [/\bgarcom de eventos?\b|\bgarcon(ete)? de eventos?\b/, "garcom_eventos"],
  [/\bgarcom\b|\bgarconete\b|\bgarcons\b/, "garcom"],
  [/\bcumim\b/, "cumim"],
  [/\brunner\b/, "runner"],
  [/\bmaitre\b/, "maitre"],
  [/\bhostess\b/, "hostess"],
  [/\bdelivery\b|\bretirada\b/, "atendente_delivery"],
  [/\batendente de balcao\b|\bbalconista\b/, "atendente_balcao"],
  // Hospedagem / recepção
  [/\bcapitao porteiro\b|\bporteir/, "porteiro"],
  [/\bconcierge\b/, "concierge"],
  [/\bguest relations?\b/, "guest_relations"],
  [/\bmensageir|\bbellboy\b|\bbell ?boy\b/, "bellboy"],
  [/\btelefonista\b/, "telefonista"],
  [/\broom ?bar\b|\bfrigobar\b|\broom ?service\b/, "atendente_room_service"],
  [/\bcafe da manha\b/, "atendente_cafe_manha"],
  [/\breservas?\b/, "atendente_reservas"],
  [/\brecepcionista\b|\brecepcao\b|\batendente de (pousada|hotel|hospedagem)\b/, "recepcionista_hotel"],
  // Governança
  [/\bgovernanta\b/, "governanta_geral"],
  [/\bsupervisor\w*( a)? de (andares|lavanderia|governanca)\b/, "supervisora_andares"],
  [/\bcamareir/, "camareira"],
  [/\barrumador/, "arrumador"],
  [/\blavanderia\b/, "auxiliar_lavanderia"],
  [/\bpassadeir/, "passadeira"],
  // Lazer
  [/\brecrea|\bmonitor(a)? de recrea|\banimador\b/, "recreador"],
  [/\bspa\b/, "atendente_spa"],
  [/\bmassagista\b|\bmassoterap/, "massagista"],
  [/\bguia turistic/, "guia_turistico"],
  [/\bpersonal trainer\b|\binstrutor/, "instrutor_atividades"],
  // Limpeza e manutenção
  [/\beletric/, "eletricista"],
  [/\bencanador/, "encanador"],
  [/\bmarceneir/, "marceneiro"],
  [/\bpintor/, "pintor"],
  [/\bar ?condicionado\b|\brefrigera/, "tecnico_ar_condicionado"],
  [/\bsupervisor\w* de manutencao\b/, "sup_manutencao"],
  [/\bmanutencao\b|\bmontador de equipamentos\b|\bpedreir|\bjardineir|\bpiscineir/, "tecnico_manutencao"],
  [/\bzelador/, "zelador"],
  [/\bfaxineir/, "faxineiro"],
  // Transporte antes de "ajudante geral": "Ajudante Geral (Motorista)" é motorista.
  [/\bmanobrista\b/, "manobrista"],
  [/\bmotoboy\b|\bentregador/, "entregador_motoboy"],
  [/\bmotorista\b/, "motorista"],
  [/\bservicos gerais\b|\blimpeza\b|\bauxiliar geral\b|\bajudante geral\b/, "auxiliar_limpeza"],
  // Segurança
  [/\bvigilante\b/, "vigilante"],
  [/\bcontrolador(a)? de acesso\b/, "controlador_acesso"],
  [/\bbombeiro\b|\bbrigadista\b/, "bombeiro_civil"],
  [/\bseguranca\b/, "seguranca"],
  // Caixa, estoque
  [/\bfiscal de caixa\b/, "fiscal_caixa"],
  [/\bcaixa\b/, "operador_caixa"],
  [/\bestoquista\b|\balmoxarif/, "estoquista"],
  [/\bcomprador/, "comprador"],
  // Transporte (manobrista, motoboy e motorista estão acima da limpeza)
  [/\bbagageir/, "bagageiro"],
  // Gestão
  [/\bgerente de (restaurante|a ?e? ?b|alimentos)\b/, "gerente_restaurante"],
  [/\bgerente de hotel\b|\bgerente de pousada\b/, "gerente_hotel"],
  [/\bgerente de recepcao\b/, "gerente_recepcao"],
  [/\bgerente de governanca\b/, "gerente_governanca"],
  [/\bgerente geral\b/, "gerente_geral"],
  [/\bgerente comercial\b/, "gerente_comercial"],
  [/\bgerente\b/, "gerente_geral"],
  [/\bsupervisor/, "supervisor_turno"],
  [/\brecrutador/, "recrutador"],
  [/\brecursos humanos\b|\brh\b|\bdepartamento pessoal\b/, "rh"],
  [/\bsocial media\b/, "social_media"],
  [/\bmarketing\b/, "analista_marketing"],
  [/\bfinanceir/, "analista_financeiro"],
  [/\badministrativ/, "assistente_admin"],
  [/\bcoordenador(a)? de eventos?\b|\bprodutor(a)? de eventos?\b/, "coordenador_eventos"],
  [/\bcoordenador/, "coordenador_operacional"],
  [/\bvendas\b|\bvendedor/, "executivo_vendas"],
  [/\batendente de comercio\b|\batendente\b/, "atendente_balcao"],
  // Eventos, audiovisual, beleza
  [/\bcerimonial/, "cerimonialista"],
  [/\bfotograf/, "fotografo"],
  [/\bvideomaker\b|\bcinegraf/, "cinegrafista"],
  [/\bdj\b/, "dj"],
  [/\bmusic/, "musico"],
  [/\bcabeleireir/, "cabeleireiro"],
  [/\bmaquiador/, "maquiador"],
  [/\bbarbeir/, "barbeiro"],
  [/\besteticista\b/, "esteticista"],
];

/** Fallback pelo texto livre da "área", quando o título não diz a função. */
const REGRAS_AREA: [RegExp, string][] = [
  [/governanca/, "camareira"],
  [/recepcao|hospede|hospedagem/, "recepcionista_hotel"],
  [/lavanderia/, "auxiliar_lavanderia"],
  [/limpeza|servicos gerais/, "auxiliar_limpeza"],
  [/manutencao|construcao/, "tecnico_manutencao"],
  [/recreacao|lazer|animacao/, "recreador"],
  [/bem estar|spa/, "atendente_spa"],
  [/cervej/, "beer_sommelier"],
  [/\bbar\b/, "bartender"],
  [/cozinha|gastronomia|alimentacao|self service/, "cozinheiro_linha"],
  [/marketing|comunicacao/, "analista_marketing"],
  [/recursos humanos|\brh\b/, "rh"],
  [/varejo|atendimento/, "atendente_balcao"],
  [/logistica|estoque/, "estoquista"],
  [/seguranca/, "seguranca"],
  [/eventos/, "coordenador_eventos"],
];

export function especialidadeValida(v: unknown): v is string {
  return typeof v === "string" && VALIDAS.has(v);
}

/**
 * Devolve uma especialidade da tabela. Se `atual` já é válida, mantém.
 * Senão tenta o título, depois o texto livre, depois "outro".
 */
export function inferirEspecialidade(titulo: string, textoLivre?: string | null, atual?: string | null): string {
  if (especialidadeValida(atual)) return atual;
  const t = normalizarTexto(titulo);
  for (const [re, valor] of REGRAS_TITULO) if (re.test(t)) return valor;
  const a = normalizarTexto(textoLivre ?? "");
  for (const [re, valor] of REGRAS_AREA) if (re.test(a)) return valor;
  return "outro";
}
