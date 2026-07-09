import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@fluid/database';
import bcrypt from 'bcryptjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const result: any = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    ...(process.env.AUTH_GITHUB_ID
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
          }),
        ]
      : []),
    ...(process.env.AUTH_GOOGLE_ID
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    createUser: async ({ user }) => {
      if (!user.id) return;
      try {
        const { getOrCreatePersonalTeam } = await import('@/lib/team');
        await getOrCreatePersonalTeam(user.id);
      } catch (e) {
        console.error('Failed to create team for user:', e);
      }
    },
  },
});

export const handlers = result.handlers as {
  GET: (req: Request) => Promise<Response>;
  POST: (req: Request) => Promise<Response>;
};
export const signIn = result.signIn as (
  provider: string,
  options?: Record<string, unknown>,
) => Promise<void>;
export const signOut = result.signOut as () => Promise<void>;
export const auth = result.auth as () => Promise<import('next-auth').Session | null>;
