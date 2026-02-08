import jwt from 'jsonwebtoken';

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
