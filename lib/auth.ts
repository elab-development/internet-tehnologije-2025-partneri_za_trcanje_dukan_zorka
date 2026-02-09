import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export type AuthPayload = {
  id: number;
  email: string;
  ime: string;
  uloga: string;
};

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined.');
  }
  return secret;
};

export const signToken = (payload: AuthPayload) => {
  const secret = getSecret();
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  const secret = getSecret();
  return jwt.verify(token, secret) as AuthPayload;
};

export const getAuthPayloadFromCookies = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
};
