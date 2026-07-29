import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { InvitationStatus, StoreRole } from "../generated/master-prisma/client";
import { UserRole } from "../generated/prisma/client";
import { appConfig } from "../config/app.config";
import { masterPrisma } from "../utils/master-prisma";
import {
  verifyGoogleToken,
  verifyAppleToken,
  verifyTikTokToken,
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
  tokenVersion: number;
};

type RefreshJwtPayload = {
  sub: string;
  storeId: string;
  type: "refresh";
  tokenVersion: number;
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

const signAccessToken = (user: AuthUser, role: StoreRole, tokenVersion: number) =>
  jwt.sign(
    {
      storeId: user.storeId,
      role,
      tokenVersion
    },
    appConfig.jwtSecret,
    {
      subject: user.id,
      expiresIn: "15m"
    }
  );

const signRefreshToken = (user: AuthUser, tokenVersion: number) =>
  jwt.sign(
    {
      sub: user.id,
      storeId: user.storeId,
      type: "refresh",
      tokenVersion
    },
    appConfig.jwtSecret,
    {
      expiresIn: "7d"
    }
  );

const issueTokens = async (user: AuthUser, role: StoreRole) => {
  const account = await masterPrisma.account.findUnique({
    where: { id: user.id },
    select: { tokenVersion: true }
  });

  const tokenVersion = account?.tokenVersion ?? 0;

  return {
    token: signAccessToken(user, role, tokenVersion),
    refreshToken: signRefreshToken(user, tokenVersion),
    user
  };
};

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
      createdAt: true,
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
    role: m.role,
    registeredAt: m.createdAt
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

  return issueTokens(authUser, membership.role);
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

  const tokens = await issueTokens(authUser, membership.role);

  return {
    ...tokens,
    stores
  };
};

const findOrCreateOAuthAccount = async (params: {
  providerId: string;
  providerField: "googleId" | "appleId" | "tiktokId";
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

  const tokens = await issueTokens(authUser, membership.role);

  return {
    ...tokens,
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

export const loginWithTikTok = async (authorizationCode: string) => {
  const tiktokPayload = await verifyTikTokToken(authorizationCode);

  const account = await findOrCreateOAuthAccount({
    providerId: tiktokPayload.sub,
    providerField: "tiktokId",
    email: tiktokPayload.email,
    name: tiktokPayload.name,
    avatarUrl: tiktokPayload.picture,
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

    return issueTokens(authUser, existingMembership.role);
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

  return issueTokens(authUser, membership.role);
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
            name: true,
            tokenVersion: true
          }
        }
      }
    });

    if (!membership) {
      throw new AuthTokenInvalidError();
    }

    if (membership.account.tokenVersion !== payload.tokenVersion) {
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

export const refreshToken = async (refreshTokenValue: string) => {
  try {
    const payload = jwt.verify(refreshTokenValue, appConfig.jwtSecret) as RefreshJwtPayload;

    if (payload.type !== "refresh" || !payload.sub || !payload.storeId) {
      throw new AuthTokenInvalidError();
    }

    const account = await masterPrisma.account.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        name: true,
        isActive: true,
        tokenVersion: true,
        memberships: {
          where: {
            storeId: payload.storeId,
            store: { isActive: true }
          },
          select: {
            role: true,
            storeId: true
          }
        }
      }
    });

    if (!account || !account.isActive || account.memberships.length === 0) {
      throw new AuthTokenInvalidError();
    }

    if (account.tokenVersion !== payload.tokenVersion) {
      throw new AuthTokenInvalidError();
    }

    const membership = account.memberships[0];

    const authUser = sanitizeUser({
      id: account.id,
      username: account.username,
      name: account.name,
      role: mapStoreRoleToLegacyRole(membership.role),
      storeId: membership.storeId
    });

    return issueTokens(authUser, membership.role);
  } catch (error) {
    if (error instanceof AuthTokenInvalidError) {
      throw error;
    }

    throw new AuthTokenInvalidError();
  }
};

export type AccountInfo = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  googleId: string | null;
  tiktokId: string | null;
};

