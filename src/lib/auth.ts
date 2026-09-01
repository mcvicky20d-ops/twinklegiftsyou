import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "ADMIN" | "CUSTOMER" } & DefaultSession["user"];
  }
  interface User {
    role?: "ADMIN" | "CUSTOMER";
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel and most reverse proxies terminate TLS in front of the app, so the
  // forwarded host is the one to trust.
  trustHost: true,
  // Credentials sign-in requires JWT sessions; it keeps the whole thing free of a session table.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = (token.role as "ADMIN" | "CUSTOMER") ?? "CUSTOMER";
      return session;
    },
  },
});

/** Throws unless the caller is a signed-in admin. Use at the top of every admin mutation. */
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorised — admin access only.");
  }
  return session;
}
