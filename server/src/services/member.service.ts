import { StoreRole } from "../generated/master-prisma/client";
import { masterPrisma } from "../utils/master-prisma";

export type MemberInfo = {
  id: string;
  accountId: string;
  role: StoreRole;
  name: string;
  username: string;
  email: string | null;
  createdAt: Date;
};

export type AccountSearchResult = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  currentStore: { name: string; role: StoreRole } | null;
};

export class MemberNotFoundError extends Error {
  constructor() {
    super("Anggota tidak ditemukan.");
  }
}

export class AccountNotFoundError extends Error {
  constructor() {
    super("Akun tidak ditemukan.");
  }
}

export class MemberAlreadyExistsError extends Error {
  constructor() {
    super("Akun sudah terdaftar sebagai anggota toko ini.");
  }
}

export class SelfRemoveError extends Error {
  constructor() {
    super("Tidak dapat menghapus diri sendiri.");
  }
}

export class OwnerRemoveError extends Error {
  constructor() {
    super("Tidak dapat menghapus pemilik toko.");
  }
}

export class LastOwnerRemoveError extends Error {
  constructor() {
    super("Tidak dapat menghapus satu-satunya pemilik toko.");
  }
}

export const listMembers = async (storeId: string): Promise<MemberInfo[]> => {
  const members = await masterPrisma.storeMember.findMany({
    where: { storeId },
    include: {
      account: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return members.map((m) => ({
    id: m.id,
    accountId: m.accountId,
    role: m.role,
    name: m.account.name,
    username: m.account.username,
    email: m.account.email,
    createdAt: m.createdAt,
  }));
};

export const addMember = async (
  storeId: string,
  accountId: string,
  role: StoreRole,
): Promise<MemberInfo> => {
  const account = await masterPrisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new AccountNotFoundError();
  }

  const existing = await masterPrisma.storeMember.findUnique({
    where: { accountId_storeId: { accountId, storeId } },
  });

  if (existing) {
    throw new MemberAlreadyExistsError();
  }

  const member = await masterPrisma.storeMember.create({
    data: { accountId, storeId, role },
    include: {
      account: {
        select: { id: true, username: true, name: true, email: true },
      },
    },
  });

  return {
    id: member.id,
    accountId: member.accountId,
    role: member.role,
    name: member.account.name,
    username: member.account.username,
    email: member.account.email,
    createdAt: member.createdAt,
  };
};

export const updateMemberRole = async (
  memberId: string,
  storeId: string,
  role: StoreRole,
): Promise<MemberInfo> => {
  const member = await masterPrisma.storeMember.findFirst({
    where: { id: memberId, storeId },
  });

  if (!member) {
    throw new MemberNotFoundError();
  }

  const updated = await masterPrisma.storeMember.update({
    where: { id: memberId },
    data: { role },
    include: {
      account: {
        select: { id: true, username: true, name: true, email: true },
      },
    },
  });

  return {
    id: updated.id,
    accountId: updated.accountId,
    role: updated.role,
    name: updated.account.name,
    username: updated.account.username,
    email: updated.account.email,
    createdAt: updated.createdAt,
  };
};

export const removeMember = async (
  memberId: string,
  storeId: string,
  requestingAccountId: string,
): Promise<void> => {
  const member = await masterPrisma.storeMember.findFirst({
    where: { id: memberId, storeId },
  });

  if (!member) {
    throw new MemberNotFoundError();
  }

  if (member.accountId === requestingAccountId) {
    throw new SelfRemoveError();
  }

  if (member.role === StoreRole.OWNER) {
    const ownerCount = await masterPrisma.storeMember.count({
      where: { storeId, role: StoreRole.OWNER },
    });

    if (ownerCount <= 1) {
      throw new LastOwnerRemoveError();
    }
  }

  await masterPrisma.storeMember.delete({
    where: { id: memberId },
  });
};

export const searchAccounts = async (
  query: string,
  excludeStoreId: string,
): Promise<AccountSearchResult[]> => {
  const accounts = await masterPrisma.account.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
      NOT: {
        memberships: {
          some: { storeId: excludeStoreId },
        },
      },
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      memberships: {
        where: { storeId: { not: excludeStoreId }, store: { isActive: true } },
        select: { role: true, store: { select: { name: true } } },
        take: 1,
      },
    },
    take: 20,
  });

  return accounts.map((a) => ({
    id: a.id,
    username: a.username,
    name: a.name,
    email: a.email,
    currentStore: a.memberships[0]
      ? { name: a.memberships[0].store.name, role: a.memberships[0].role }
      : null,
  }));
};
