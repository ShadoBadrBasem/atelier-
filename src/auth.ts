import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        // Compare against a dummy hash when the user is missing to keep timing flat.
        const hash =
          user?.passwordHash ??
          "$2b$12$CwTycUXWue0Thq9StjUM0uJ8.f3cF8mV1Q1y6mGm8o0yJXkq6h0Wy";
        const ok = await bcrypt.compare(parsed.data.password, hash);
        if (!user || !ok) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
