import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
import Notificacao from "@/models/Notificacao";
import Profissional from "@/models/Profissional";
import PushSubscription from "@/models/PushSubscription";
import User from "@/models/User";
import { usuariosDaEmpresa } from "@/lib/servicos/equipe";
import { emailConfigurado, enviarEmail } from "./canais/email";
import { enviarPush, pushConfigurado } from "./canais/push";
import { enviarWhatsApp, whatsappConfigurado } from "./canais/whatsapp";
import type { AlvoNotificacao, Destinatario, MensagemNotificacao, ResultadoEnvio } from "./tipos";

export * from "./tipos";
export * from "./mensagens";

/**
 * Orquestrador. Grava a notificação in-app (sempre) e dispara, em paralelo,
 * os canais configurados e permitidos pelo usuário. Nunca lança: uma falha
 * de e-mail não pode derrubar um swipe. Tudo é aguardado — na Vercel a
 * função encerra assim que a resposta sai.
 */

async function montarDestinatario(
  userId: string,
  extras: { nome?: string; telefone?: string | null }
): Promise<Destinatario | null> {
  const [user, inscricoes] = await Promise.all([
    User.findById(userId).select("name email status notificacoes").lean(),
    PushSubscription.find({ userId }).select("endpoint keys").lean(),
  ]);
  if (!user || user.status === "suspenso") return null;

  return {
    userId: String(user._id),
    nome: extras.nome || user.name,
    email: user.email || null,
    telefone: extras.telefone ?? null,
    preferencias: {
      email: user.notificacoes?.email ?? true,
      whatsapp: user.notificacoes?.whatsapp ?? true,
      push: user.notificacoes?.push ?? true,
    },
    pushSubscriptions: inscricoes.map((i) => ({ endpoint: i.endpoint, keys: i.keys })),
  };
}

/**
 * Quem recebe. Profissional e user: uma pessoa. Empresa: a equipe inteira
 * (dono + gerentes) — quem cuida do funil precisa saber da candidatura,
 * não só quem criou a conta. O telefone da empresa vai só para o dono,
 * para o WhatsApp não bombardear o mesmo número várias vezes.
 */
async function resolverDestinatarios(alvo: AlvoNotificacao): Promise<Destinatario[]> {
  await connectDB();

  if (alvo.tipo === "profissional") {
    const p = await Profissional.findById(alvo.perfilId).select("userId nomeCompleto telefone").lean();
    if (!p) return [];
    const d = await montarDestinatario(String(p.userId), { nome: p.nomeCompleto, telefone: p.telefone || null });
    return d ? [d] : [];
  }

  if (alvo.tipo === "empresa") {
    const e = await Empresa.findById(alvo.perfilId).select("userId membros nomeFantasia telefone").lean();
    if (!e) return [];
    const ids = usuariosDaEmpresa(e);
    const lista = await Promise.all(
      ids.map((id, i) =>
        montarDestinatario(id, i === 0 ? { nome: e.nomeFantasia, telefone: e.telefone || null } : {})
      )
    );
    return lista.filter((d): d is Destinatario => d !== null);
  }

  const d = await montarDestinatario(String(alvo.userId), {});
  return d ? [d] : [];
}

export async function notificar(alvo: AlvoNotificacao, msg: MensagemNotificacao): Promise<ResultadoEnvio[]> {
  try {
    const destinatarios = await resolverDestinatarios(alvo);
    const tudo = await Promise.all(destinatarios.map((d) => notificarUm(d, msg)));
    return tudo.flat();
  } catch (err) {
    console.error("[notificacoes] erro inesperado:", err);
    return [];
  }
}

async function notificarUm(d: Destinatario, msg: MensagemNotificacao): Promise<ResultadoEnvio[]> {
  try {
    const envios: Promise<ResultadoEnvio>[] = [
      Notificacao.create({
        userId: d.userId,
        categoria: msg.categoria,
        titulo: msg.titulo,
        corpo: msg.corpo,
        url: msg.url,
      }).then(
        () => ({ canal: "app" as const, ok: true }),
        (e) => ({ canal: "app" as const, ok: false, detalhe: String(e) })
      ),
    ];

    if (d.preferencias.push && pushConfigurado()) {
      for (const inscricao of d.pushSubscriptions) {
        envios.push(
          enviarPush(inscricao, msg).then(async (r) => {
            if (r.expirada) await PushSubscription.deleteOne({ endpoint: inscricao.endpoint }).catch(() => {});
            return r;
          })
        );
      }
    }

    if (d.preferencias.email && d.email && emailConfigurado()) {
      envios.push(enviarEmail(d.email, d.nome, msg));
    }

    if (d.preferencias.whatsapp && d.telefone && whatsappConfigurado()) {
      envios.push(enviarWhatsApp(d.telefone, d.nome, msg, d.userId));
    }

    const resultados = await Promise.all(
      envios.map((p) => p.catch((e): ResultadoEnvio => ({ canal: "app", ok: false, detalhe: String(e) })))
    );

    for (const r of resultados) {
      if (!r.ok && r.detalhe !== "não configurado") {
        console.warn(`[notificacoes] ${r.canal} falhou para ${d.userId}: ${r.detalhe}`);
      }
    }
    return resultados;
  } catch (err) {
    console.error("[notificacoes] erro ao notificar", d.userId, err);
    return [];
  }
}

/** Contagem para o sino do Navbar. */
export async function contarNaoLidas(userId: string): Promise<number> {
  await connectDB();
  return Notificacao.countDocuments({ userId, lidaEm: null });
}
