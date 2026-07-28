import { Loader2, Plus, Search, Trash2, UserRound, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import MainLayout from "../../layouts/MainLayout";
import StatCard from "../../components/ui/StatCard";
import { useToast } from "../../hooks/useToast";
import { memberService } from "../../services/memberService";
import type { StoreMember, AccountSearchResult, StoreRole } from "../../types/member";
import { ROLE_LABELS } from "../../types/member";

const ROLE_OPTIONS: StoreRole[] = ["OWNER", "MANAGER", "CASHIER"];

export default function RoleManagementPage() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<StoreMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const data = await memberService.listMembers();
      setMembers(data);
    } catch {
      showToast("Gagal memuat daftar anggota.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchMembers();
  }, []);

  const handleRoleChange = async (memberId: string, role: StoreRole) => {
    setUpdatingId(memberId);
    try {
      await memberService.updateMemberRole(memberId, role);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m)),
      );
      showToast("Peran berhasil diperbarui.");
    } catch {
      showToast("Gagal memperbarui peran.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId);
    try {
      await memberService.removeMember(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast("Anggota berhasil dihapus.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal menghapus anggota.",
        "error",
      );
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-medium text-blue-600">Manajemen Peran</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Anggota Toko
            </h1>
            <p className="mt-1 text-gray-500">
              Kelola anggota dan peran dalam toko Anda.
            </p>
          </div>
          <div className="flex min-w-44 flex-col gap-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-medium text-gray-500">Total Anggota</p>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {members.length}
              </h2>
              <div className="rounded-lg bg-blue-50 p-3 text-blue-700 ring-1 ring-blue-100">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>
        </Card>

        <Card as="section" className="p-5">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Daftar Anggota
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Tambah atau kelola anggota toko.
              </p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Tambah Anggota
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : members.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Belum ada anggota.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="pb-3 pr-4">Nama</th>
                    <th className="pb-3 pr-4">Username</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Peran</th>
                    <th className="pb-3 pr-4">Tanggal Ditambahkan</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                            <UserRound className="h-4 w-4 text-gray-500" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {member.username}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {member.email ?? "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            void handleRoleChange(
                              member.id,
                              e.target.value as StoreRole,
                            )
                          }
                          disabled={updatingId === member.id}
                          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="danger"
                          onClick={() => void handleRemove(member.id)}
                          disabled={removingId === member.id}
                        >
                          {removingId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="hidden md:inline">Hapus</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {isAddModalOpen ? (
        <AddMemberModal
          onClose={() => setIsAddModalOpen(false)}
          onAdded={() => {
            setIsAddModalOpen(false);
            void fetchMembers();
          }}
        />
      ) : null}
    </MainLayout>
  );
}

function AddMemberModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AccountSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<StoreRole>("CASHIER");
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await memberService.searchAccounts(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void doSearch(value), 300);
  };

  const handleAdd = async (accountId: string) => {
    setIsAdding(accountId);
    try {
      await memberService.addMember(accountId, selectedRole);
      showToast("Anggota berhasil ditambahkan.");
      onAdded();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal menambahkan anggota.",
        "error",
      );
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <Card className="w-full max-w-lg border-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Tambah Anggota
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Cari akun pengguna untuk ditambahkan ke toko ini.
            </p>
          </div>
          <Button variant="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Cari berdasarkan nama, username, atau email..."
              className="pl-10"
            />
          </div>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-gray-700">
              Peran yang akan diberikan
            </span>
            <select
              value={selectedRole}
              onChange={(e) =>
                setSelectedRole(e.target.value as StoreRole)
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : query.trim() && results.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              Tidak ada akun ditemukan.
            </p>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {results.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {account.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {account.username}
                      {account.email ? ` \u2022 ${account.email}` : ""}
                    </p>
                    {account.currentStore ? (
                      <p className="mt-0.5 text-xs text-blue-600">
                        Terdaftar di {account.currentStore.name} (
                        {ROLE_LABELS[account.currentStore.role]})
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-gray-400">
                        Belum terdaftar di toko mana pun
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => void handleAdd(account.id)}
                    disabled={isAdding === account.id}
                    className="ml-3 shrink-0"
                  >
                    {isAdding === account.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Tambah"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
