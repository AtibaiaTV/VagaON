/**
 * Inventário das variáveis de ambiente do VagaON, para o painel
 * /admin/diagnostico e para o aviso do Dashboard.
 *
 * Regra da casa: nenhum valor secreto sai daqui. Cada variável só reporta se
 * está definida; o valor em si só aparece quando `mostrarValor` está ligado,
 * e isso só acontece em variáveis públicas (NEXT_PUBLIC_*), que o navegador
 * já recebe de qualquer jeito.
 *
 * As variáveis NEXT_PUBLIC_* são substituídas no build, então cada uma é lida
 * por um `process.env.NOME` literal — acesso dinâmico por índice não funciona.
 */

export type Severidade = "essencial" | "importante" | "opcional";

export interface VariavelAmbiente {
  nome: string;
  grupo: string;
  severidade: Severidade;
  /** O que a variável liga. */
  descricao: string;
  /** O que acontece sem ela. É o texto que mais importa no painel. */
  semEla: string;
  /** Onde conseguir o valor. */
  comoObter: string;
  /** Leitura literal (obrigatória por causa do inline das NEXT_PUBLIC_*). */
  ler: () => string | undefined;
  /** Mostra o valor na tela. Só para variáveis públicas. */
  mostrarValor?: boolean;
  /** Aviso mesmo com a variável definida (ex.: localhost em produção). */
  alerta?: (valor: string) => string | null;
}

export type EstadoVariavel = "ok" | "alerta" | "ausente";

export interface VariavelAvaliada extends VariavelAmbiente {
  estado: EstadoVariavel;
  valor: string | null;
  mensagemAlerta: string | null;
}

function ehProducao(): boolean {
  return process.env.NODE_ENV === "production";
}

