import type { NextAuthConfig } from "next-auth";

/**
 * Configuração leve do NextAuth — compatível com Edge Runtime.
 * Usada pelo middleware.ts para verificar sessão sem importar Node.js libs.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/entrar",
    error: "/entrar",
  },
  session: { strategy: "jwt" },
  providers: [], // providers completos ficam em auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.profileId = (user as any).profileId;
        token.status = (user as any).status;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "profissional" | "empresa" | "admin";
        session.user.profileId = token.profileId as string | null;
        session.user.status = token.status as "pendente" | "ativo" | "suspenso";
      }
      return session;
    },
  },
};
