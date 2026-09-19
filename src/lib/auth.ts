import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
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

/** Google sign-in only exists once the two keys are filled in. */
export function googleEnabled() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel and most reverse proxies terminate TLS in front of the app, so the
  // forwarded host is the one to trust.
  trustHost: true,
  // Credentials sign-in requires JWT sessions. The adapter is still here so
  // Google accounts, saved addresses and order history land in the database.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  adapter: PrismaAdapter(prisma),
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        // A Google-only account has no password to compare against; saying so
        // is handled by the login page's message, not by a different result.
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
    ...(googleEnabled()
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Someone who registered with a password and later taps "Continue
            // with Google" should land in the same account rather than hitting
            // OAuthAccountNotLinked. Safe here only because Google verifies the
            // address it hands us; do not copy this to an unverified provider.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? undefined;
        // Written once per sign-in rather than on every request, so the admin
        // panel can show who is still active without a write on each page view.
        if (user.id) {
          await prisma.user
            .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
            .catch(() => undefined);
        }
      }
      // The adapter creates Google users without passing role back through the
      // provider, so read it once and keep it in the token from then on.
      if (token.id && !token.role) {
        const record = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        token.role = record?.role ?? "CUSTOMER";
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

/** The signed-in user, or null. Use in pages that adapt to sign-in state. */
export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Throws unless the caller is signed in. Use at the top of account mutations. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Please sign in to continue.");
  }
  return session.user;
}

/** Throws unless the caller is a signed-in admin. Use at the top of every admin mutation. */
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorised — admin access only.");
  }
  return session;
}
