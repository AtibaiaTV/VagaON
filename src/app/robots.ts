import type { MetadataRoute } from "next";
import { urlAbsoluta } from "@/lib/notificacoes/tipos";

/**
 * /robots.txt — libera o site público e fecha o que é de quem está logado
 * ou carrega token de acesso (currículo compartilhado, convite, SSO).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/painel",
        "/perfil",
        "/matches",
        "/descobrir",
        "/notificacoes",
        "/candidaturas",
        "/avaliacoes",
        "/profissionais",
        "/cv/",
        "/convite/",
        "/comecar",
        "/entrar",
        "/dev",
      ],
    },
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
