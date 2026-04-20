export interface Especialidade {
  value: string;
  label: string;
  categoria: string;
  subcategoria?: string;
}

export interface Categoria {
  value: string;
  label: string;
  subcategorias?: { value: string; label: string }[];
}

// ─── CATEGORIAS ──────────────────────────────────────────────────────────────

export const CATEGORIAS: Categoria[] = [
  {
    value: "cozinha",
    label: "Cozinha (BOH)",
    subcategorias: [
      { value: "cozinha_lideranca", label: "Alta liderança" },
      { value: "cozinha_operacional", label: "Cozinha operacional" },
      { value: "cozinha_especialidades", label: "Especialidades" },
      { value: "cozinha_apoio", label: "Apoio" },
    ],
  },
  { value: "bar", label: "Bar" },
  {
    value: "salao",
    label: "Salão / Atendimento (FOH)",
    subcategorias: [
      { value: "salao_atendimento", label: "Atendimento direto" },
      { value: "salao_recepcao", label: "Recepção" },
      { value: "salao_outros", label: "Outros" },
    ],
  },
  { value: "caixa_financeiro", label: "Caixa e Financeiro" },
  { value: "compras_estoque", label: "Compras, Estoque e Logística" },
  { value: "limpeza_manutencao", label: "Limpeza e Manutenção" },
  { value: "seguranca", label: "Segurança" },
  {
    value: "gestao_admin",
    label: "Gestão e Administração",
    subcategorias: [
      { value: "gestao_operacional", label: "Gestão operacional" },
      { value: "gestao_administrativo", label: "Administrativo" },
      { value: "gestao_alta", label: "Alta gestão" },
    ],
  },
  { value: "eventos_catering", label: "Eventos e Catering" },
  { value: "hospedagem", label: "Hospedagem / Recepção" },
  {
    value: "governanca",
    label: "Governança (Housekeeping)",
    subcategorias: [
      { value: "governanca_gestao", label: "Gestão" },
      { value: "governanca_operacional", label: "Operacional" },
    ],
  },
  { value: "lazer_hospede", label: "Lazer e Experiência do Hóspede" },
  { value: "transporte", label: "Transporte e Apoio" },
  { value: "audiovisual", label: "Audiovisual e Registro" },
  { value: "beleza", label: "Beleza e Preparação" },
  { value: "decoracao", label: "Decoração e Ambientação" },
  { value: "entretenimento", label: "Entretenimento" },
  { value: "marketing_comunicacao", label: "Marketing e Comunicação" },
  { value: "comercial_reservas", label: "Comercial e Reservas" },
  { value: "tecnologia", label: "Tecnologia e Digital" },
];

// ─── ESPECIALIDADES COMPLETAS ─────────────────────────────────────────────────

