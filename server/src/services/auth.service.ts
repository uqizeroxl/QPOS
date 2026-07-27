import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { StoreRole } from "../generated/master-prisma/client";
import { UserRole } from "../generated/prisma/client";
import { appConfig } from "../config/app.config";
import { masterPrisma } from "../utils/master-prisma";
import {
  verifyGoogleToken,
  verifyAppleToken,
  OAuthProviderNotConfiguredError,
} from "./oauth.service";

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

type StoreMembershipItem = {
  storeId: string;
  storeName: string;
  role: StoreRole;
};

export const listStores = async (accountId: string) => {
  const memberships = await masterPrisma.storeMember.findMany({
    where: {
      accountId,
      store: {
        isActive: true
      }
    },
    select: {
      role: true,
      storeId: true,
      store: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  return memberships.map((m) => ({
    id: m.storeId,
    name: m.store.name,
    role: m.role
  }));
};

export const switchStore = async (accountId: string, storeId: string) => {
  const membership = await masterPrisma.storeMember.findFirst({
    where: {
      accountId,
      storeId,
      account: { isActive: true },
      store: { isActive: true }
    },
    select: {
      role: true,
      storeId: true,
      store: {
        select: {
          name: true,
          isActive: true
        }
      },
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
    throw new StoreMembershipRequiredError();
  }

  if (!membership.store.isActive) {
    throw new StoreInactiveError();
  }

  const authUser = sanitizeUser({
    id: membership.account.id,
    username: membership.account.username,
    name: membership.account.name,
    role: mapStoreRoleToLegacyRole(membership.role),
    storeId: membership.storeId
  });

  return {
    token: signToken(authUser, membership.role),
    user: authUser
  };
};

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
              name: true,
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

  const stores = account.memberships.map((m) => ({
    id: m.store.id,
    name: m.store.name,
    role: m.role
  }));

  return {
    token: signToken(authUser, membership.role),
    user: authUser,
    stores
  };
};

const findOrCreateOAuthAccount = async (params: {
  providerId: string;
  providerField: "googleId" | "appleId";
  email: string;
  name: string;
  avatarUrl?: string;
}) => {
  const existingByProvider = await masterPrisma.account.findFirst({
    where: { [params.providerField]: params.providerId },
  });

  if (existingByProvider) {
    return existingByProvider;
  }

  if (params.email) {
    const existingByEmail = await masterPrisma.account.findUnique({
      where: { email: params.email },
    });

    if (existingByEmail) {
      return masterPrisma.account.update({
        where: { id: existingByEmail.id },
        data: { [params.providerField]: params.providerId },
      });
    }
  }

  const baseUsername = params.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_").slice(0, 60);
  let username = baseUsername;
  let suffix = 1;

  while (await masterPrisma.account.findUnique({ where: { username } })) {
    username = `${baseUsername}_${suffix}`;
    suffix++;
  }

  return masterPrisma.account.create({
    data: {
      username,
      name: params.name,
      email: params.email,
      [params.providerField]: params.providerId,
      avatarUrl: params.avatarUrl,
      passwordHash: "",
    },
  });
};

const loginWithOAuthAccount = async (account: { id: string; username: string; name: string }) => {
  const membership = await masterPrisma.storeMember.findFirst({
    where: {
      accountId: account.id,
      store: { isActive: true },
    },
    include: {
      store: { select: { id: true, name: true, isActive: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    return null;
  }

  if (!membership.store.isActive) {
    throw new StoreInactiveError();
  }

  const authUser = sanitizeUser({
    id: account.id,
    username: account.username,
    name: account.name,
    role: mapStoreRoleToLegacyRole(membership.role),
    storeId: membership.storeId,
  });

  const memberships = await masterPrisma.storeMember.findMany({
    where: { accountId: account.id, store: { isActive: true } },
    select: {
      role: true,
      storeId: true,
      store: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const stores = memberships.map((m) => ({
    id: m.storeId,
    name: m.store.name,
    role: m.role,
  }));

  return {
    token: signToken(authUser, membership.role),
    user: authUser,
    stores,
  };
};

const signRegistrationToken = (accountId: string) =>
  jwt.sign(
    { sub: accountId, purpose: "registration" },
    appConfig.jwtSecret,
    { expiresIn: "15m" }
  );

export const loginWithGoogle = async (accessToken: string) => {
  const googlePayload = await verifyGoogleToken(accessToken);

  const account = await findOrCreateOAuthAccount({
    providerId: googlePayload.sub,
    providerField: "googleId",
    email: googlePayload.email,
    name: googlePayload.name,
    avatarUrl: googlePayload.picture,
  });

  if (!account.isActive) {
    throw new UserInactiveError();
  }

  const result = await loginWithOAuthAccount(account);

  if (!result) {
    const registrationToken = signRegistrationToken(account.id);
    return {
      needsRegistration: true,
      registrationToken,
      user: {
        id: account.id,
        username: account.username,
        name: account.name,
      },
    };
  }

  return result;
};

export const loginWithApple = async (authorizationCode: string) => {
  const applePayload = await verifyAppleToken(authorizationCode);

  const account = await findOrCreateOAuthAccount({
    providerId: applePayload.sub,
    providerField: "appleId",
    email: applePayload.email,
    name: applePayload.email.split("@")[0],
  });

  if (!account.isActive) {
    throw new UserInactiveError();
  }

  const result = await loginWithOAuthAccount(account);

  if (!result) {
    const registrationToken = signRegistrationToken(account.id);
    return {
      needsRegistration: true,
      registrationToken,
      user: {
        id: account.id,
        username: account.username,
        name: account.name,
      },
    };
  }

  return result;
};

export const completeOAuthRegistration = async (params: {
  registrationToken: string;
  storeName: string;
}) => {
  const payload = jwt.verify(params.registrationToken, appConfig.jwtSecret) as {
    sub: string;
    purpose: string;
  };

  if (payload.purpose !== "registration") {
    throw new AuthTokenInvalidError();
  }

  const account = await masterPrisma.account.findUnique({
    where: { id: payload.sub },
  });

  if (!account || !account.isActive) {
    throw new AuthTokenInvalidError();
  }

  const existingMembership = await masterPrisma.storeMember.findFirst({
    where: { accountId: account.id },
  });

  if (existingMembership) {
    const authUser = sanitizeUser({
      id: account.id,
      username: account.username,
      name: account.name,
      role: mapStoreRoleToLegacyRole(existingMembership.role),
      storeId: existingMembership.storeId,
    });

    return {
      token: signToken(authUser, existingMembership.role),
      user: authUser,
    };
  }

  const store = await masterPrisma.store.create({
    data: {
      name: params.storeName,
    },
  });

  const membership = await masterPrisma.storeMember.create({
    data: {
      accountId: account.id,
      storeId: store.id,
      role: StoreRole.OWNER,
    },
  });

  const authUser = sanitizeUser({
    id: account.id,
    username: account.username,
    name: account.name,
    role: mapStoreRoleToLegacyRole(membership.role),
    storeId: membership.storeId,
  });

  return {
    token: signToken(authUser, membership.role),
    user: authUser,
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
