import crypto from 'crypto';

import { prisma } from '@/lib/prisma';

export async function generateVerificationToken(email: string) {
  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return verificationToken;
}

export async function generatePasswordResetToken(email: string) {
  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: email,
      token: { startsWith: 'reset_' },
    },
  });

  const token = 'reset_' + crypto.randomUUID();
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

  const resetToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return resetToken;
}

export async function verifyToken(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return { valid: false, error: 'Invalid token' };
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token },
    });
    return { valid: false, error: 'Token expired' };
  }

  return { valid: true, identifier: verificationToken.identifier };
}