export const VARIAVEIS: VariavelAmbiente[] = [
  // ─── Essenciais ───────────────────────────────────────────────────────────
  {
    nome: "MONGODB_URI",
    grupo: "Essenciais",
    severidade: "essencial",
    descricao: "Conexão com o MongoDB Atlas.",
    semEla: "O site não sobe: toda página que lê dados quebra.",
    comoObter: "Atlas → Database → Connect → Drivers.",
    ler: () => process.env.MONGODB_URI,
  },
  {
    nome: "AUTH_SECRET",
    grupo: "Essenciais",
    severidade: "essencial",
    descricao: "Assina as sessões do NextAuth.",
    semEla: "Ninguém consegue entrar; o login falha na produção.",
    comoObter: "openssl rand -base64 32",
    ler: () => process.env.AUTH_SECRET,
  },
  {
    nome: "NEXT_PUBLIC_APP_URL",
    grupo: "Essenciais",
    severidade: "essencial",
    descricao: "Domínio público do site. Base dos QR Codes, links e e-mails.",
    semEla:
      "QR Code, cartaz e links de notificação saem apontando para http://localhost:3000 — impressos assim, não funcionam para ninguém.",
    comoObter: 'O domínio real, com https e sem barra no fim. Ex.: "https://vagaon.com.br".',
    ler: () => process.env.NEXT_PUBLIC_APP_URL,
    mostrarValor: true,
    alerta: (v) =>
      /localhost|127\.0\.0\.1/.test(v) && ehProducao()
        ? "Aponta para localhost em produção: QR Codes e links de e-mail ficam inúteis."
        : null,
  },

  // ─── Uploads ──────────────────────────────────────────────────────────────
  {
    nome: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    grupo: "Uploads (Cloudinary)",
    severidade: "importante",
    descricao: "Nome da conta Cloudinary onde ficam fotos, logos e vídeos.",
    semEla: "Foto de perfil, logo da empresa e vídeo de apresentação não sobem.",
    comoObter: "Cloudinary → Dashboard → Cloud name.",
    ler: () => process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    mostrarValor: true,
  },
  {
    nome: "CLOUDINARY_API_KEY",
    grupo: "Uploads (Cloudinary)",
    severidade: "importante",
    descricao: "Chave da API do Cloudinary (assina os envios).",
    semEla: "Os envios de imagem e vídeo falham.",
    comoObter: "Cloudinary → Dashboard → API Key.",
    ler: () => process.env.CLOUDINARY_API_KEY,
  },
  {
    nome: "CLOUDINARY_API_SECRET",
    grupo: "Uploads (Cloudinary)",
    severidade: "importante",
    descricao: "Segredo da API do Cloudinary.",
    semEla: "Os envios de imagem e vídeo falham, e apagar arquivo antigo também.",
    comoObter: "Cloudinary → Dashboard → API Secret.",
    ler: () => process.env.CLOUDINARY_API_SECRET,
  },

  // ─── IA ───────────────────────────────────────────────────────────────────
  {
    nome: "ANTHROPIC_API_KEY",
    grupo: "IA (Claude)",
    severidade: "importante",
    descricao: "Currículo → perfil, frase → vaga e resumo de triagem.",
    semEla:
      'Os painéis "Preencher com IA" ficam ocultos e as rotas de IA respondem 503. O resto do site funciona normalmente.',
    comoObter: "console.anthropic.com → API Keys.",
    ler: () => process.env.ANTHROPIC_API_KEY,
  },

  // ─── Cron ─────────────────────────────────────────────────────────────────
  {
    nome: "CRON_SECRET",
    grupo: "Tarefas automáticas (cron)",
    severidade: "importante",
    descricao: "Autoriza os dois crons da Vercel: lembrete de entrevista e manutenção diária.",
    semEla:
      "Os crons respondem 401 e nada roda: vaga vencida não expira, perfil inativo não some, convite de avaliação não sai.",
    comoObter: "openssl rand -hex 32 — o mesmo valor na Vercel, que o envia como Bearer.",
    ler: () => process.env.CRON_SECRET,
  },

  // ─── Notificações ─────────────────────────────────────────────────────────
  {
    nome: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    grupo: "Notificações",
    severidade: "opcional",
    descricao: "Chave pública VAPID do push (PWA).",
    semEla: "Sem push no celular. O sino dentro do site continua funcionando.",
    comoObter: "npx web-push generate-vapid-keys",
    ler: () => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    mostrarValor: true,
  },
  {
    nome: "VAPID_PRIVATE_KEY",
    grupo: "Notificações",
    severidade: "opcional",
    descricao: "Chave privada VAPID do push.",
    semEla: "Sem push no celular.",
    comoObter: "Sai junto da pública, no mesmo comando.",
    ler: () => process.env.VAPID_PRIVATE_KEY,
  },
  {
    nome: "VAPID_SUBJECT",
    grupo: "Notificações",
    severidade: "opcional",
    descricao: "Contato do remetente do push (mailto:).",
    semEla: 'Usa o padrão "mailto:contato@vagaon.app".',
    comoObter: "Um e-mail seu, no formato mailto:voce@dominio.com.br.",
    ler: () => process.env.VAPID_SUBJECT,
    mostrarValor: true,
  },
  {
    nome: "RESEND_API_KEY",
    grupo: "Notificações",
    severidade: "opcional",
    descricao: "Envio de e-mail pelo Resend.",
    semEla: "Nenhum aviso por e-mail sai.",
    comoObter: "resend.com → API Keys.",
    ler: () => process.env.RESEND_API_KEY,
  },
  {
    nome: "EMAIL_REMETENTE",
    grupo: "Notificações",
    severidade: "opcional",
    descricao: "Remetente dos e-mails.",
    semEla:
      "Usa onboarding@resend.dev, que só entrega no e-mail da própria conta Resend — bom para testar, ruim para valer.",
    comoObter: 'Depois de verificar o domínio no Resend: "VagaON <avisos@seudominio.com.br>".',
    ler: () => process.env.EMAIL_REMETENTE,
    mostrarValor: true,
  },
  {
    nome: "WHATSAPP_TOKEN",
    grupo: "Notificações",
    severidade: "opcional",
    descricao: "Token da Cloud API da Meta.",
    semEla: "Nenhum aviso por WhatsApp sai.",
    comoObter: "developers.facebook.com → seu app → WhatsApp → token permanente.",
    ler: () => process.env.WHATSAPP_TOKEN,
  },
  {
    nome: "WHATSAPP_PHONE_NUMBER_ID",
    grupo: "Notificações",
    severidade: "opcional",
    descricao: "ID do número remetente no WhatsApp.",
    semEla: "Nenhum aviso por WhatsApp sai.",
    comoObter: "No mesmo painel do token, em API Setup.",
    ler: () => process.env.WHATSAPP_PHONE_NUMBER_ID,
    mostrarValor: true,
  },
  {
    nome: "WHATSAPP_TEMPLATE",
    grupo: "Notificações",
    severidade: "opcional",
    descricao: "Nome do template aprovado (ver docs/NOTIFICACOES.md).",
    semEla: 'Usa "vagaon_aviso".',
    comoObter: "O nome exato cadastrado no Gerenciador do WhatsApp.",
    ler: () => process.env.WHATSAPP_TEMPLATE,
    mostrarValor: true,
  },

  // ─── Integrações e interruptores ──────────────────────────────────────────
  {
    nome: "CROSS_PLATFORM_SECRET",
    grupo: "Integração RedeSA",
    severidade: "importante",
    descricao: "Assina o SSO do backoffice da RedeSA, a API de vagas e o webhook de talentos.",
    semEla:
      "O botão \"Gerenciar vagas\" no backoffice da RedeSA não entra no VagaON, e a RedeSA não consegue publicar vagas aqui. Ver docs/INTEGRACAO-REDESA.md.",
    comoObter: "O mesmo segredo combinado com a RedeSA, nos dois lados.",
    ler: () => process.env.CROSS_PLATFORM_SECRET,
  },
  {
    nome: "PLANOS_ATIVOS",
    grupo: "Planos",
    severidade: "opcional",
    descricao: 'Interruptor da cobrança. Só "1" liga os limites do plano Grátis.',
    semEla: "Toda empresa é tratada como Pro e nada é limitado — que é o estado desejado hoje.",
    comoObter: 'Deixe vazio até decidir cobrar. Antes de ligar: node src/scripts/conceder-trial.mjs --dias 60 --dry',
    ler: () => process.env.PLANOS_ATIVOS,
    mostrarValor: true,
    alerta: (v) =>
      v === "1"
        ? "Cobrança LIGADA: empresas sem assinatura nem trial caem nos limites do plano Grátis."
        : null,
  },
];

