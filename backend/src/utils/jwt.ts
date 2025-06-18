import jwt from 'jsonwebtoken';
import { type User } from '@prisma/client';

// Load secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Type for token payload
export interface TokenPayload {
  id: string; // Changed from userId to id to match your auth middleware
  email: string;
  role: string;
}

type UserWithRole = User & {
  roleModel?: {
    name: string;
  } | null;
};

// Function to generate access token
export function generateAccessToken(user: UserWithRole): string {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.roleModel?.name || 'client',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Function to generate refresh token
export function generateRefreshToken(user: UserWithRole): string {
  const payload: TokenPayload = {
    id: user.id, // Changed from userId to id
    email: user.email,
    role: user.roleModel?.name || 'client',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

// Function to verify token
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Ensure the payload has the expected structure
    if (!decoded.id || !decoded.email || !decoded.role) {
      console.error('Invalid token payload structure');
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Generate token for both access and signin (for backward compatibility)
export function generateToken(user: User): string {
  return generateAccessToken(user);
}
