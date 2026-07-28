import { apiService } from "./api/apiService";
import type { StoreMember, AccountSearchResult, StoreRole } from "../types/member";

export type { StoreMember, AccountSearchResult, StoreRole } from "../types/member";

export const memberService = {
  listMembers: async () => {
    const response = await apiService.get<StoreMember[]>("/members");
    return response.data;
  },

  addMember: async (accountId: string, role: StoreRole) => {
    const response = await apiService.post<StoreMember, { accountId: string; role: StoreRole }>(
      "/members",
      { accountId, role },
    );
    return response.data;
  },

  updateMemberRole: async (memberId: string, role: StoreRole) => {
    const response = await apiService.patch<StoreMember, { role: StoreRole }>(
      `/members/${memberId}`,
      { role },
    );
    return response.data;
  },

  removeMember: async (memberId: string) => {
    await apiService.delete(`/members/${memberId}`);
  },

  searchAccounts: async (query: string) => {
    const response = await apiService.get<AccountSearchResult[]>(
      `/members/search?q=${encodeURIComponent(query)}`,
    );
    return response.data;
  },
};