export function avaliar(v: VariavelAmbiente): VariavelAvaliada {
  const bruto = v.ler();
  const valor = bruto && bruto.trim() ? bruto.trim() : null;
  const mensagemAlerta = valor && v.alerta ? v.alerta(valor) : null;
  return {
    ...v,
    valor,
    mensagemAlerta,
    estado: !valor ? "ausente" : mensagemAlerta ? "alerta" : "ok",
  };
}

export interface ResumoDiagnostico {
  variaveis: VariavelAvaliada[];
  grupos: { nome: string; variaveis: VariavelAvaliada[] }[];
  /** Ausentes ou com alerta, entre as essenciais e importantes. */
  pendencias: VariavelAvaliada[];
  ok: number;
  total: number;
}

export function diagnosticar(): ResumoDiagnostico {
  const variaveis = VARIAVEIS.map(avaliar);
  const grupos: ResumoDiagnostico["grupos"] = [];
  for (const v of variaveis) {
    const g = grupos.find((x) => x.nome === v.grupo);
    if (g) g.variaveis.push(v);
    else grupos.push({ nome: v.grupo, variaveis: [v] });
  }
  const pendencias = variaveis.filter(
    (v) => v.estado !== "ok" && (v.severidade !== "opcional" || v.mensagemAlerta)
  );
  return {
    variaveis,
    grupos,
    pendencias,
    ok: variaveis.filter((v) => v.estado === "ok").length,
    total: variaveis.length,
  };
}
