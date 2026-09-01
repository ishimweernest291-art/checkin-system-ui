"use client";

import { useQuery } from "@tanstack/react-query";
import { SimpleSelect } from "@/components/ui/simple-select";
import { adminFetch } from "../../lib/api-admin";
import type { Branch } from "../../lib/types";

export function BranchFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (branchId: string) => void;
}) {
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => adminFetch<Branch[]>("/admin/branches"),
  });

  return (
    <SimpleSelect
      value={value}
      onChange={onChange}
      className="w-auto"
      placeholder="All branches"
      options={[
        { value: "", label: "All branches" },
        ...(branches ?? []).map((branch) => ({
          value: branch.id,
          label: branch.name,
        })),
      ]}
    />
  );
}
