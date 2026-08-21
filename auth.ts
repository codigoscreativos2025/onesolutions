import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // --- Session Management ---
        const { v4: uuidv4 } = require("uuid");
        const sessionToken = uuidv4();

        // Eliminar sesiones antiguas si hay más de 1 activa (para dejar espacio para la nueva, max 2)
        const activeSessions = await prisma.userSession.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        });

        if (activeSessions.length >= 2) {
          // Si hay 2 o más, borramos las más antiguas hasta dejar solo 1
          const sessionsToDelete = activeSessions.slice(0, activeSessions.length - 1);
          await prisma.userSession.deleteMany({
            where: { id: { in: sessionsToDelete.map((s) => s.id) } },
          });
        }

        await prisma.userSession.create({
          data: {
            userId: user.id,
            token: sessionToken,
          },
        });
        // --------------------------

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          closerId: user.closerId ?? undefined,
          locationValidationEnabled: user.locationValidationEnabled,
          sessionToken, // Pasa el token para guardarlo en JWT
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.closerId = user.closerId;
        token.locationValidationEnabled = user.locationValidationEnabled;
        token.sessionToken = (user as any).sessionToken;
      } else if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true, closerId: true, locationValidationEnabled: true },
        });
        if (dbUser) {
          token.id = String(dbUser.id);
          token.role = dbUser.role;
          token.closerId = dbUser.closerId ?? undefined;
          token.locationValidationEnabled = dbUser.locationValidationEnabled;
        }
      }

      // Check if session is still valid
      if (token.sessionToken) {
        const activeSession = await prisma.userSession.findUnique({
          where: { token: token.sessionToken as string },
        });
        if (!activeSession) {
          // If session is not found in DB (kicked out), invalidate JWT
          return {}; // Returning empty token effectively logs them out
        }
      }

      return token;
    },
    session({ session, token }) {
      if (!token.id) {
        // This handles the kicked out state
        session.user = null as any; 
        return session;
      }
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.closerId = token.closerId as number | undefined;
      session.user.locationValidationEnabled = token.locationValidationEnabled as boolean | undefined;
      (session as any).sessionToken = token.sessionToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
