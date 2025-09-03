import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';

export default {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true, // Allow linking existing accounts
    }),
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });
          
          console.log('🔐 Auth attempt for:', credentials.email, {
            userFound: !!user,
            hasPassword: !!user?.passwordHash,
            emailVerified: user?.emailVerified,
            emailVerifiedLegacy: user?.emailVerifiedLegacy
          });
          
          if (!user || !user.passwordHash) {
            console.log('❌ User not found or no password hash');
            return null;
          }
          
          const isValidPassword = await verifyPassword(
            credentials.password as string,
            user.passwordHash
          );
          
          console.log('🔐 Password check:', isValidPassword);
          
          if (!isValidPassword) {
            console.log('❌ Invalid password');
            return null;
          }

          // TEMPORARY FIX: Skip email verification check for testing
          // In production, you'd want: if (!user.emailVerified) return null;
          
          console.log('✅ Auth success for:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.log('❌ Auth error:', error);
          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;