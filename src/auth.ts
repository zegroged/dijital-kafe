import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { isEmailLike, loginSchema, normalizePhone } from "@/lib/validations/auth";

// Oturum/JWT'ye eklediğimiz alanlar için tip genişletmesi.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
  interface User {
    role?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/giris",
  },
  providers: [
    Credentials({
      credentials: {
        identifier: {},
        password: {},
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;
        // Kimlik çözümü: e-posta → telefon → kullanıcı adı.
        // (Kullanıcı adı yolu yalnızca @ içermeyen ve geçerli telefon OLMAYAN
        // girdilerde çalışır; o durum önceden zaten başarısız oluyordu.)
        const user = isEmailLike(identifier)
          ? await prisma.user.findUnique({
              where: { email: identifier.toLowerCase() },
            })
          : await (async () => {
              const phone = normalizePhone(identifier);
              if (phone) {
                return prisma.user.findUnique({ where: { phone } });
              }
              return prisma.user.findUnique({
                where: { username: identifier.toLowerCase() },
              });
            })();
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