export const ESPECIALIDADES: Especialidade[] = [
  // ── COZINHA — Alta liderança ──────────────────────────────────────────────
  { value: "chef_executivo",         label: "Chef Executivo",              categoria: "cozinha", subcategoria: "cozinha_lideranca" },
  { value: "chef_cozinha",           label: "Chef de Cozinha",             categoria: "cozinha", subcategoria: "cozinha_lideranca" },
  { value: "sous_chef",              label: "Sous Chef",                   categoria: "cozinha", subcategoria: "cozinha_lideranca" },

  // ── COZINHA — Operacional ─────────────────────────────────────────────────
  { value: "chef_partie",            label: "Cozinheiro (Chef de Partie)", categoria: "cozinha", subcategoria: "cozinha_operacional" },
  { value: "cozinheiro_linha",       label: "Cozinheiro de Linha",         categoria: "cozinha", subcategoria: "cozinha_operacional" },
  { value: "garde_manger",           label: "Garde Manger (Frios)",        categoria: "cozinha", subcategoria: "cozinha_operacional" },
  { value: "churrasqueiro",          label: "Churrasqueiro / Parrillero",  categoria: "cozinha", subcategoria: "cozinha_operacional" },
  { value: "sushiman",               label: "Sushiman / Sushiwoman",       categoria: "cozinha", subcategoria: "cozinha_operacional" },
  { value: "cozinheiro_industrial",  label: "Cozinheiro Industrial",       categoria: "cozinha", subcategoria: "cozinha_operacional" },

  // ── COZINHA — Especialidades ──────────────────────────────────────────────
  { value: "confeiteiro",            label: "Confeiteiro / Pâtissier",     categoria: "cozinha", subcategoria: "cozinha_especialidades" },
  { value: "padeiro",                label: "Padeiro(a)",                  categoria: "cozinha", subcategoria: "cozinha_especialidades" },
  { value: "chocolateiro",           label: "Chocolateiro(a)",             categoria: "cozinha", subcategoria: "cozinha_especialidades" },
  { value: "cozinheiro_vegano",      label: "Cozinheiro Vegetariano/Vegano", categoria: "cozinha", subcategoria: "cozinha_especialidades" },
  { value: "rotisseur",              label: "Rotisseur (Assados)",         categoria: "cozinha", subcategoria: "cozinha_especialidades" },
  { value: "poissonnier",            label: "Poissonnier (Peixes)",        categoria: "cozinha", subcategoria: "cozinha_especialidades" },
  { value: "pizzaiolo",              label: "Pizzaiolo",                   categoria: "cozinha", subcategoria: "cozinha_especialidades" },

  // ── COZINHA — Apoio ───────────────────────────────────────────────────────
  { value: "auxiliar_cozinha",       label: "Auxiliar de Cozinha",         categoria: "cozinha", subcategoria: "cozinha_apoio" },
  { value: "ajudante_cozinha",       label: "Ajudante de Cozinha",         categoria: "cozinha", subcategoria: "cozinha_apoio" },
  { value: "steward_cozinha",        label: "Steward (Utensílios)",        categoria: "cozinha", subcategoria: "cozinha_apoio" },
  { value: "lavador_louca",          label: "Lavador(a) de Louça",         categoria: "cozinha", subcategoria: "cozinha_apoio" },

  // ── BAR ───────────────────────────────────────────────────────────────────
  { value: "bartender",              label: "Bartender / Barman",          categoria: "bar" },
  { value: "barback",                label: "Barback (Assistente de Bar)", categoria: "bar" },
  { value: "barista",                label: "Barista",                     categoria: "bar" },
  { value: "mixologista",            label: "Mixologista",                 categoria: "bar" },
  { value: "sommelier",              label: "Sommelier",                   categoria: "bar" },
  { value: "beer_sommelier",         label: "Beer Sommelier / Cervejeiro", categoria: "bar" },
  { value: "atendente_bar",          label: "Atendente de Bar",            categoria: "bar" },

  // ── SALÃO — Atendimento ───────────────────────────────────────────────────
  { value: "garcom",                 label: "Garçom / Garçonete",          categoria: "salao", subcategoria: "salao_atendimento" },
  { value: "cumim",                  label: "Cumim",                       categoria: "salao", subcategoria: "salao_atendimento" },
  { value: "runner",                 label: "Runner",                      categoria: "salao", subcategoria: "salao_atendimento" },

  // ── SALÃO — Recepção ──────────────────────────────────────────────────────
  { value: "hostess",                label: "Hostess / Recepcionista",     categoria: "salao", subcategoria: "salao_recepcao" },
  { value: "maitre",                 label: "Maître",                      categoria: "salao", subcategoria: "salao_recepcao" },

  // ── SALÃO — Outros ────────────────────────────────────────────────────────
  { value: "atendente_balcao",       label: "Atendente de Balcão",         categoria: "salao", subcategoria: "salao_outros" },
  { value: "atendente_delivery",     label: "Atendente de Delivery / Retirada", categoria: "salao", subcategoria: "salao_outros" },

  // ── CAIXA E FINANCEIRO ────────────────────────────────────────────────────
  { value: "operador_caixa",         label: "Operador de Caixa",           categoria: "caixa_financeiro" },
  { value: "fiscal_caixa",           label: "Fiscal de Caixa",             categoria: "caixa_financeiro" },
  { value: "conferente_caixa",       label: "Conferente de Caixa",         categoria: "caixa_financeiro" },
  { value: "assistente_financeiro",  label: "Assistente Financeiro",       categoria: "caixa_financeiro" },
  { value: "faturista",              label: "Faturista",                   categoria: "caixa_financeiro" },
  { value: "tesoureiro",             label: "Tesoureiro",                  categoria: "caixa_financeiro" },

  // ── COMPRAS, ESTOQUE E LOGÍSTICA ──────────────────────────────────────────
  { value: "estoquista",             label: "Estoquista / Almoxarife",     categoria: "compras_estoque" },
  { value: "comprador",              label: "Comprador",                   categoria: "compras_estoque" },
  { value: "recebedor_mercadorias",  label: "Recebedor de Mercadorias",    categoria: "compras_estoque" },
  { value: "conferente_estoque",     label: "Conferente de Estoque",       categoria: "compras_estoque" },
  { value: "inventariante",          label: "Inventariante",               categoria: "compras_estoque" },
  { value: "planejador_compras",     label: "Planejador de Compras",       categoria: "compras_estoque" },

  // ── LIMPEZA E MANUTENÇÃO ──────────────────────────────────────────────────
  { value: "auxiliar_limpeza",       label: "Auxiliar de Limpeza",         categoria: "limpeza_manutencao" },
  { value: "faxineiro",              label: "Faxineiro(a)",                categoria: "limpeza_manutencao" },
  { value: "zelador",                label: "Zelador",                     categoria: "limpeza_manutencao" },
  { value: "tecnico_manutencao",     label: "Técnico de Manutenção",       categoria: "limpeza_manutencao" },
  { value: "eletricista",            label: "Eletricista",                 categoria: "limpeza_manutencao" },
  { value: "encanador",              label: "Encanador",                   categoria: "limpeza_manutencao" },
  { value: "marceneiro",             label: "Marceneiro",                  categoria: "limpeza_manutencao" },
  { value: "pintor",                 label: "Pintor",                      categoria: "limpeza_manutencao" },
  { value: "tecnico_ar_condicionado",label: "Técnico de Ar-Condicionado",  categoria: "limpeza_manutencao" },
  { value: "sup_manutencao",         label: "Supervisor de Manutenção",    categoria: "limpeza_manutencao" },

  // ── SEGURANÇA ─────────────────────────────────────────────────────────────
  { value: "seguranca",              label: "Segurança",                   categoria: "seguranca" },
  { value: "vigilante",              label: "Vigilante",                   categoria: "seguranca" },
  { value: "controlador_acesso",     label: "Controlador de Acesso",       categoria: "seguranca" },
  { value: "sup_seguranca",          label: "Supervisor de Segurança",     categoria: "seguranca" },
  { value: "bombeiro_civil",         label: "Bombeiro Civil / Brigadista", categoria: "seguranca" },
  { value: "equipe_medica",          label: "Equipe Médica / Socorrista",  categoria: "seguranca" },

  // ── GESTÃO — Operacional ──────────────────────────────────────────────────
  { value: "gerente_geral",          label: "Gerente Geral",               categoria: "gestao_admin", subcategoria: "gestao_operacional" },
  { value: "gerente_restaurante",    label: "Gerente de Restaurante",      categoria: "gestao_admin", subcategoria: "gestao_operacional" },
  { value: "gerente_hotel",          label: "Gerente de Hotel",            categoria: "gestao_admin", subcategoria: "gestao_operacional" },
  { value: "supervisor_turno",       label: "Supervisor de Turno",         categoria: "gestao_admin", subcategoria: "gestao_operacional" },
  { value: "coordenador_operacional",label: "Coordenador Operacional",     categoria: "gestao_admin", subcategoria: "gestao_operacional" },
  { value: "gerente_recepcao",       label: "Gerente de Recepção",         categoria: "gestao_admin", subcategoria: "gestao_operacional" },
  { value: "gerente_governanca",     label: "Gerente de Governança",       categoria: "gestao_admin", subcategoria: "gestao_operacional" },
  { value: "gerente_alimentos",      label: "Gerente de A&B",              categoria: "gestao_admin", subcategoria: "gestao_operacional" },

  // ── GESTÃO — Administrativo ───────────────────────────────────────────────
  { value: "administrador",          label: "Administrador",               categoria: "gestao_admin", subcategoria: "gestao_administrativo" },
  { value: "assistente_admin",       label: "Assistente Administrativo",   categoria: "gestao_admin", subcategoria: "gestao_administrativo" },
  { value: "rh",                     label: "Recursos Humanos (RH)",       categoria: "gestao_admin", subcategoria: "gestao_administrativo" },
  { value: "recrutador",             label: "Recrutador",                  categoria: "gestao_admin", subcategoria: "gestao_administrativo" },
  { value: "analista_marketing",     label: "Analista de Marketing",       categoria: "gestao_admin", subcategoria: "gestao_administrativo" },
  { value: "social_media",           label: "Social Media",                categoria: "gestao_admin", subcategoria: "gestao_administrativo" },
  { value: "analista_financeiro",    label: "Analista Financeiro",         categoria: "gestao_admin", subcategoria: "gestao_administrativo" },
  { value: "controller",             label: "Controller",                  categoria: "gestao_admin", subcategoria: "gestao_administrativo" },

  // ── GESTÃO — Alta gestão ──────────────────────────────────────────────────
  { value: "proprietario",           label: "Proprietário / Dono",         categoria: "gestao_admin", subcategoria: "gestao_alta" },
  { value: "socio",                  label: "Sócio",                       categoria: "gestao_admin", subcategoria: "gestao_alta" },
  { value: "diretor_operacoes",      label: "Diretor de Operações",        categoria: "gestao_admin", subcategoria: "gestao_alta" },

  // ── EVENTOS E CATERING ────────────────────────────────────────────────────
  { value: "coordenador_eventos",    label: "Coordenador de Eventos",      categoria: "eventos_catering" },
  { value: "produtor_eventos",       label: "Produtor de Eventos",         categoria: "eventos_catering" },
  { value: "assessor_eventos",       label: "Assessor de Eventos",         categoria: "eventos_catering" },
  { value: "cerimonialista",         label: "Cerimonialista",              categoria: "eventos_catering" },
  { value: "wedding_planner",        label: "Wedding Planner",             categoria: "eventos_catering" },
  { value: "garcom_eventos",         label: "Garçom de Eventos",           categoria: "eventos_catering" },
  { value: "cozinheiro_catering",    label: "Cozinheiro de Catering",      categoria: "eventos_catering" },
  { value: "auxiliar_catering",      label: "Auxiliar de Catering",        categoria: "eventos_catering" },
  { value: "montador_buffet",        label: "Montador de Buffet",          categoria: "eventos_catering" },
  { value: "chefe_banquetes",        label: "Chefe de Banquetes",          categoria: "eventos_catering" },
  { value: "chef_eventos",           label: "Chef de Eventos",             categoria: "eventos_catering" },

  // ── HOSPEDAGEM / RECEPÇÃO ─────────────────────────────────────────────────
  { value: "recepcionista_hotel",    label: "Recepcionista (Hotel)",       categoria: "hospedagem" },
  { value: "atendente_reservas",     label: "Atendente de Reservas",       categoria: "hospedagem" },
  { value: "agente_reservas",        label: "Agente de Reservas",          categoria: "hospedagem" },
  { value: "concierge",              label: "Concierge",                   categoria: "hospedagem" },
  { value: "guest_relations",        label: "Guest Relations",             categoria: "hospedagem" },
  { value: "bellboy",                label: "Mensageiro / Bellboy",        categoria: "hospedagem" },
  { value: "porteiro",               label: "Porteiro",                    categoria: "hospedagem" },
  { value: "telefonista",            label: "Telefonista",                 categoria: "hospedagem" },
  { value: "atendente_room_service", label: "Atendente de Room Service",   categoria: "hospedagem" },
  { value: "atendente_cafe_manha",   label: "Atendente de Café da Manhã",  categoria: "hospedagem" },

  // ── GOVERNANÇA — Gestão ───────────────────────────────────────────────────
  { value: "governanta_geral",       label: "Governanta Geral",            categoria: "governanca", subcategoria: "governanca_gestao" },
  { value: "supervisora_andares",    label: "Supervisora de Andares",      categoria: "governanca", subcategoria: "governanca_gestao" },

  // ── GOVERNANÇA — Operacional ──────────────────────────────────────────────
  { value: "camareira",              label: "Camareira",                   categoria: "governanca", subcategoria: "governanca_operacional" },
  { value: "arrumador",              label: "Arrumador",                   categoria: "governanca", subcategoria: "governanca_operacional" },
  { value: "lavador_roupas",         label: "Lavador(a) de Roupas",        categoria: "governanca", subcategoria: "governanca_operacional" },
  { value: "passadeira",             label: "Passadeira",                  categoria: "governanca", subcategoria: "governanca_operacional" },
  { value: "auxiliar_lavanderia",    label: "Auxiliar de Lavanderia",      categoria: "governanca", subcategoria: "governanca_operacional" },

  // ── LAZER E EXPERIÊNCIA DO HÓSPEDE ───────────────────────────────────────
  { value: "recreador",              label: "Recreador / Monitor",         categoria: "lazer_hospede" },
  { value: "instrutor_atividades",   label: "Instrutor de Atividades",     categoria: "lazer_hospede" },
  { value: "guia_turistico",         label: "Guia Turístico",              categoria: "lazer_hospede" },
  { value: "personal_trainer",       label: "Personal Trainer",            categoria: "lazer_hospede" },
  { value: "atendente_spa",          label: "Atendente de Spa",            categoria: "lazer_hospede" },
  { value: "massagista",             label: "Massagista",                  categoria: "lazer_hospede" },

  // ── TRANSPORTE E APOIO ────────────────────────────────────────────────────
  { value: "manobrista",             label: "Manobrista",                  categoria: "transporte" },
  { value: "motorista",              label: "Motorista",                   categoria: "transporte" },
  { value: "shuttle_driver",         label: "Shuttle Driver (Translado)",  categoria: "transporte" },
  { value: "bagageiro",              label: "Bagageiro",                   categoria: "transporte" },
  { value: "entregador_motoboy",     label: "Entregador / Motoboy",        categoria: "transporte" },

  // ── AUDIOVISUAL E REGISTRO ────────────────────────────────────────────────
  { value: "fotografo",              label: "Fotógrafo",                   categoria: "audiovisual" },
  { value: "cinegrafista",           label: "Cinegrafista / Videomaker",   categoria: "audiovisual" },
  { value: "editor_video",           label: "Editor de Vídeo",             categoria: "audiovisual" },
  { value: "editor_fotos",           label: "Editor de Fotos",             categoria: "audiovisual" },
  { value: "drone_pilot",            label: "Drone Pilot",                 categoria: "audiovisual" },
  { value: "tecnico_iluminacao",     label: "Técnico de Iluminação",       categoria: "audiovisual" },
  { value: "tecnico_som",            label: "Técnico de Som",              categoria: "audiovisual" },
  { value: "tecnico_projecao",       label: "Operador de Projeção / AV",   categoria: "audiovisual" },

  // ── BELEZA E PREPARAÇÃO ───────────────────────────────────────────────────
  { value: "cabeleireiro",           label: "Cabeleireiro(a)",             categoria: "beleza" },
  { value: "maquiador",              label: "Maquiador(a)",                categoria: "beleza" },
  { value: "barbeiro",               label: "Barbeiro",                    categoria: "beleza" },
  { value: "esteticista",            label: "Esteticista",                 categoria: "beleza" },
  { value: "personal_stylist",       label: "Personal Stylist",            categoria: "beleza" },

  // ── DECORAÇÃO E AMBIENTAÇÃO ───────────────────────────────────────────────
  { value: "decorador_eventos",      label: "Decorador de Eventos",        categoria: "decoracao" },
  { value: "designer_floral",        label: "Designer Floral",             categoria: "decoracao" },
  { value: "cenografo",              label: "Cenógrafo",                   categoria: "decoracao" },
  { value: "montador_decoracao",     label: "Montador de Decoração",       categoria: "decoracao" },
  { value: "iluminador_cenico",      label: "Iluminador Cênico",           categoria: "decoracao" },

  // ── ENTRETENIMENTO ────────────────────────────────────────────────────────
  { value: "dj",                     label: "DJ",                          categoria: "entretenimento" },
  { value: "musico",                 label: "Banda / Músico(a)",           categoria: "entretenimento" },
  { value: "cantor",                 label: "Cantor(a)",                   categoria: "entretenimento" },
  { value: "animador",               label: "Animador",                    categoria: "entretenimento" },
  { value: "performer",              label: "Performer / Dançarino",       categoria: "entretenimento" },
  { value: "humorista",              label: "Humorista",                   categoria: "entretenimento" },
  { value: "mc_apresentador",        label: "MC / Apresentador",           categoria: "entretenimento" },

  // ── MARKETING E COMUNICAÇÃO ───────────────────────────────────────────────
  { value: "criador_conteudo",       label: "Criador de Conteúdo",         categoria: "marketing_comunicacao" },
  { value: "assessor_imprensa",      label: "Assessor de Imprensa",        categoria: "marketing_comunicacao" },
  { value: "copywriter",             label: "Copywriter",                  categoria: "marketing_comunicacao" },
  { value: "especialista_mkt_digital", label: "Especialista em Mkt Digital", categoria: "marketing_comunicacao" },

  // ── COMERCIAL E RESERVAS ──────────────────────────────────────────────────
  { value: "executivo_vendas",       label: "Executivo de Vendas",         categoria: "comercial_reservas" },
  { value: "gerente_comercial",      label: "Gerente Comercial",           categoria: "comercial_reservas" },
  { value: "analista_reservas",      label: "Analista de Reservas",        categoria: "comercial_reservas" },
  { value: "revenue_manager",        label: "Revenue Manager",             categoria: "comercial_reservas" },
  { value: "orcamentista",           label: "Orçamentista",                categoria: "comercial_reservas" },

  // ── TECNOLOGIA E DIGITAL ──────────────────────────────────────────────────
  { value: "operador_delivery",      label: "Operador de Plataformas de Delivery", categoria: "tecnologia" },
  { value: "gestor_pdv",             label: "Gestor de Sistemas (PDV/PMS)", categoria: "tecnologia" },
  { value: "analista_ti",            label: "Analista de TI",              categoria: "tecnologia" },
  { value: "suporte_tecnico",        label: "Suporte Técnico",             categoria: "tecnologia" },
  { value: "analista_dados",         label: "Analista de Dados",           categoria: "tecnologia" },
  { value: "tecnico_streaming",      label: "Técnico de Streaming",        categoria: "tecnologia" },
  { value: "moderador_virtual",      label: "Moderador de Eventos Virtuais", categoria: "tecnologia" },

  // ── OUTROS ────────────────────────────────────────────────────────────────
  { value: "outro",                  label: "Outro",                       categoria: "outro" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Retorna todas as especialidades de uma categoria */
export function especialidadesPorCategoria(cat: string): Especialidade[] {
  return ESPECIALIDADES.filter((e) => e.categoria === cat);
}

/** Retorna todas as especialidades de uma subcategoria */
export function especialidadesPorSubcategoria(subcat: string): Especialidade[] {
  return ESPECIALIDADES.filter((e) => e.subcategoria === subcat);
}

/** Busca textual (label) — útil para autocomplete */
export function buscarEspecialidades(termo: string): Especialidade[] {
  const t = termo.toLowerCase();
  return ESPECIALIDADES.filter((e) => e.label.toLowerCase().includes(t));
}

/** Retorna o label a partir do value */
export function labelEspecialidade(value: string): string {
  return ESPECIALIDADES.find((e) => e.value === value)?.label ?? value;
}

/** Lista plana de { value, label } — compatível com <Select> e filtros */
export const ESPECIALIDADES_SELECT = ESPECIALIDADES.map(({ value, label }) => ({
  value,
  label,
}));

/** Especialidades agrupadas por categoria — útil para <Select> com grupos */
export const ESPECIALIDADES_AGRUPADAS = CATEGORIAS.map((cat) => ({
  categoria: cat,
  itens: especialidadesPorCategoria(cat.value),
})).filter((g) => g.itens.length > 0);
