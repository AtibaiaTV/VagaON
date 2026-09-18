import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verificarTokenCrossPlatform } from "@/lib/cross-platform-auth";
import { garantirContaRedesa, sessaoDaConta, VALIDADE_TOKEN_SSO } from "@/lib/servicos/sso-redesa";

// Extend the session type to include role and profileId
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "profissional" | "empresa" | "admin";
      profileId: string | null;
      status: "pendente" | "ativo" | "suspenso";
    } & DefaultSession["user"];
  }

  interface User {
    role: "profissional" | "empresa" | "admin";
    profileId: string | null;
    status: "pendente" | "ativo" | "suspenso";
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Sem adapter — usamos JWT puro com Credentials provider.
  // O MongoDBAdapter + JWT gerava cookies duplicados causando 494 REQUEST_HEADER_TOO_LARGE.
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase(),
        });

        if (!user || !user.password) return null;

        const senhaValida = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!senhaValida) return null;

        if (user.status === "suspenso") return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          profileId: user.profileId?.toString() ?? null,
          status: user.status,
        };
      },
    }),
    // SSO da RedeSA: o backoffice já autenticou o dono e assina um token curto
    // com CROSS_PLATFORM_SECRET. Sem senha — ver src/lib/servicos/sso-redesa.ts.
    Credentials({
      id: "redesa",
      name: "RedeSA",
      credentials: { token: { label: "Token", type: "text" } },
      async authorize(credentials) {
        const token = credentials?.token;
        if (typeof token !== "string" || !token) return null;
        try {
          const payload = verificarTokenCrossPlatform(token, { maxAge: VALIDADE_TOKEN_SSO });
          return sessaoDaConta(await garantirContaRedesa(payload));
        } catch (err) {
          console.error("[SSO RedeSA] Recusado:", err instanceof Error ? err.message : err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.profileId = user.profileId;
        token.status = user.status;
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
  pages: {
    signIn: "/entrar",
    error: "/entrar",
  },
});
