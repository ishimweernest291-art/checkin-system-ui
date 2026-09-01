"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/DataTable";
import { RowActions } from "@/components/dashboard/RowActions";
import { BranchFormDialog } from "@/components/dashboard/BranchFormDialog";
import { PaginationFooter } from "@/components/dashboard/PaginationFooter";
import { adminFetch } from "../../../lib/api-admin";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { Branch, Page as ApiPage } from "../../../lib/types";

const PAGE_SIZE = 20;

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set("q", debouncedSearch);
    p.set("page", String(page));
    p.set("size", String(PAGE_SIZE));
    return p;
  }, [debouncedSearch, page]);

  const branches = useQuery({
    queryKey: ["branches", "page", params.toString()],
    queryFn: () =>
      adminFetch<ApiPage<Branch>>(`/admin/branches/page?${params}`),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/branches/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch deleted.");
    },
    onError: () => toast.error("Failed to delete branch."),
  });

  function startCreate() {
    setEditingBranch(null);
    setOpen(true);
  }

  function startEdit(branch: Branch) {
    setEditingBranch(branch);
    setOpen(true);
  }

  const columns: DataTableColumn<Branch>[] = [
    {
      key: "name",
      header: "Name",
      cell: (branch) => <span className="font-medium">{branch.name}</span>,
    },
    { key: "city", header: "City", cell: (branch) => branch.city ?? "—" },
    {
      key: "country",
      header: "Country",
      cell: (branch) => branch.country ?? "—",
    },
    {
      key: "address",
      header: "Address",
      cell: (branch) => branch.address ?? "—",
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-0",
      cell: (branch) => (
        <RowActions
          onEdit={() => startEdit(branch)}
          onDelete={() => remove.mutate(branch.id)}
          isDeleting={remove.isPending}
          deleteTitle={`Delete ${branch.name}?`}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Branches</h1>
        <Button size="lg" onClick={startCreate}>
          <Plus /> New branch
        </Button>
      </div>

      <BranchFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editingBranch}
      />

      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, city or country…"
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
          data={branches.data?.content ?? []}
          isLoading={branches.isLoading}
          getRowKey={(branch) => branch.id}
          emptyMessage="No branches found."
        />
      </Card>

      <PaginationFooter
        page={branches.data}
        onPrevious={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        itemLabel="branches"
      />
    </div>
  );
}
