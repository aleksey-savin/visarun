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
  roles: string[];
  permissions: string[];
  mustChangePassword: boolean;
}

type UserWithRoles = User & {
  roleAssignments: {
    role: {
      id: string;
      name: string;
      description: string | null;
      permissions: {
        permission: {
          id: string;
          code: string;
          description: string | null;
          category: string | null;
          createdAt: Date;
          updatedAt: Date;
        };
      }[];
    };
  }[];
};

// Function to generate access token
export function generateAccessToken(user: UserWithRoles): string {
  const permissions = new Set<string>();

  for (const assignment of user.roleAssignments) {
    for (const rolePermission of assignment.role.permissions) {
      permissions.add(rolePermission.permission.code);
    }
  }

  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    roles:
      user.roleAssignments.length > 0
        ? user.roleAssignments.map(assignment => assignment.role.name)
        : ['client'],
    permissions: Array.from(permissions),
    mustChangePassword: user.mustChangePassword,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Function to generate refresh token
export function generateRefreshToken(user: UserWithRoles): string {
  const permissions = new Set<string>();

  for (const assignment of user.roleAssignments) {
    for (const rolePermission of assignment.role.permissions) {
      permissions.add(rolePermission.permission.code);
    }
  }

  const payload: TokenPayload = {
    id: user.id, // Changed from userId to id
    email: user.email,
    roles:
      user.roleAssignments.length > 0
        ? user.roleAssignments.map(assignment => assignment.role.name)
        : ['client'],
    permissions: Array.from(permissions),
    mustChangePassword: user.mustChangePassword,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

// Function to verify token
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Ensure the payload has the expected structure
    if (
      !decoded.id ||
      !decoded.email ||
      !decoded.roles ||
      !decoded.permissions ||
      decoded.mustChangePassword === undefined
    ) {
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
export function generateToken(user: UserWithRoles): string {
  return generateAccessToken(user);
}
