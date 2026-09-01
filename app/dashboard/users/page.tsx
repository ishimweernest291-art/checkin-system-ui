"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { RowActions } from "@/components/dashboard/RowActions";
import { UserFormDialog } from "@/components/dashboard/UserFormDialog";
import { PaginationFooter } from "@/components/dashboard/PaginationFooter";
import { adminFetch } from "../../../lib/api-admin";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { AdminUser, Branch, Page as ApiPage } from "../../../lib/types";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set("q", debouncedSearch);
    p.set("page", String(page));
    p.set("size", String(PAGE_SIZE));
    return p;
  }, [debouncedSearch, page]);

  const users = useQuery({
    queryKey: ["users", params.toString()],
    queryFn: () => adminFetch<ApiPage<AdminUser>>(`/admin/users?${params}`),
  });

  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => adminFetch<Branch[]>("/admin/branches"),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted.");
    },
    onError: () => toast.error("Failed to delete user."),
  });

  const resendInvite = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/users/${id}/resend-invite`, { method: "POST" }),
    onSuccess: () => toast.success("Invite email re-sent."),
    onError: () => toast.error("Failed to re-send invite."),
  });

  function startCreate() {
    setEditingUser(null);
    setOpen(true);
  }

  function startEdit(user: AdminUser) {
    setEditingUser(user);
    setOpen(true);
  }

  const branchName = (id: string | null) =>
    branches.data?.find((b) => b.id === id)?.name ?? "—";

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "name",
      header: "Name",
      cell: (user) => <span className="font-medium">{user.fullName}</span>,
    },
    { key: "email", header: "Email", cell: (user) => user.email },
    { key: "role", header: "Role", cell: (user) => user.role },
    {
      key: "branch",
      header: "Branch",
      cell: (user) =>
        user.role === "BRANCH_MANAGER" ? branchName(user.branchId) : "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (user) => <StatusBadge active={user.active} />,
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-0",
      cell: (user) => (
        <RowActions
          onEdit={() => startEdit(user)}
          onDelete={() => remove.mutate(user.id)}
          isDeleting={remove.isPending}
          deleteTitle={`Delete ${user.email}?`}
          extra={
            <Button
              variant="outline"
              size="sm"
              disabled={resendInvite.isPending}
              onClick={() => resendInvite.mutate(user.id)}
            >
              <Mail /> Resend invite
            </Button>
          }
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <Button size="lg" onClick={startCreate}>
          <Plus /> New user
        </Button>
      </div>

      <UserFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editingUser}
      />

      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </div>

      <Card flat className="overflow-x-auto p-0">
        <DataTable
          columns={columns}
          data={users.data?.content ?? []}
          isLoading={users.isLoading}
          getRowKey={(user) => user.id}
          emptyMessage="No users found."
        />
      </Card>

      <PaginationFooter
        page={users.data}
        onPrevious={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        itemLabel="users"
      />
    </div>
  );
}
