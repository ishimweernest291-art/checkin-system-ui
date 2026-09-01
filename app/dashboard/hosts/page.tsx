"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/simple-select";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { RowActions } from "@/components/dashboard/RowActions";
import { HostFormDialog } from "@/components/dashboard/HostFormDialog";
import { BranchFilter } from "../../../components/dashboard/BranchFilter";
import { PaginationFooter } from "@/components/dashboard/PaginationFooter";
import { adminFetch } from "../../../lib/api-admin";
import { useSession } from "../../../lib/use-session";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { Host, Page as ApiPage } from "../../../lib/types";

const PAGE_SIZE = 20;

export default function HostsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [branchFilter, setBranchFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (branchFilter) p.set("branchId", branchFilter);
    if (activeFilter) p.set("active", activeFilter);
    if (debouncedSearch) p.set("q", debouncedSearch);
    p.set("page", String(page));
    p.set("size", String(PAGE_SIZE));
    return p;
  }, [branchFilter, activeFilter, debouncedSearch, page]);

  const hosts = useQuery({
    queryKey: ["hosts", params.toString()],
    queryFn: () => adminFetch<ApiPage<Host>>(`/admin/hosts?${params}`),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/admin/hosts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosts"] });
      toast.success("Host deleted.");
    },
    onError: () => toast.error("Failed to delete host."),
  });

  function startCreate() {
    setEditingHost(null);
    setOpen(true);
  }

  function startEdit(host: Host) {
    setEditingHost(host);
    setOpen(true);
  }

  const columns: DataTableColumn<Host>[] = [
    {
      key: "name",
      header: "Name",
      cell: (host) => <span className="font-medium">{host.fullName}</span>,
    },
    {
      key: "department",
      header: "Department",
      cell: (host) => host.department ?? "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (host) => <StatusBadge active={host.active} />,
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-0",
      cell: (host) => (
        <RowActions
          onEdit={() => startEdit(host)}
          onDelete={() => remove.mutate(host.id)}
          isDeleting={remove.isPending}
          deleteTitle={`Delete ${host.fullName}?`}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hosts</h1>
        <div className="flex items-center gap-2">
          {session?.role === "MANAGER" && (
            <BranchFilter
              value={branchFilter}
              onChange={(v) => {
                setBranchFilter(v);
                setPage(0);
              }}
            />
          )}
          <Button size="lg" onClick={startCreate}>
            <Plus /> New host
          </Button>
        </div>
      </div>

      <HostFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editingHost}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or department…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <SimpleSelect
          className="w-40"
          value={activeFilter}
          onChange={(v) => {
            setActiveFilter(v);
            setPage(0);
          }}
          placeholder="All statuses"
          options={[
            { value: "", label: "All statuses" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
      </div>

      <Card flat className="overflow-x-auto p-0">
        <DataTable
          columns={columns}
          data={hosts.data?.content ?? []}
          isLoading={hosts.isLoading}
          getRowKey={(host) => host.id}
          emptyMessage="No hosts found."
        />
      </Card>

      <PaginationFooter
        page={hosts.data}
        onPrevious={() => setPage((p) => Math.max(0, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        itemLabel="hosts"
      />
    </div>
  );
}
