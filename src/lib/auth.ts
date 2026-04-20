import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

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

const client = new MongoClient(process.env.MONGODB_URI!);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(client),
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
          image: user.image,
          role: user.role,
          profileId: user.profileId?.toString() ?? null,
          status: user.status,
        };
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
