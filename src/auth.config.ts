import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the Auth.js config (no Prisma/bcrypt — those are
// Node-only). Used anywhere the Edge runtime might read the session; the
// full config with the Credentials provider lives in auth.ts.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  // We serve real traffic on several hostnames at once (the apex, app.*, and
  // every cafe's own subdomain) — without this, Auth.js ignores the actual
  // request Host and rebuilds every internal URL from NEXTAUTH_URL alone,
  // which is only ever correct for one of those hosts.
  trustHost: true,
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.cafeId = user.cafeId ?? null;
        token.phone = user.phone;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.cafeId = (token.cafeId as string | null) ?? null;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