export const getAccountInfo = async (accountId: string): Promise<AccountInfo> => {
  const account = await masterPrisma.account.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      googleId: true,
      tiktokId: true
    }
  });

  if (!account) {
    throw new AuthTokenInvalidError();
  }

  return account;
};

export class GoogleAlreadyBoundError extends Error {
  constructor() {
    super("Akun Google sudah terhubung ke pengguna lain.");
  }
}

export class TikTokAlreadyBoundError extends Error {
  constructor() {
    super("Akun TikTok sudah terhubung ke pengguna lain.");
  }
}

export const bindGoogleAccount = async (
  accountId: string,
  accessToken: string
) => {
  const googlePayload = await verifyGoogleToken(accessToken);

  const existingByGoogleId = await masterPrisma.account.findFirst({
    where: { googleId: googlePayload.sub, id: { not: accountId } }
  });

  if (existingByGoogleId) {
    throw new GoogleAlreadyBoundError();
  }

  await masterPrisma.account.update({
    where: { id: accountId },
    data: {
      googleId: googlePayload.sub,
      email: googlePayload.email
    }
  });

  return { email: googlePayload.email };
};

export const bindTikTokAccount = async (
  accountId: string,
  authorizationCode: string
) => {
  const tiktokPayload = await verifyTikTokToken(authorizationCode);

  const existingByTikTokId = await masterPrisma.account.findFirst({
    where: { tiktokId: tiktokPayload.sub, id: { not: accountId } }
  });

  if (existingByTikTokId) {
    throw new TikTokAlreadyBoundError();
  }

  await masterPrisma.account.update({
    where: { id: accountId },
    data: {
      tiktokId: tiktokPayload.sub,
      email: tiktokPayload.email || undefined,
    }
  });

  return { name: tiktokPayload.name };
};

export const logout = async (accountId: string) => {
  await masterPrisma.account.update({
    where: { id: accountId },
    data: {
      tokenVersion: { increment: 1 }
    }
  });
};

export class InvitationNotFoundError extends Error {
  constructor() {
    super("Undangan tidak ditemukan atau sudah kadaluwarsa.");
  }
}

export class InvitationEmailMismatchError extends Error {
  constructor() {
    super("Email akun Anda tidak sesuai dengan undangan.");
  }
}

export const acceptOwnerInvitation = async (
  token: string,
  accountId: string
) => {
  const invitation = await masterPrisma.storeInvitation.findUnique({
    where: { token }
  });

  if (!invitation || invitation.status !== InvitationStatus.PENDING) {
    throw new InvitationNotFoundError();
  }

  if (invitation.expiresAt < new Date()) {
    await masterPrisma.storeInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED }
    });
    throw new InvitationNotFoundError();
  }

  const account = await masterPrisma.account.findUnique({
    where: { id: accountId },
    select: { email: true, googleId: true }
  });

  if (!account) {
    throw new InvitationNotFoundError();
  }

  if (account.email !== invitation.email) {
    throw new InvitationEmailMismatchError();
  }

  const currentOwnerMembership = await masterPrisma.storeMember.findFirst({
    where: { storeId: invitation.storeId, role: StoreRole.OWNER },
    select: { id: true }
  });

  await masterPrisma.$transaction(async (tx) => {
    const targetMembership = await tx.storeMember.findUnique({
      where: {
        accountId_storeId: {
          accountId,
          storeId: invitation.storeId
        }
      },
      select: { id: true }
    });

    if (targetMembership) {
      await tx.storeMember.update({
        where: { id: targetMembership.id },
        data: { role: StoreRole.OWNER }
      });
    } else {
      await tx.storeMember.create({
        data: {
          accountId,
          storeId: invitation.storeId,
          role: StoreRole.OWNER
        }
      });
    }

    if (currentOwnerMembership) {
      await tx.storeMember.update({
        where: { id: currentOwnerMembership.id },
        data: { role: StoreRole.MANAGER }
      });
    }

    await tx.storeInvitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED }
    });
  });

  await masterPrisma.account.update({
    where: { id: accountId },
    data: { tokenVersion: { increment: 1 } }
  });
};

export { UserRole };
