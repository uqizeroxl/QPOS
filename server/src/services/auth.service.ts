import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { StoreRole } from "../generated/master-prisma/client";
import { UserRole } from "../generated/prisma/client";
import { appConfig } from "../config/app.config";
import { masterPrisma } from "../utils/master-prisma";

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  storeId: string;
};

type JwtPayload = {
  sub: string;
  storeId: string;
  role: StoreRole;
};

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Username atau password salah.");
  }
}

export class UserInactiveError extends Error {
  constructor() {
    super("User tidak aktif.");
  }
}

export class AuthTokenInvalidError extends Error {
  constructor() {
    super("Token tidak valid.");
  }
}

export class StoreMembershipRequiredError extends Error {
  constructor() {
    super("User belum terhubung ke toko.");
  }
}

export class StoreInactiveError extends Error {
  constructor() {
    super("Toko tidak aktif.");
  }
}

const mapStoreRoleToLegacyRole = (role: StoreRole) => {
  if (role === StoreRole.OWNER) {
    return UserRole.OWNER;
  }

  if (role === StoreRole.CASHIER) {
    return UserRole.CASHIER;
  }

  return UserRole.ADMIN;
};

const sanitizeUser = (user: AuthUser) => ({
  id: user.id,
  username: user.username,
  name: user.name,
  role: user.role,
  storeId: user.storeId
});

const signToken = (user: AuthUser, role: StoreRole) =>
  jwt.sign(
    {
      storeId: user.storeId,
      role
    },
    appConfig.jwtSecret,
    {
      subject: user.id,
      expiresIn: appConfig.jwtExpiresIn as jwt.SignOptions["expiresIn"]
    }
  );

export const login = async (username: string, password: string) => {
  const account = await masterPrisma.account.findUnique({
    where: {
      username
    },
    select: {
      id: true,
      username: true,
      name: true,
      passwordHash: true,
      isActive: true,
      memberships: {
        where: {
          store: {
            isActive: true
          }
        },
        include: {
          store: {
            select: {
              id: true,
              isActive: true
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!account) {
    throw new InvalidCredentialsError();
  }

  if (!account.isActive) {
    throw new UserInactiveError();
  }

  const isPasswordValid = await bcrypt.compare(password, account.passwordHash);

  if (!isPasswordValid) {
    throw new InvalidCredentialsError();
  }

  const membership = account.memberships[0];

  if (!membership) {
    throw new StoreMembershipRequiredError();
  }

  if (!membership.store.isActive) {
    throw new StoreInactiveError();
  }

  const authUser = sanitizeUser({
    id: account.id,
    username: account.username,
    name: account.name,
    role: mapStoreRoleToLegacyRole(membership.role),
    storeId: membership.storeId
  });

  return {
    token: signToken(authUser, membership.role),
    user: authUser
  };
};

export const verifyToken = async (token: string) => {
  try {
    const payload = jwt.verify(token, appConfig.jwtSecret) as JwtPayload;

    if (!payload.sub || !payload.storeId) {
      throw new AuthTokenInvalidError();
    }

    const membership = await masterPrisma.storeMember.findFirst({
      where: {
        accountId: payload.sub,
        storeId: payload.storeId,
        account: {
          isActive: true
        },
        store: {
          isActive: true
        }
      },
      select: {
        role: true,
        storeId: true,
        account: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    });

    if (!membership) {
      throw new AuthTokenInvalidError();
    }

    return sanitizeUser({
      id: membership.account.id,
      username: membership.account.username,
      name: membership.account.name,
      role: mapStoreRoleToLegacyRole(membership.role),
      storeId: membership.storeId
    });
  } catch (error) {
    if (error instanceof AuthTokenInvalidError) {
      throw error;
    }

    throw new AuthTokenInvalidError();
  }
};

export { UserRole };
